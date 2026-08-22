#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

app=Path.cwd()/'generated'/'AstroSathi'
src=Path.cwd()/'mobile'
app_ts=app/'App.tsx'
native=app/'android/app/src/main/java/com/astrosathi/AstroNativeModule.kt'
pkg=app/'package.json'
if not app_ts.exists() or not native.exists() or not pkg.exists():
    raise SystemExit('Generated AstroSathi files missing for location patch')

# Offline coordinate -> IANA timezone helper. India is explicitly pinned to Asia/Kolkata.
shutil.copy2(src/'location.ts',app/'location.ts')
data=json.loads(pkg.read_text())
data.setdefault('dependencies',{})['@photostructure/tz-lookup']='11.6.1'
pkg.write_text(json.dumps(data,indent=2)+'\n')

# Native Android place search: Android Geocoder first, OSM Nominatim fallback.
kt=native.read_text()
kt=kt.replace('import android.hardware.biometrics.BiometricPrompt\n','import android.hardware.biometrics.BiometricPrompt\nimport android.location.Address\nimport android.location.Geocoder\n',1)
kt=kt.replace('import org.json.JSONObject\n','import org.json.JSONArray\nimport org.json.JSONObject\n',1)
kt=kt.replace('import java.nio.charset.StandardCharsets\n','import java.nio.charset.StandardCharsets\nimport java.net.HttpURLConnection\nimport java.net.URL\nimport java.net.URLEncoder\nimport java.util.Locale\nimport java.util.concurrent.Executors\n',1)
kt=kt.replace('    private val random = SecureRandom()\n','    private val random = SecureRandom()\n    @Volatile private var lastPlaceSearchAt = 0L\n',1)

marker='    @ReactMethod\n    fun requestNotificationPermission(p: Promise) {'
method=r'''    @ReactMethod
    fun searchBirthPlaces(query: String, p: Promise) {
        val q = query.trim()
        if (q.length < 2) {
            p.reject("PLACE_SEARCH", "Enter at least 2 characters of the village, town, district or PIN code.")
            return
        }
        synchronized(this) {
            val now = System.currentTimeMillis()
            if (now - lastPlaceSearchAt < 1100L) {
                p.reject("PLACE_SEARCH", "Please wait a moment before searching again.")
                return
            }
            lastPlaceSearchAt = now
        }
        Executors.newSingleThreadExecutor().execute {
            try {
                val out = Arguments.createArray()
                val seen = linkedSetOf<String>()
                var count = 0

                fun add(label: String, lat: Double, lon: Double, countryCode: String?, source: String) {
                    if (count >= 5 || lat !in -90.0..90.0 || lon !in -180.0..180.0) return
                    val clean = label.trim().replace(Regex("\\s+"), " ")
                    if (clean.isBlank()) return
                    val key = "${"%.5f".format(Locale.US, lat)},${"%.5f".format(Locale.US, lon)}"
                    if (!seen.add(key)) return
                    val m = Arguments.createMap()
                    m.putString("label", clean)
                    m.putDouble("latitude", lat)
                    m.putDouble("longitude", lon)
                    m.putString("countryCode", (countryCode ?: "IN").uppercase(Locale.US))
                    m.putString("source", source)
                    out.pushMap(m)
                    count++
                }

                fun addressLabel(a: Address): String {
                    val line = if (a.maxAddressLineIndex >= 0) a.getAddressLine(0) else null
                    if (!line.isNullOrBlank()) return line
                    return listOfNotNull(a.featureName, a.locality, a.subLocality, a.subAdminArea, a.adminArea, a.postalCode, a.countryName)
                        .map { it.trim() }.filter { it.isNotBlank() }.distinct().joinToString(", ")
                }

                if (Geocoder.isPresent()) {
                    try {
                        val geocoder = Geocoder(ctx, Locale("en", "IN"))
                        @Suppress("DEPRECATION")
                        val found = geocoder.getFromLocationName("$q, India", 5) ?: emptyList()
                        for (a in found) add(addressLabel(a), a.latitude, a.longitude, a.countryCode, "android")
                    } catch (_: Exception) { }
                }

                // One user-triggered fallback request only. No autocomplete/background scraping.
                if (count < 5) {
                    try {
                        val encoded = URLEncoder.encode(q, "UTF-8")
                        val url = URL("https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=5&q=$encoded")
                        val c = (url.openConnection() as HttpURLConnection).apply {
                            requestMethod = "GET"
                            connectTimeout = 7000
                            readTimeout = 7000
                            setRequestProperty("Accept", "application/json")
                            setRequestProperty("Accept-Language", "en-IN,en;q=0.8")
                            setRequestProperty("User-Agent", "AstroSathi/1.0 Android (github.com/Manas0606/imagehost)")
                        }
                        if (c.responseCode in 200..299) {
                            val body = c.inputStream.bufferedReader().use { it.readText() }
                            val arr = JSONArray(body)
                            for (i in 0 until arr.length()) {
                                val o = arr.optJSONObject(i) ?: continue
                                val lat = o.optString("lat").toDoubleOrNull() ?: continue
                                val lon = o.optString("lon").toDoubleOrNull() ?: continue
                                val address = o.optJSONObject("address")
                                val cc = address?.optString("country_code")?.uppercase(Locale.US) ?: "IN"
                                add(o.optString("display_name"), lat, lon, cc, "openstreetmap")
                            }
                        }
                        c.disconnect()
                    } catch (_: Exception) { }
                }

                ctx.runOnUiQueueThread {
                    if (count == 0) p.reject("PLACE_NOT_FOUND", "No matching place was found. Add district/state or PIN code and try again.")
                    else p.resolve(out)
                }
            } catch (e: Exception) {
                ctx.runOnUiQueueThread { p.reject("PLACE_SEARCH", e) }
            }
        }
    }

'''
if marker not in kt: raise SystemExit('Native notification marker not found')
kt=kt.replace(marker,method+marker,1)
for needle in ('fun searchBirthPlaces(', 'nominatim.openstreetmap.org/search', 'Geocoder.isPresent()'):
    if needle not in kt: raise SystemExit(f'Native location patch missing: {needle}')
native.write_text(kt)

# React Native UI + accurate timezone/offset integration.
t=app_ts.read_text()
t=t.replace("import{calculateChart,type Chart}from'./astrology';\n","import{calculateChart,type Chart}from'./astrology';\nimport{historicalOffsetMinutes,timezoneForLocation,type BirthPlaceResult}from'./location';\n",1)
t=t.replace("type Birth={date:string;time:string;place:string;latitude:string;longitude:string;tz:string};","type Birth={date:string;time:string;place:string;latitude:string;longitude:string;tz:string;timeZone?:string;countryCode?:string;locationVerified?:boolean;manualCoordinates?:boolean};",1)

calc_pattern=r"function normalizeKnownCity\(input:Birth\)\{.*?\n async function calc\(\)\{.*?\}\n const active=isPremiumUsable\(premium\);"
calc_repl="""function normalizeKnownCity(input:Birth){const key=input.place.trim().toLowerCase(),c=cities.find(x=>x[0].toLowerCase()===key);return c?{...input,place:c[0],latitude:c[1],longitude:c[2],tz:c[3],countryCode:'IN',timeZone:'Asia/Kolkata',locationVerified:true,manualCoordinates:false}:input}
 async function calc(){setBusy(true);try{let profile=normalizeKnownCity(birth);if(!profile.locationVerified)throw new Error('Search and select the correct birth village/place first, or confirm exact coordinates in Advanced mode.');const lat=+profile.latitude,lon=+profile.longitude;const zone=profile.timeZone||timezoneForLocation(lat,lon,profile.countryCode);const offset=historicalOffsetMinutes(profile.date,profile.time,zone);profile={...profile,timeZone:zone,tz:String(offset)};const c=calculateChart(profile.date,profile.time,lat,lon,offset);await AstroNative.saveBirthProfile(JSON.stringify(profile));setBirth(profile);setChart(c);setScreen('chart')}catch(e:any){Alert.alert('Birth Details',e.message||String(e))}finally{setBusy(false)}}
 const active=isPremiumUsable(premium);"""
t2,n=re.subn(calc_pattern,calc_repl,t,count=1,flags=re.S)
if n!=1: raise SystemExit('Birth calc v3 marker not found')
t=t2

birth_pattern=r"function BirthScreen\(\{t,birth,setBirth,busy,calc,back\}:any\)\{.*?\nfunction ChartScreen"
birth_repl=r'''function BirthScreen({t,birth,setBirth,busy,calc,back}:any){
 const[results,setResults]=useState<BirthPlaceResult[]>([]),[searching,setSearching]=useState(false),[advanced,setAdvanced]=useState(false);
 const set=(k:string)=>(v:string)=>{const reset=['place','latitude','longitude'].includes(k);setBirth({...birth,[k]:v,...(reset?{locationVerified:false}:{} )});if(k==='place')setResults([])};
 async function findPlace(){const q=birth.place.trim();if(q.length<2)return Alert.alert('Birth Place','Enter your village/town name. Add district, state or PIN code if the name is common.');setSearching(true);try{const found:BirthPlaceResult[]=await AstroNative.searchBirthPlaces(q);setResults(found)}catch(e:any){Alert.alert('Birth Place',e?.message||String(e))}finally{setSearching(false)}}
 function choose(r:BirthPlaceResult){try{const zone=timezoneForLocation(r.latitude,r.longitude,r.countryCode);let off=birth.tz||'330';try{off=String(historicalOffsetMinutes(birth.date,birth.time,zone))}catch{if((r.countryCode||'').toUpperCase()==='IN')off='330'}setBirth({...birth,place:r.label,latitude:r.latitude.toFixed(6),longitude:r.longitude.toFixed(6),tz:off,timeZone:zone,countryCode:r.countryCode||'IN',locationVerified:true,manualCoordinates:false});setResults([])}catch(e:any){Alert.alert('Birth Place',e?.message||String(e))}}
 function confirmManual(){try{const lat=+birth.latitude,lon=+birth.longitude;if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lon)||lon<-180||lon>180)throw new Error('Enter valid latitude and longitude.');const zone=timezoneForLocation(lat,lon,birth.countryCode);const off=historicalOffsetMinutes(birth.date,birth.time,zone);setBirth({...birth,timeZone:zone,tz:String(off),locationVerified:true,manualCoordinates:true});Alert.alert('Birth Place','Manual coordinates confirmed. The timezone and historical UTC offset were calculated automatically.')}catch(e:any){Alert.alert('Birth Place',e?.message||String(e))}}
 return<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.birth}</Text><Text style={s.muted}>For accurate Lagna and house calculations, select the actual birth village/town—not only the nearest big city.</Text><Field label="Birth date (YYYY-MM-DD)" value={birth.date} onChangeText={set('date')} placeholder="1995-06-15"/><Field label="Birth time" value={birth.time} onChangeText={set('time')} placeholder="2:30 AM or 14:30" autoCapitalize="characters" autoCorrect={false}/><Field label="Birth village / town / place" value={birth.place} onChangeText={set('place')} placeholder="e.g. Nuagaon, Ganjam, Odisha" autoCapitalize="words"/><Btn onPress={findPlace}>{searching?'Searching…':'⌖ Find exact birth place'}</Btn><Text style={s.small}>If several villages have the same name, include district/state or PIN code and select the correct result.</Text>{results.map((r,i)=><Pressable key={`${r.latitude}-${r.longitude}-${i}`} onPress={()=>choose(r)} style={s.card}><Text style={s.white}>{r.label}</Text><Text style={s.small}>{r.latitude.toFixed(6)}, {r.longitude.toFixed(6)} · {r.source==='openstreetmap'?'OpenStreetMap':'Android geocoder'}</Text><Text style={s.gold}>Tap to select this birthplace</Text></Pressable>)}{birth.locationVerified&&<Card><Text style={s.good}>✓ Birth location selected</Text><Text style={s.white}>{birth.place}</Text><Text style={s.small}>Latitude {birth.latitude} · Longitude {birth.longitude}</Text><Text style={s.small}>Timezone {birth.timeZone||'will be resolved'} · UTC offset is recalculated for the birth date/time before Kundli calculation.</Text></Card>}<View style={s.chips}>{cities.map(c=><Pressable key={c[0]} style={s.chip} onPress={()=>setBirth({...birth,place:c[0],latitude:c[1],longitude:c[2],tz:c[3],countryCode:'IN',timeZone:'Asia/Kolkata',locationVerified:true,manualCoordinates:false})}><Text style={s.chipText}>{c[0]}</Text></Pressable>)}</View><Pressable onPress={()=>setAdvanced(!advanced)}><Text style={s.link}>{advanced?'Hide advanced coordinates':'Advanced: enter exact coordinates manually'}</Text></Pressable>{advanced&&<Card><Text style={s.small}>Use this only if place search cannot find the village and you know the exact coordinates.</Text><View style={s.row}><Field containerStyle={{flex:1}} label="Latitude" value={birth.latitude} onChangeText={set('latitude')} keyboardType="numbers-and-punctuation"/><Field containerStyle={{flex:1}} label="Longitude" value={birth.longitude} onChangeText={set('longitude')} keyboardType="numbers-and-punctuation"/></View><Btn onPress={confirmManual}>Use these exact coordinates</Btn></Card>}<Text style={s.small}>Place search uses Android geocoding and, when needed, OpenStreetMap/Nominatim. © OpenStreetMap contributors.</Text><Btn onPress={calc}>{busy?'Calculating…':t.calc}</Btn></ScrollView>}
function ChartScreen'''
t2,n=re.subn(birth_pattern,birth_repl,t,count=1,flags=re.S)
if n!=1: raise SystemExit('Birth screen v3 marker not found')
t=t2

for needle in ("from'./location'", 'AstroNative.searchBirthPlaces', 'Find exact birth place', 'locationVerified', 'historicalOffsetMinutes'):
    if needle not in t: raise SystemExit(f'Birthplace UI patch missing: {needle}')
app_ts.write_text(t)
print('AstroSathi place search v3 installed: village search, selectable coordinates, automatic IANA timezone and historical UTC offset')

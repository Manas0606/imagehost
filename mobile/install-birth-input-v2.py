#!/usr/bin/env python3
from pathlib import Path

app = Path.cwd() / 'generated' / 'AstroSathi'
path = app / 'App.tsx'
if not path.exists():
    raise SystemExit('Generated App.tsx not found')
text = path.read_text()

old_calc = "async function calc(){setBusy(true);try{const c=calculateChart(birth.date,birth.time,+birth.latitude,+birth.longitude,+birth.tz);await AstroNative.saveBirthProfile(JSON.stringify(birth));setChart(c);setScreen('chart')}catch(e:any){Alert.alert('Birth Details',e.message||String(e))}finally{setBusy(false)}}"
new_calc = """function normalizeKnownCity(input:Birth){const key=input.place.trim().toLowerCase(),c=cities.find(x=>x[0].toLowerCase()===key);return c?{...input,place:c[0],latitude:c[1],longitude:c[2],tz:c[3]}:input}
 async function calc(){setBusy(true);try{const profile=normalizeKnownCity(birth);const c=calculateChart(profile.date,profile.time,+profile.latitude,+profile.longitude,+profile.tz);await AstroNative.saveBirthProfile(JSON.stringify(profile));setBirth(profile);setChart(c);setScreen('chart')}catch(e:any){Alert.alert('Birth Details',e.message||String(e))}finally{setBusy(false)}}"""
if old_calc not in text:
    raise SystemExit('Birth calc marker not found')
text = text.replace(old_calc, new_calc, 1)

old_birth = """function BirthScreen({t,birth,setBirth,busy,calc,back}:any){const set=(k:string)=>(v:string)=>setBirth({...birth,[k]:v});return<ScrollView keyboardShouldPersistTaps=\"handled\" contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.birth}</Text><Text style={s.muted}>Exact birth time matters. Use accurate coordinates and UTC offset.</Text><Field label=\"Birth date (YYYY-MM-DD)\" value={birth.date} onChangeText={set('date')} placeholder=\"1995-06-15\"/><Field label=\"Birth time (HH:MM)\" value={birth.time} onChangeText={set('time')} placeholder=\"08:30\"/><Field label=\"Birth place\" value={birth.place} onChangeText={set('place')}/><View style={s.row}><Field containerStyle={{flex:1}} label=\"Latitude\" value={birth.latitude} onChangeText={set('latitude')}/><Field containerStyle={{flex:1}} label=\"Longitude\" value={birth.longitude} onChangeText={set('longitude')}/></View><Field label=\"UTC offset minutes\" value={birth.tz} onChangeText={set('tz')}/><View style={s.chips}>{cities.map(c=><Pressable key={c[0]} style={s.chip} onPress={()=>setBirth({...birth,place:c[0],latitude:c[1],longitude:c[2],tz:c[3]})}><Text style={s.chipText}>{c[0]}</Text></Pressable>)}</View><Btn onPress={calc}>{busy?'Calculating…':t.calc}</Btn></ScrollView>}"""
new_birth = """function BirthScreen({t,birth,setBirth,busy,calc,back}:any){const set=(k:string)=>(v:string)=>{if(k==='place'){const c=cities.find(x=>x[0].toLowerCase()===v.trim().toLowerCase());if(c){setBirth({...birth,place:c[0],latitude:c[1],longitude:c[2],tz:c[3]});return}}setBirth({...birth,[k]:v})};return<ScrollView keyboardShouldPersistTaps=\"handled\" contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.birth}</Text><Text style={s.muted}>Exact birth time and location matter. Time accepts 2:30 AM, 2:30 PM, or 14:30. Enter accurate coordinates whenever possible.</Text><Field label=\"Birth date (YYYY-MM-DD)\" value={birth.date} onChangeText={set('date')} placeholder=\"1995-06-15\"/><Field label=\"Birth time\" value={birth.time} onChangeText={set('time')} placeholder=\"2:30 AM or 14:30\" autoCapitalize=\"characters\" autoCorrect={false}/><Field label=\"Birth place\" value={birth.place} onChangeText={set('place')} autoCapitalize=\"words\"/><View style={s.row}><Field containerStyle={{flex:1}} label=\"Latitude\" value={birth.latitude} onChangeText={set('latitude')} keyboardType=\"numbers-and-punctuation\"/><Field containerStyle={{flex:1}} label=\"Longitude\" value={birth.longitude} onChangeText={set('longitude')} keyboardType=\"numbers-and-punctuation\"/></View><Field label=\"UTC offset minutes\" value={birth.tz} onChangeText={set('tz')} keyboardType=\"numbers-and-punctuation\"/><Text style={s.small}>City buttons use approximate city-centre coordinates. For maximum accuracy, replace them with the exact birth-location coordinates if known.</Text><View style={s.chips}>{cities.map(c=><Pressable key={c[0]} style={s.chip} onPress={()=>setBirth({...birth,place:c[0],latitude:c[1],longitude:c[2],tz:c[3]})}><Text style={s.chipText}>{c[0]}</Text></Pressable>)}</View><Btn onPress={calc}>{busy?'Calculating…':t.calc}</Btn></ScrollView>}"""
if old_birth not in text:
    raise SystemExit('Birth screen marker not found')
text = text.replace(old_birth, new_birth, 1)

for needle in ('function normalizeKnownCity(', '2:30 AM, 2:30 PM, or 14:30', 'approximate city-centre coordinates'):
    if needle not in text:
        raise SystemExit(f'Birth input patch missing: {needle}')
path.write_text(text)
print('AstroSathi birth input v2 installed: AM/PM-friendly guidance + known-city coordinate synchronization')

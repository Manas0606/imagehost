#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/JyotishG/App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
text=path.read_text()
old="async function load(){try{const b:Boot=await AstroNative.getBootstrap();setBoot(b);if(b.birthProfile){const x=JSON.parse(b.birthProfile);setBirth(x);try{setChart(calculateChart(x.date,x.time,+x.latitude,+x.longitude,+x.tz))}catch{}}}catch(e:any){Alert.alert('Jyotish G',e?.message||String(e))}}"
new="""async function load(){try{const b:Boot=await AstroNative.getBootstrap();setBoot(b);if(b.birthProfile){const x:Birth=JSON.parse(b.birthProfile);setBirth(x);if(x.locationVerified){try{const lat=+x.latitude,lon=+x.longitude,zone=x.timeZone||timezoneForLocation(lat,lon,x.countryCode),off=historicalOffsetMinutes(x.date,x.time,zone);setBirth({...x,timeZone:zone,tz:String(off)});setChart(calculateChart(x.date,x.time,lat,lon,off))}catch{setChart(undefined)}}else setChart(undefined)}}catch(e:any){Alert.alert('Jyotish G',e?.message||String(e))}}"""
if old not in text: raise SystemExit('Saved birth-profile load marker not found')
text=text.replace(old,new,1)
for needle in ('if(x.locationVerified)', 'historicalOffsetMinutes(x.date,x.time,zone)', 'else setChart(undefined)'):
    if needle not in text: raise SystemExit(f'Verified birth load patch missing: {needle}')
path.write_text(text)
print('Jyotish G saved charts now require a verified birthplace and recalculate historical timezone offsets')

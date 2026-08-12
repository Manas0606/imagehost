#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

root=Path.cwd(); src=root/'mobile'; app=root/'generated'/'AstroSathi'
if not app.exists(): raise SystemExit('Generated React Native project not found')

for f in ('App.tsx','astrology.ts','premium.ts'):
    shutil.copy2(src/f,app/f)

# React Native 0.86 TypeScript compatibility fixes in the generated source.
app_ts=app/'App.tsx'
app_text=app_ts.read_text()
app_text=app_text.replace('fetchPremium(boot.deviceId,boot.email)','fetchPremium(boot!.deviceId,boot!.email)')
app_text=app_text.replace("...StyleSheet.absoluteFillObject,backgroundColor:'rgba(8,5,17,.52)'","position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(8,5,17,.52)'")
app_ts.write_text(app_text)

java=app/'android/app/src/main/java/com/astrosathi'; java.mkdir(parents=True,exist_ok=True)
for f in ('AstroNativeModule.kt','AstroNativePackage.kt'):
    shutil.copy2(src/f,java/f)

main=java/'MainApplication.kt'; text=main.read_text(); needle='PackageList(this).packages.apply {'
if needle not in text: raise SystemExit('PackageList block not found')
if 'add(AstroNativePackage())' not in text:
    text=text.replace(needle,needle+'\n              add(AstroNativePackage())',1)
main.write_text(text)

pkg=app/'package.json'; data=json.loads(pkg.read_text())
deps=data.setdefault('dependencies',{})
deps['astronomy-engine']='2.1.19'
deps['@react-native-google-signin/google-signin']='latest'
deps['react-native-safe-area-context']='latest'
deps['react-native-qrcode-svg']='latest'
deps['react-native-svg']='latest'
pkg.write_text(json.dumps(data,indent=2)+'\n')

res=app/'android/app/src/main/res'
strings=res/'values/strings.xml'
if strings.exists():
    strings.write_text(re.sub(r'<string name="app_name">.*?</string>','<string name="app_name">AstroSathi</string>',strings.read_text()))

# Royal-gold cosmic launcher: solar mandala.
drawable=res/'drawable'; drawable.mkdir(parents=True,exist_ok=True)
(drawable/'astrosathi_launcher.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#080511" android:pathData="M0,0h108v108h-108z"/>
    <path android:fillColor="#1A0E2B" android:pathData="M54,8A46,46 0,1 0,54 100A46,46 0,1 0,54 8"/>
    <path android:fillColor="#F2D17B" android:pathData="M52,2h4v12h-4z M52,94h4v12h-4z M2,52h12v4h-12z M94,52h12v4h-12z"/>
    <path android:fillColor="#F2D17B" android:pathData="M18,15l8,8l-3,3l-8,-8z M82,79l8,8l-3,3l-8,-8z M90,18l-8,8l-3,-3l8,-8z M26,82l-8,8l-3,-3l8,-8z"/>
    <path android:fillColor="#3A2058" android:pathData="M54,17A37,37 0,1 0,54 91A37,37 0,1 0,54 17"/>
    <path android:fillColor="#F2D17B" android:fillType="evenOdd"
        android:pathData="M54,27A27,27 0,1 0,54 81A27,27 0,1 0,54 27M54,34A20,20 0,1 1,54 74A20,20 0,1 1,54 34M54,47A7,7 0,1 0,54 61A7,7 0,1 0,54 47"/>
</vector>''')

manifest=app/'android/app/src/main/AndroidManifest.xml'
mt=manifest.read_text()
mt=re.sub(r'android:icon="[^"]+"','android:icon="@drawable/astrosathi_launcher"',mt)
mt=re.sub(r'android:roundIcon="[^"]+"','android:roundIcon="@drawable/astrosathi_launcher"',mt)
if 'android.permission.INTERNET' not in mt:
    mt=mt.replace('>','>\n    <uses-permission android:name="android.permission.INTERNET" />',1)
manifest.write_text(mt)

print('AstroSathi overlay installed: responsive safe-area UI, remote 6-hour premium, exact UPI QR, Google Sign-In support, Vedic branding')

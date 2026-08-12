#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

root=Path.cwd(); src=root/'mobile'; app=root/'generated'/'AstroSathi'
if not app.exists(): raise SystemExit('Generated React Native project not found')

for f in ('App.tsx','astrology.ts','premium.ts','auth.ts','guidance.ts'):
    shutil.copy2(src/f,app/f)

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
deps['react-native-safe-area-context']='latest'
deps['react-native-qrcode-svg']='latest'
deps['react-native-svg']='latest'
# Google Sign-In intentionally removed. AstroSathi uses email/password only.
deps.pop('@react-native-google-signin/google-signin',None)
pkg.write_text(json.dumps(data,indent=2)+'\n')

res=app/'android/app/src/main/res'
strings=res/'values/strings.xml'
if strings.exists():
    strings.write_text(re.sub(r'<string name="app_name">.*?</string>','<string name="app_name">AstroSathi</string>',strings.read_text()))

# Bright yellow-gold ॐ-inspired cosmic launcher.
drawable=res/'drawable'; drawable.mkdir(parents=True,exist_ok=True)
(drawable/'astrosathi_launcher.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#07030D" android:pathData="M0,0h108v108h-108z"/>
    <path android:fillColor="#1B0B28" android:pathData="M54,6A48,48 0,1 0,54 102A48,48 0,1 0,54 6"/>
    <path android:fillColor="#FFD64F" android:pathData="M52,0h4v13h-4z M52,95h4v13h-4z M0,52h13v4h-13z M95,52h13v4h-13z"/>
    <path android:fillColor="#FFD64F" android:pathData="M16,13l9,9l-3,3l-9,-9z M83,80l9,9l-3,3l-9,-9z M92,16l-9,9l-3,-3l9,-9z M25,83l-9,9l-3,-3l9,-9z"/>
    <path android:fillColor="#41225B" android:pathData="M54,16A38,38 0,1 0,54 92A38,38 0,1 0,54 16"/>
    <path android:fillColor="#FFD64F" android:fillType="evenOdd"
        android:pathData="M54,25A29,29 0,1 0,54 83A29,29 0,1 0,54 25M54,33A21,21 0,1 1,54 75A21,21 0,1 1,54 33M54,46A8,8 0,1 0,54 62A8,8 0,1 0,54 46"/>
</vector>''')

manifest=app/'android/app/src/main/AndroidManifest.xml'
mt=manifest.read_text()
mt=re.sub(r'android:icon="[^"]+"','android:icon="@drawable/astrosathi_launcher"',mt)
mt=re.sub(r'android:roundIcon="[^"]+"','android:roundIcon="@drawable/astrosathi_launcher"',mt)
permissions=[
 'android.permission.INTERNET',
 'android.permission.USE_BIOMETRIC',
 'android.permission.POST_NOTIFICATIONS'
]
for perm in permissions:
    if perm not in mt:
        mt=mt.replace('>',f'>\n    <uses-permission android:name="{perm}" />',1)
manifest.write_text(mt)

print('AstroSathi overlay installed: email auth, forgot password, duplicate registration guard, Vedic guidance, Telegram premium, notifications, PIN/pattern/biometric lock, bright-gold branding')

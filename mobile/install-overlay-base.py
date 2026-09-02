#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

root=Path.cwd(); src=root/'mobile'; app=root/'generated'/'JyotishG'
if not app.exists(): raise SystemExit('Generated React Native project not found')

for f in ('App.tsx','astrology.ts','premium.ts','auth.ts','guidance.ts'):
    shutil.copy2(src/f,app/f)

# Mobile auth hardening: scroll above keyboard + password visibility controls.
app_ts=app/'App.tsx'
app_text=app_ts.read_text()
app_text=app_text.replace(
    "<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>",
    "<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>"
)
app_text=app_text.replace(
    "<Field label={t.password} value={password} onChangeText={setPassword} secureTextEntry/>",
    "<PasswordField label={t.password} value={password} onChangeText={setPassword}/>"
)
app_text=app_text.replace(
    "<Field label={t.confirm} value={confirm} onChangeText={setConfirm} secureTextEntry/>",
    "<PasswordField label={t.confirm} value={confirm} onChangeText={setConfirm}/>"
)
# Lock PIN remains intentionally obscured; only account password inputs get eye controls.
field_marker="function Field({label,containerStyle,multiline,...p}:any){return<View style={[s.field,containerStyle]}><Text style={s.label}>{label}</Text><TextInput {...p} multiline={multiline} placeholderTextColor=\"#756b83\" selectionColor=\"#ffd64f\" style={[s.input,multiline&&s.inputMulti]}/></View>}"
password_component="""function PasswordField({label,value,onChangeText}:any){const[visible,setVisible]=useState(false);return<View style={s.field}><Text style={s.label}>{label}</Text><View style={s.passwordWrap}><TextInput value={value} onChangeText={onChangeText} secureTextEntry={!visible} autoCapitalize=\"none\" autoCorrect={false} textContentType=\"password\" placeholderTextColor=\"#756b83\" selectionColor=\"#ffd64f\" style={[s.input,s.passwordInput]}/><Pressable accessibilityRole=\"button\" accessibilityLabel={visible?'Hide password':'Show password'} hitSlop={10} onPress={()=>setVisible(!visible)} style={s.eyeBtn}><Text style={s.eyeText}>{visible?'🙈':'👁'}</Text></Pressable></View></View>}\n"""
if 'function PasswordField(' not in app_text:
    if field_marker not in app_text: raise SystemExit('Field component marker not found')
    app_text=app_text.replace(field_marker,password_component+field_marker)
app_text=app_text.replace(
    "authScroll:{flexGrow:1,justifyContent:'center',padding:22,paddingVertical:32}",
    "authScroll:{flexGrow:1,justifyContent:'flex-start',paddingHorizontal:22,paddingTop:26,paddingBottom:220}"
)
app_text=app_text.replace(
    "inputMulti:{height:120,minHeight:120,paddingTop:14,textAlignVertical:'top'},btn:",
    "inputMulti:{height:120,minHeight:120,paddingTop:14,textAlignVertical:'top'},passwordWrap:{position:'relative',width:'100%'},passwordInput:{paddingRight:58},eyeBtn:{position:'absolute',right:4,top:3,width:50,height:50,alignItems:'center',justifyContent:'center'},eyeText:{fontSize:21},btn:"
)

# Security hardening: re-lock a protected app whenever it returns from the background,
# and refresh premium immediately on foreground so a remote stop is applied quickly.
app_text=app_text.replace(
    "ActivityIndicator,Alert,Image,KeyboardAvoidingView",
    "ActivityIndicator,Alert,AppState,Image,KeyboardAvoidingView",
    1
)
app_text=app_text.replace(
    "const prevPremium=useRef<string>('checking'),t=T[l];",
    "const prevPremium=useRef<string>('checking'),appState=useRef(AppState.currentState),t=T[l];",
    1
)
lock_effect=" useEffect(()=>{if(boot?.loggedIn&&boot.lockMode&&boot.lockMode!=='none')setLocked(true)},[boot?.loggedIn,boot?.lockMode]);"
background_effect=""" useEffect(()=>{const sub=AppState.addEventListener('change',next=>{const wasBackground=appState.current==='background'||appState.current==='inactive';if(wasBackground&&next==='active'&&boot?.loggedIn){fetchPremium(boot.deviceId,boot.email).then(setPremium).catch(()=>{});if(boot.lockMode&&boot.lockMode!=='none'){setLockSecret('');setPattern([]);setLocked(true)}}appState.current=next});return()=>sub.remove()},[boot?.loggedIn,boot?.deviceId,boot?.email,boot?.lockMode]);"""
if lock_effect not in app_text: raise SystemExit('App lock effect marker not found')
app_text=app_text.replace(lock_effect,lock_effect+'\n'+background_effect,1)

# A biometric lock is saved only after Android proves biometric authentication works.
old_setlock="await AstroNative.setAppLock(mode,mode==='pattern'?pattern.join('-'):secret);"
new_setlock="if(mode==='biometric')await AstroNative.authenticateBiometric();await AstroNative.setAppLock(mode,mode==='pattern'?pattern.join('-'):secret);"
if old_setlock not in app_text: raise SystemExit('Biometric lock marker not found')
app_text=app_text.replace(old_setlock,new_setlock,1)

# Fail the release build if a future source edit silently prevents any hardening patch.
required=(
    "behavior={Platform.OS==='ios'?'padding':'height'}",
    'function PasswordField(',
    'AppState.addEventListener',
    "if(mode==='biometric')await AstroNative.authenticateBiometric()",
)
for needle in required:
    if needle not in app_text: raise SystemExit(f'Generated app hardening missing: {needle}')
app_ts.write_text(app_text)

java=app/'android/app/src/main/java/com/jyotishg'; java.mkdir(parents=True,exist_ok=True)
for f in ('AstroNativeModule.kt','AstroNativePackage.kt'):
    shutil.copy2(src/f,java/f)

main_candidates=list((app/'android/app/src/main/java').rglob('MainApplication.kt'))
main=next((p for p in main_candidates if 'package com.jyotishg' in p.read_text()), None)
if main is None:
    raise SystemExit('MainApplication.kt for com.jyotishg not found')
text=main.read_text(); needle='PackageList(this).packages.apply {'
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
# Google Sign-In intentionally removed. Jyotish G uses email/password only.
deps.pop('@react-native-google-signin/google-signin',None)
pkg.write_text(json.dumps(data,indent=2)+'\n')

res=app/'android/app/src/main/res'
strings=res/'values/strings.xml'
if strings.exists():
    strings.write_text(re.sub(r'<string name="app_name">.*?</string>','<string name="app_name">Jyotish G</string>',strings.read_text()))

# Bright yellow-gold ॐ-inspired cosmic launcher.
drawable=res/'drawable'; drawable.mkdir(parents=True,exist_ok=True)
(drawable/'jyotishg_launcher.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
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
mt=re.sub(r'android:icon="[^"]+"','android:icon="@drawable/jyotishg_launcher"',mt)
mt=re.sub(r'android:roundIcon="[^"]+"','android:roundIcon="@drawable/jyotishg_launcher"',mt)
# Force the focused auth field to remain visible when the software keyboard opens.
if 'android:windowSoftInputMode=' in mt:
    mt=re.sub(r'android:windowSoftInputMode="[^"]+"','android:windowSoftInputMode="adjustResize"',mt)
else:
    mt=mt.replace('<activity ','<activity android:windowSoftInputMode="adjustResize" ',1)
permissions=[
 'android.permission.INTERNET',
 'android.permission.USE_BIOMETRIC',
 'android.permission.POST_NOTIFICATIONS'
]
for perm in permissions:
    if perm not in mt:
        mt=mt.replace('>',f'>\n    <uses-permission android:name="{perm}" />',1)
manifest.write_text(mt)

print('Jyotish G overlay installed: keyboard-safe auth, password eye controls, safe-area UI, absolute auth callbacks, email auth, forgot password, duplicate registration guard, Vedic guidance, 15-second Telegram premium control, foreground premium refresh, notifications, background re-lock, validated PIN/pattern/biometric lock, bright-gold branding')

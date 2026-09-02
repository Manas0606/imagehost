#!/usr/bin/env python3
from pathlib import Path
import re

path=Path.cwd()/'generated/JyotishG/App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
text=path.read_text()
pattern=r"function LockSettings\(.*?\nfunction PatternGrid"
replacement=r'''function LockSettings({t,boot,secret,setSecret,setLock,remove,back}:any){const legacyPattern=boot.lockMode==='pattern';return<ScrollView contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.lock}</Text><Card><Text style={s.gold}>Current lock: {(boot.lockMode||'none').toUpperCase()}</Text><Text style={s.muted}>Use a 4–6 digit PIN or device biometric lock. The PIN secret is protected using Android Keystore-backed encrypted storage.</Text></Card>{legacyPattern&&<Card><Text style={s.gold}>Pattern lock migration</Text><Text style={s.muted}>This device still has the older Pattern Lock configured. Unlock with it as usual, then set a PIN below to replace it. New Pattern Locks can no longer be created.</Text></Card>}<Field label="New 4–6 digit PIN" value={secret} onChangeText={setSecret} keyboardType="number-pad" secureTextEntry/><Btn onPress={()=>setLock('pin',secret)}>Enable PIN Lock</Btn><Btn onPress={()=>setLock('biometric')}>Enable Fingerprint / Face</Btn>{boot.lockMode!=='none'&&<Btn secondary onPress={remove}>Disable App Lock</Btn>}</ScrollView>}
function PatternGrid'''
new,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit('LockSettings function marker not found')
# PatternGrid stays only for users upgrading from an already-configured legacy pattern, so they are not locked out.
section=re.search(r"function LockSettings\(.*?\nfunction PatternGrid",new,re.S)
if not section: raise SystemExit('Updated LockSettings not found')
settings=section.group(0)
if 'Save Pattern' in settings or '<PatternGrid' in settings: raise SystemExit('Pattern creation still visible in Settings')
if 'Enable PIN Lock' not in settings: raise SystemExit('PIN lock option missing')
path.write_text(new)
print('Jyotish G security settings updated: Pattern Lock creation removed; PIN and biometric remain, with legacy-pattern migration support')

#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
root=Path.cwd(); src=root/'mobile'; app=root/'generated'/'AstroSathi'
if not app.exists(): raise SystemExit('Generated React Native project not found')
for f in ('App.tsx','astrology.ts'): shutil.copy2(src/f,app/f)
java=app/'android/app/src/main/java/com/astrosathi'; java.mkdir(parents=True,exist_ok=True)
for f in ('AstroNativeModule.kt','AstroNativePackage.kt'): shutil.copy2(src/f,java/f)
main=java/'MainApplication.kt'; text=main.read_text(); needle='PackageList(this).packages.apply {'
if needle not in text: raise SystemExit('PackageList block not found')
if 'add(AstroNativePackage())' not in text: text=text.replace(needle,needle+'\n              add(AstroNativePackage())',1)
main.write_text(text)
pkg=app/'package.json'; data=json.loads(pkg.read_text()); data.setdefault('dependencies',{})['astronomy-engine']='2.1.19'; pkg.write_text(json.dumps(data,indent=2)+'\n')
strings=app/'android/app/src/main/res/values/strings.xml'
if strings.exists(): strings.write_text(re.sub(r'<string name="app_name">.*?</string>','<string name="app_name">AstroSathi</string>',strings.read_text()))
print('AstroSathi overlay installed')

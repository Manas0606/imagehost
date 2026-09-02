#!/usr/bin/env python3
from pathlib import Path
import shutil

app=Path.cwd()/'generated'/'JyotishG'
path=app/'guidance.ts'
if not path.exists(): raise SystemExit('Generated guidance.ts not found')
text=path.read_text()
text=text.replace("SOFT_BENEFIC.has(name)?.55","SOFT_BENEFIC.has(name)?0.55")
text=text.replace("tr(lang,'supportive with some conditions','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ')","tr(lang,'supportive with some conditions','कुछ शर्तों के साथ सहायक','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ')")
# Avoid matching the short word "ex" inside unrelated words like "exactly".
text=text.replace(",\'breakup\',\'ex\',\'relationship\'",",\'breakup\',\'my ex\',\'ex boyfriend\',\'ex girlfriend\',\'relationship\'")
if "SOFT_BENEFIC.has(name)?0.55" not in text: raise SystemExit('Guidance score patch missing')
if "'my ex','ex boyfriend','ex girlfriend'" not in text: raise SystemExit('Follow-up intent patch missing')
path.write_text(text)
src=Path(__file__).resolve().parent/'accuracy-tests.ts'
if not src.exists(): raise SystemExit('Jyotish G regression test source missing')
shutil.copy2(src,app/'accuracy-tests.ts')
print('Jyotish G generated guidance source corrected and regression checks installed')

#!/usr/bin/env python3
from pathlib import Path

app=Path.cwd()/'generated'/'AstroSathi'
path=app/'guidance.ts'
if not path.exists(): raise SystemExit('Generated guidance.ts not found')
text=path.read_text()
text=text.replace("SOFT_BENEFIC.has(name)?.55","SOFT_BENEFIC.has(name)?0.55")
text=text.replace("tr(lang,'supportive with some conditions','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ')","tr(lang,'supportive with some conditions','कुछ शर्तों के साथ सहायक','କିଛି ଶର୍ତ୍ତ ସହିତ ସହାୟକ')")
if "SOFT_BENEFIC.has(name)?0.55" not in text: raise SystemExit('Guidance score patch missing')
path.write_text(text)
print('AstroSathi generated guidance source corrected')

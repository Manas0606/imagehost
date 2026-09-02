#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/JyotishG/mini-ai.ts'
if not path.exists(): raise SystemExit('Generated Mini-AI core not found')
text=path.read_text()
old="if(has('ex','reconcile','come back','return to me','वापस आए','पैच अप','ପୁଣି ଫେରିବ','ମିଳନ'))return'reconciliation';"
new="if(/(^|\\s)ex(\\s|$)/i.test(s)||has('reconcile','come back','return to me','former partner','वापस आए','पैच अप','एक्स','ପୁଣି ଫେରିବ','ପୂର୍ବ ସାଥୀ','ମିଳନ'))return'reconciliation';"
if old not in text: raise SystemExit('Core Mini-AI ex marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('Jyotish G core Mini-AI now matches ex only as an explicit token')

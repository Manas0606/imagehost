#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/AstroSathi/local-ai-model.ts'
if not path.exists(): raise SystemExit('Generated local AI model not found')
text=path.read_text()
old="if(/\\b(ex|former partner)\\b|एक्स|ପୂର୍ବ ସାଥୀ/iu.test(norm(question))) {topic='love';focus='reconciliation'}\n return{topic,intent,focus,topicConfidence:Math.max(0,Math.min(1,t.score+.25*t.margin)),intentConfidence:Math.max(0,Math.min(1,i.score+.25*i.margin)),focusConfidence:focus==='none'?1-Math.max(0,f.score):Math.max(0,Math.min(1,f.score+.25*f.margin))};"
new="const explicitRecon=/\\b(ex|former partner|reconcile|reconciliation|patch up|patchup|come back)\\b|एक्स|वापस आ|पैच अप|ପୂର୍ବ ସାଥୀ|ପୁନଃମିଳନ|ପୁଣି ଫେର/iu.test(norm(question));\n if(explicitRecon){topic='love';focus='reconciliation'}else if(focus==='reconciliation')focus='none';\n return{topic,intent,focus,topicConfidence:Math.max(0,Math.min(1,t.score+.25*t.margin)),intentConfidence:Math.max(0,Math.min(1,i.score+.25*i.margin)),focusConfidence:focus==='none'?1-Math.max(0,f.score):Math.max(0,Math.min(1,f.score+.25*f.margin))};"
if old not in text: raise SystemExit('Reconciliation guard marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('AstroSathi learned model requires explicit reconciliation language; exact/next cannot match ex')

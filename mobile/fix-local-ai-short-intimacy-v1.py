#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/AstroSathi/local-ai-model.ts'
if not path.exists(): raise SystemExit('Generated local AI model not found')
text=path.read_text()
old="if(/^(kiss|kissing|hug|romance|सेक्स|किस|ଚୁମ୍ବନ|ଯୌନ)$/iu.test(norm(question))){topic='love';focus='intimacy';if(intent==='forecast')intent='current'}"
new="if(/^(kiss|kissing|hug|romance|sex|sexual|intimacy|सेक्स|किस|अंतरंग|ଚୁମ୍ବନ|ଯୌନ|ଅନ୍ତରଙ୍ଗ)$/iu.test(norm(question))){topic='love';focus='intimacy';if(intent==='forecast')intent='current'}"
if old not in text: raise SystemExit('Short intimacy anchor marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('AstroSathi learned local AI anchors short English/Hindi/Odia intimacy terms')

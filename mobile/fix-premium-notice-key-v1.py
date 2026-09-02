#!/usr/bin/env python3
from pathlib import Path
path=Path.cwd()/'generated/JyotishG/App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
text=path.read_text()
old="const key=`${st.kind}|${st.requestId||''}|${st.approvedAt||''}|${st.expiresAt||''}|${st.message||''}`;"
new="const identity=st.requestId||String(st.approvedAt||st.expiresAt||'legacy');const key=`${st.kind}|${identity}`;"
if old not in text: raise SystemExit('Premium notice identity marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('Jyotish G premium notification identity is keyed by request so the same approval never repeats')

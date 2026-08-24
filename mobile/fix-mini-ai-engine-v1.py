#!/usr/bin/env python3
from pathlib import Path
import shutil

root=Path.cwd(); app=root/'generated'/'AstroSathi'; src=root/'mobile'; path=app/'App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found for Mini-AI wrapper')
shutil.copy2(src/'mini-ai-engine.ts',app/'mini-ai-engine.ts')
text=path.read_text()
old="import{askMiniAI,type MiniAnswer,type MiniContext}from'./mini-ai';"
new="import{askMiniAI,type MiniAnswer,type MiniContext}from'./mini-ai-engine';"
if old not in text: raise SystemExit('Mini-AI import wrapper marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('AstroSathi uses hardened Mini-AI semantic wrapper')

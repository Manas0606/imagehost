#!/usr/bin/env python3
from pathlib import Path
import shutil

root=Path.cwd(); app=root/'generated'/'AstroSathi'; src=root/'mobile'; path=app/'App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found for Mini-AI wrapper')
shutil.copy2(src/'mini-ai-engine.ts',app/'mini-ai-engine.ts')
shutil.copy2(src/'local-ai-model.ts',app/'local-ai-model.ts')
shutil.copy2(src/'local-ai-regression.ts',app/'local-ai-regression.ts')
shutil.copy2(src/'chat-engine-regression.ts',app/'chat-engine-regression.ts')
text=path.read_text()
old="import{askMiniAI,type MiniAnswer,type MiniContext}from'./mini-ai';"
new="import{askMiniAI,type MiniAnswer,type MiniContext}from'./mini-ai-engine';"
if old not in text: raise SystemExit('Mini-AI import wrapper marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('AstroSathi uses learned offline semantic model + context-safe multilingual chat engine')

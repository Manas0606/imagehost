#!/usr/bin/env python3
from pathlib import Path
path=Path.cwd()/'generated/AstroSathi/App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
text=path.read_text()
old="const prevPremium=useRef<string>('checking'),appState=useRef(AppState.currentState),t=T[l];"
new="const prevPremium=useRef<string>('checking'),t=T[l];\n const appState=useRef(AppState.currentState);"
if old not in text: raise SystemExit('AppState declaration preparation marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('AstroSathi Mini-AI declaration preparation completed')

#!/usr/bin/env python3
from pathlib import Path

app=Path.cwd()/'generated/AstroSathi'
model=app/'local-ai-model.ts'; ui=app/'App.tsx'
if not model.exists() or not ui.exists(): raise SystemExit('Generated local AI files missing')
text=model.read_text()
text=text.replace("type Example={text:string;topic:GuidanceTopic;intent:LocalIntent;focus:LocalFocus};","type Example=[string,GuidanceTopic,LocalIntent,LocalFocus];",1)
old="for(const e of E){const x=vec(e.text);for(let i=0;i<DIM;i++){topicC[e.topic][i]+=x[i];intentC![e.intent][i]+=x[i];if(e.focus!=='none')focusC[e.focus]![i]+=x[i]}countsT[e.topic]=(countsT[e.topic]||0)+1;countsI[e.intent]=(countsI[e.intent]||0)+1;if(e.focus!=='none')countsF[e.focus]=(countsF[e.focus]||0)+1}"
new="for(const e of E){const [text,topic,intent,focus]=e,x=vec(text);for(let i=0;i<DIM;i++){topicC[topic][i]+=x[i];intentC![intent][i]+=x[i];if(focus!=='none')focusC[focus]![i]+=x[i]}countsT[topic]=(countsT[topic]||0)+1;countsI[intent]=(countsI[intent]||0)+1;if(focus!=='none')countsF[focus]=(countsF[focus]||0)+1}"
if old not in text: raise SystemExit('Local AI training loop marker not found')
text=text.replace(old,new,1)
model.write_text(text)
apptext=ui.read_text()
if 'function durationLabel(' not in apptext:
    marker='function PremiumScreen'
    helper="function durationLabel(minutes:number){const m=Math.max(1,Math.round(minutes));if(m%60===0){const h=m/60;return`${h} hour${h===1?'':'s'}`}return`${m} minutes`}\n"
    if marker not in apptext: raise SystemExit('Premium screen marker missing')
    apptext=apptext.replace(marker,helper+marker,1)
ui.write_text(apptext)
print('AstroSathi local AI typing and Premium duration helper corrected')

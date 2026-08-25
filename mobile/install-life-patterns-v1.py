#!/usr/bin/env python3
from pathlib import Path
import shutil

root=Path.cwd(); src=root/'mobile'; app=root/'generated'/'AstroSathi'; path=app/'App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
for f in ('life-patterns.ts','life-patterns-regression.ts'):
    shutil.copy2(src/f,app/f)
text=path.read_text()
imp="import{buildLifePatterns}from'./life-patterns';\n"
if imp not in text:
    marker="import{calculateChart,type Chart}from'./astrology';\n"
    if marker not in text: raise SystemExit('Astrology import marker not found')
    text=text.replace(marker,marker+imp,1)
needle="<KundliMeaning chart={chart} l={l}/><Card><Text style={s.gold}>{ui.calc}</Text>"
replacement="<KundliMeaning chart={chart} l={l}/><LifePatternsCard chart={chart} l={l}/><Card><Text style={s.gold}>{ui.calc}</Text>"
if needle not in text: raise SystemExit('Kundli meaning insertion marker not found')
text=text.replace(needle,replacement,1)
marker='function KundliMeaning({chart,l}:any)'
component=r'''function LifePatternsCard({chart,l}:any){const r=buildLifePatterns(chart,l);const u=l==='hi'?{nature:'आपका स्वभाव',now:'अभी आप किन बातों से गुजर रहे हो सकते हैं',recent:'हाल के समय के संकेत',next:'आगे का निकट चरण',why:'यह निष्कर्ष किन संकेतों से निकला'}:l==='or'?{nature:'ଆପଣଙ୍କ ସ୍ୱଭାବ',now:'ଏବେ ଆପଣ କେଉଁ ପରିସ୍ଥିତି ମଧ୍ୟରୁ ଯାଉଥାଇପାରନ୍ତି',recent:'ସମ୍ପ୍ରତିକ ସମୟର ସଙ୍କେତ',next:'ନିକଟ ଭବିଷ୍ୟତର ପରବର୍ତ୍ତୀ ପର୍ଯ୍ୟାୟ',why:'ଏହି ବ୍ୟାଖ୍ୟା କେଉଁ ସଙ୍କେତରୁ ଆସିଛି'}:{nature:'Your nature',now:'What you may be facing now',recent:'Recent-period clues',next:'Near-term next phase',why:'Why AstroSathi says this'};return<View style={{gap:12}}><Card><Text style={s.gold}>{r.title.toUpperCase()}</Text><Text style={s.cardTitle}>{r.subtitle}</Text></Card><Section title={u.nature} items={r.nature}/><Section title={u.now} items={r.current}/><Section title={u.recent} items={r.recent}/><Section title={u.next} items={r.nearTerm}/><Section title={u.why} items={r.evidence}/><Card><Text style={s.disc}>{r.disclaimer}</Text></Card></View>}
'''
if marker not in text: raise SystemExit('KundliMeaning function marker not found')
text=text.replace(marker,component+marker,1)
for required in ("import{buildLifePatterns}from'./life-patterns';",'<LifePatternsCard chart={chart} l={l}/>','function LifePatternsCard('):
    if required not in text: raise SystemExit(f'Life-pattern UI missing: {required}')
path.write_text(text)
print('AstroSathi chart prediction overlay installed: nature, current pressures, recent-period clues and near-term chart-derived themes')

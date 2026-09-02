#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/JyotishG/mini-ai.ts'
if not path.exists(): raise SystemExit('Generated Mini-AI core not found')
text=path.read_text()
old="function intentFor(q:string,previous?:MiniContext){const c=classify(q,INTENT_PROTO);if(c.score>=2.25)return c.label;if(previous&&tokens(q).length<=7)return previous.intent;return'forecast'}"
new="""function intentFor(q:string,previous?:MiniContext){const s=normalize(q);if(/(^|\\s)(when|what time|which month|how soon|kab|kebe)(\\s|$)|कब|कबतक|कब तक|कौन.?सा महीना|କେବେ|କେତେବେଳେ|କେଉଁ ମାସ/i.test(s))return'timing';if(/(^|\\s)(why|reason|cause|kyun|kahinki)(\\s|$)|क्यों|कारण|କାହିଁକି|କାରଣ/i.test(s))return'cause';if(/(^|\\s)(remedy|puja|mantra|upay)(\\s|$)|पूजा|उपाय|मंत्र|ପୂଜା|ଉପାୟ|ମନ୍ତ୍ର/i.test(s))return'remedy';if(/(^|\\s)(or|versus|vs|better|which)(\\s|$)| या |बेहतर|कौन| ନା | କି |କେଉଁଟି/i.test(` ${s} `))return'comparison';if(/(^|\\s)(now|currently|today)(\\s|$)|अभी|वर्तमान|फिलहाल|ଏବେ|ବର୍ତ୍ତମାନ/i.test(s))return'current';if(/(^|\\s)(should i|what should i do)(\\s|$)|क्या करूं|करना चाहिए|କଣ କରିବି|କଣ କରିବା ଉଚିତ/i.test(s))return'advice';const c=classify(q,INTENT_PROTO);if(c.score>=2.25)return c.label;if(previous&&tokens(q).length<=7)return previous.intent;return'forecast'}"""
if old not in text: raise SystemExit('Core Mini-AI intent marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('Jyotish G core Mini-AI prioritizes explicit English/Hindi/Odia question intent')

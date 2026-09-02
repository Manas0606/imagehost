#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/JyotishG/local-ai-model.ts'
if not path.exists(): raise SystemExit('Generated local AI model not found')
text=path.read_text()
context_old="if(previous&&wordCount<=7&&t.score<.28)topic=previous.topic;\n if(previous&&wordCount<=5&&i.score<.23)intent=previous.intent;"
context_new="const explicitTopic=/\\b(job|career|employment|promotion|marriage|marry|wedding|spouse|love|relationship|girlfriend|boyfriend|breakup|money|finance|salary|loan|debt|study|education|exam|business|startup|foreign|abroad|travel|visa|child|children|baby|property|house|land|family|parents|health|illness|disease|spiritual|puja|mantra|remedy)\\b|नौकरी|करियर|शादी|विवाह|जीवनसाथी|प्यार|प्रेम|रिश्ता|पैसा|कर्ज|पढ़ाई|शिक्षा|परीक्षा|बिजनेस|व्यापार|विदेश|वीजा|संतान|बच्चा|संपत्ति|घर|परिवार|स्वास्थ्य|बीमारी|पूजा|मंत्र|उपाय|ଚାକିରି|କ୍ୟାରିୟର|ବିବାହ|ଜୀବନସାଥୀ|ପ୍ରେମ|ସମ୍ପର୍କ|ଟଙ୍କା|ଋଣ|ପଢ଼ା|ପରୀକ୍ଷା|ବ୍ୟବସାୟ|ବିଦେଶ|ଭିସା|ସନ୍ତାନ|ଘର|ଜମି|ପରିବାର|ସ୍ୱାସ୍ଥ୍ୟ|ପୂଜା|ମନ୍ତ୍ର/iu.test(norm(question));\n if(previous&&wordCount<=8&&!explicitTopic)topic=previous.topic;\n else if(previous&&wordCount<=7&&t.score<.28)topic=previous.topic;\n if(previous&&wordCount<=5&&i.score<.23)intent=previous.intent;"
if context_old not in text: raise SystemExit('Learned context marker not found')
text=text.replace(context_old,context_new,1)
old="if(/\\b(ex|former partner)\\b|एक्स|ପୂର୍ବ ସାଥୀ/iu.test(norm(question))) {topic='love';focus='reconciliation'}\n return{topic,intent,focus,topicConfidence:Math.max(0,Math.min(1,t.score+.25*t.margin)),intentConfidence:Math.max(0,Math.min(1,i.score+.25*i.margin)),focusConfidence:focus==='none'?1-Math.max(0,f.score):Math.max(0,Math.min(1,f.score+.25*f.margin))};"
new="const explicitRecon=/\\b(ex|former partner|reconcile|reconciliation|patch up|patchup|come back)\\b|एक्स|वापस आ|पैच अप|ପୂର୍ବ ସାଥୀ|ପୁନଃମିଳନ|ପୁଣି ଫେର/iu.test(norm(question));\n if(explicitRecon){topic='love';focus='reconciliation'}else if(focus==='reconciliation')focus='none';\n return{topic,intent,focus,topicConfidence:Math.max(0,Math.min(1,t.score+.25*t.margin)),intentConfidence:Math.max(0,Math.min(1,i.score+.25*i.margin)),focusConfidence:focus==='none'?1-Math.max(0,f.score):Math.max(0,Math.min(1,f.score+.25*f.margin))};"
if old not in text: raise SystemExit('Reconciliation guard marker not found')
text=text.replace(old,new,1)
path.write_text(text)
print('Jyotish G learned model preserves short follow-up context and requires explicit reconciliation language')

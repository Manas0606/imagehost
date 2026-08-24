import type {Chart} from './astrology';
import {askMiniAI as coreAsk,type MiniAnswer,type MiniContext} from './mini-ai';
import type {GuidanceLanguage} from './guidance';

export type {MiniAnswer,MiniContext} from './mini-ai';

const explicitReconciliation=(q:string)=>/(^|\s)(ex|एक्स)(\s|$)|reconcil|patch\s*up|come\s+back|return\s+to\s+me|वापस\s+आ|पैच\s*अप|ପୁଣି\s+ଫେର|ପୁନଃମିଳନ/i.test(q.normalize('NFKC'));

function semanticHints(question:string){
  const q=question.normalize('NFKC');
  const hints:string[]=[];
  // Topic hints are intentionally based on explicit user words only. They make
  // English/Hindi/Odia and common Romanised questions deterministic without a network model.
  if(/\b(job|career|employment|promotion|interview)\b|नौकरी|करियर|रोजगार|प्रमोशन|चाकरी|ଚାକିରି|କ୍ୟାରିୟର|ନିଯୁକ୍ତି|ପ୍ରମୋସନ/i.test(q))hints.push('job career employment');
  if(/\b(marriage|marry|wedding|spouse)\b|शादी|विवाह|जीवनसाथी|ବିବାହ|ଜୀବନସାଥୀ/i.test(q))hints.push('marriage wedding spouse');
  if(/\b(love|relationship|girlfriend|boyfriend|breakup|romance|intimacy|sexual|sex)\b|प्यार|प्रेम|रिश्ता|ब्रेकअप|सेक्स|अंतरंग|ପ୍ରେମ|ସମ୍ପର୍କ|ବ୍ରେକଅପ|ଯୌନ|ଅନ୍ତରଙ୍ଗ/i.test(q))hints.push('love relationship intimacy');
  if(/\b(money|finance|income|salary|wealth|loan|debt)\b|पैसा|धन|आय|कर्ज|लोन|ଟଙ୍କା|ଧନ|ଆୟ|ଋଣ|ଲୋନ/i.test(q))hints.push('money finance income');
  if(/\b(study|education|exam|college|school|result)\b|पढ़ाई|शिक्षा|परीक्षा|रिजल्ट|ପଢ଼ା|ଶିକ୍ଷା|ପରୀକ୍ଷା|ଫଳ/i.test(q))hints.push('study exam education');
  if(/\b(problem|obstacle|delay|struggle|trouble)\b|समस्या|बाधा|देरी|परेशानी|ସମସ୍ୟା|ବାଧା|ବିଳମ୍ବ|କଷ୍ଟ/i.test(q))hints.push('problem obstacle delay');
  if(/\b(business|startup|company|shop)\b|व्यापार|बिजनेस|कंपनी|ବ୍ୟବସାୟ|ଷ୍ଟାର୍ଟଅପ|କମ୍ପାନୀ/i.test(q))hints.push('business startup company');
  if(/\b(foreign|abroad|travel|visa|relocation|overseas)\b|विदेश|वीजा|यात्रा|ବିଦେଶ|ଭିସା|ଯାତ୍ରା/i.test(q))hints.push('foreign travel visa');
  if(/\b(child|children|baby|pregnancy)\b|बच्चा|संतान|गर्भ|ସନ୍ତାନ|ଶିଶୁ|ଗର୍ଭ/i.test(q))hints.push('children baby');
  if(/\b(property|house|land|flat|vehicle)\b|संपत्ति|मकान|जमीन|घर|ସମ୍ପତ୍ତି|ଘର|ଜମି/i.test(q))hints.push('property home land');
  if(/\b(family|parents|mother|father)\b|परिवार|माता|पिता|ପରିବାର|ବାପା|ମା/i.test(q))hints.push('family parents');
  if(/\b(health|illness|disease|medical|wellbeing)\b|स्वास्थ्य|बीमारी|रोग|ସ୍ୱାସ୍ଥ୍ୟ|ରୋଗ/i.test(q))hints.push('health wellbeing');
  if(/\b(spiritual|puja|mantra|temple|dharma|remedy)\b|पूजा|मंत्र|उपाय|धर्म|ପୂଜା|ମନ୍ତ୍ର|ଉପାୟ|ଧର୍ମ/i.test(q))hints.push('spiritual puja remedy');

  // Intent hints. These are appended as semantic context; the original user text is never altered in the UI.
  if(/\bwhen\b|\bwhat time\b|\bwhich month\b|\bhow soon\b|\bkab\b|\bkebe\b|कब|कबतक|कब तक|कौन.*महीना|କେବେ|କେତେବେଳେ|କେଉଁ.*ମାସ/i.test(q))hints.push('when timing which month');
  if(/\bwhy\b|\breason\b|\bcause\b|\bkyun\b|\bkahinki\b|क्यों|कारण|କାହିଁକି|କାରଣ/i.test(q))hints.push('why reason cause');
  if(/\bremedy\b|\bpuja\b|\bmantra\b|\bupay\b|पूजा|उपाय|मंत्र|ପୂଜା|ଉପାୟ|ମନ୍ତ୍ର/i.test(q))hints.push('remedy puja mantra');
  if(/\bnow\b|\bcurrently\b|\btoday\b|अभी|वर्तमान|फिलहाल|ଏବେ|ବର୍ତ୍ତମାନ/i.test(q))hints.push('now current situation');
  if(/\b(or|versus|vs|better|which)\b| या |बेहतर|कौन| ନା | କି |କେଉଁଟି/i.test(` ${q} `))hints.push('or versus better which comparison');
  if(/\bwill\b|\bcan\b|\bpossible\b|\bchances?\b|होगा|होगी|मिलेगा|संभव|ହେବ|ମିଳିବ|ସମ୍ଭବ/i.test(q))hints.push('will possible chances');
  if(/\bshould i\b|\bwhat should i do\b|क्या करूं|करना चाहिए|କଣ କରିବି|କଣ କରିବା ଉଚିତ/i.test(q))hints.push('should i advice decision');
  return hints.join(' ');
}

/**
 * Public local Mini-AI entry point. The core classifier uses fuzzy text matching;
 * this wrapper adds strong multilingual semantic hints for explicit user words
 * and prevents short tokens such as "ex" from matching inside "exactly"/"next".
 */
export function askMiniAI(chart:Chart,question:string,lang:GuidanceLanguage='en',previous?:MiniContext):MiniAnswer{
  const hints=semanticHints(question);
  const enriched=hints?`${question} ${hints}`:question;
  let answer=coreAsk(chart,enriched,lang,previous);
  if(answer.focus==='reconciliation'&&!explicitReconciliation(question)){
    const cleaned=question.replace(/\bex\b/gi,'former partner').replace(/ex/gi,'e x');
    const contextHint=previous?.topic&&previous.topic!=='general'?` ${previous.topic}`:'';
    const retryHints=semanticHints(question);
    answer=coreAsk(chart,`${cleaned} ${retryHints}${contextHint}`,lang,previous);
  }
  return answer;
}

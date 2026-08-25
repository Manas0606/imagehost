import type {Chart} from './astrology';
import {askMiniAI as coreAsk,type MiniAnswer,type MiniContext} from './mini-ai';
import {understandLocal,LOCAL_AI_MODEL_INFO} from './local-ai-model';
import type {GuidanceLanguage,GuidanceTopic} from './guidance';

export type {MiniAnswer,MiniContext} from './mini-ai';
export {LOCAL_AI_MODEL_INFO} from './local-ai-model';

const explicitReconciliation=(q:string)=>/(^|\s)(ex|एक्स)(\s|$)|former\s+partner|reconcil|patch\s*up|come\s+back|return\s+to\s+me|वापस\s+आ|पैच\s*अप|ପୂର୍ବ\s+ସାଥୀ|ପୁଣି\s+ଫେର|ପୁନଃମିଳନ/i.test(q.normalize('NFKC'));

const TOPIC_HINT:Record<GuidanceTopic,string>={career:'job career employment promotion',marriage:'marriage wedding spouse',love:'love relationship romance',money:'money finance income',education:'study exam education',problems:'problem obstacle delay',business:'business startup company',travel:'foreign travel visa',children:'children baby family planning',property:'property home land',family:'family parents home',health:'health wellbeing',spiritual:'spiritual puja remedy',general:'future life guidance'};
const INTENT_HINT:Record<string,string>={timing:'when timing which month date',current:'now current situation',cause:'why reason cause',remedy:'remedy puja mantra what should i do',likelihood:'will possible chances',comparison:'or versus better which comparison',profile:'what type nature profile',forecast:'future forecast what will happen',advice:'should i advice decision'};
const FOCUS_HINT:Record<string,string>={none:'',intimacy:'intimacy kiss kissing sexual sex physical relationship romance',partner:'spouse partner husband wife',jobType:'government private job',marriageType:'love marriage arranged marriage',businessVsJob:'business or job job versus business',studyAbroad:'study abroad foreign education',debt:'loan debt repayment',reconciliation:'ex former partner reconciliation patch up come back'};

function semanticHints(question:string){
 const q=question.normalize('NFKC');const hints:string[]=[];
 if(/\b(job|career|employment|promotion|interview)\b|नौकरी|करियर|रोजगार|प्रमोशन|ଚାକିରି|କ୍ୟାରିୟର|ନିଯୁକ୍ତି|ପ୍ରମୋସନ/i.test(q))hints.push('job career employment');
 if(/\b(marriage|marry|wedding|spouse)\b|शादी|विवाह|जीवनसाथी|ବିବାହ|ଜୀବନସାଥୀ/i.test(q))hints.push('marriage wedding spouse');
 if(/\b(love|relationship|girlfriend|boyfriend|breakup|romance|intimacy|sexual|sex|kiss|kissing|hug)\b|प्यार|प्रेम|रिश्ता|ब्रेकअप|सेक्स|किस|अंतरंग|ପ୍ରେମ|ସମ୍ପର୍କ|ବ୍ରେକଅପ|ଯୌନ|ଚୁମ୍ବନ|ଅନ୍ତରଙ୍ଗ/i.test(q))hints.push('love relationship intimacy kiss sex romance');
 if(/\b(money|finance|income|salary|wealth|loan|debt)\b|पैसा|धन|आय|कर्ज|लोन|ଟଙ୍କା|ଧନ|ଆୟ|ଋଣ|ଲୋନ/i.test(q))hints.push('money finance income debt');
 if(/\b(study|education|exam|college|school|result)\b|पढ़ाई|शिक्षा|परीक्षा|रिजल्ट|ପଢ଼ା|ଶିକ୍ଷା|ପରୀକ୍ଷା|ଫଳ/i.test(q))hints.push('study exam education');
 if(/\b(problem|obstacle|delay|struggle|trouble)\b|समस्या|बाधा|देरी|परेशानी|ସମସ୍ୟା|ବାଧା|ବିଳମ୍ବ|କଷ୍ଟ/i.test(q))hints.push('problem obstacle delay');
 if(/\b(business|startup|company|shop)\b|व्यापार|बिजनेस|कंपनी|ବ୍ୟବସାୟ|ଷ୍ଟାର୍ଟଅପ|କମ୍ପାନୀ/i.test(q))hints.push('business startup company');
 if(/\b(foreign|abroad|travel|visa|relocation|overseas)\b|विदेश|वीजा|यात्रा|ବିଦେଶ|ଭିସା|ଯାତ୍ରା/i.test(q))hints.push('foreign travel visa');
 if(/\b(child|children|baby|pregnancy)\b|बच्चा|संतान|गर्भ|ସନ୍ତାନ|ଶିଶୁ|ଗର୍ଭ/i.test(q))hints.push('children baby');
 if(/\b(property|house|land|flat|vehicle)\b|संपत्ति|मकान|जमीन|घर|ସମ୍ପତ୍ତି|ଘର|ଜମି/i.test(q))hints.push('property home land');
 if(/\b(family|parents|mother|father)\b|परिवार|माता|पिता|ପରିବାର|ବାପା|ମା/i.test(q))hints.push('family parents');
 if(/\b(health|illness|disease|medical|wellbeing)\b|स्वास्थ्य|बीमारी|रोग|ସ୍ୱାସ୍ଥ୍ୟ|ରୋଗ/i.test(q))hints.push('health wellbeing');
 if(/\b(spiritual|puja|mantra|temple|dharma|remedy)\b|पूजा|मंत्र|उपाय|धर्म|ପୂଜା|ମନ୍ତ୍ର|ଉପାୟ|ଧର୍ମ/i.test(q))hints.push('spiritual puja remedy');
 if(/\bwhen\b|\bwhat time\b|\bwhich month\b|\bhow soon\b|\bkab\b|\bkebe\b|कब|कबतक|कब तक|କେବେ|କେତେବେଳେ/i.test(q))hints.push('when timing which month');
 if(/\bwhy\b|\breason\b|\bcause\b|\bkyun\b|\bkahinki\b|क्यों|कारण|କାହିଁକି|କାରଣ/i.test(q))hints.push('why reason cause');
 if(/\bremedy\b|\bpuja\b|\bmantra\b|\bupay\b|पूजा|उपाय|मंत्र|ପୂଜା|ଉପାୟ|ମନ୍ତ୍ର/i.test(q))hints.push('remedy puja mantra');
 if(/\bnow\b|\bcurrently\b|\btoday\b|अभी|वर्तमान|फिलहाल|ଏବେ|ବର୍ତ୍ତମାନ/i.test(q))hints.push('now current situation');
 if(/\b(or|versus|vs|better|which)\b| या |बेहतर|कौन| ନା | କି |କେଉଁଟି/i.test(` ${q} `))hints.push('or versus better which comparison');
 if(/\bwill\b|\bcan\b|\bpossible\b|\bchances?\b|होगा|होगी|मिलेगा|संभव|ହେବ|ମିଳିବ|ସମ୍ଭବ/i.test(q))hints.push('will possible chances');
 if(/\bshould i\b|\bwhat should i do\b|क्या करूं|करना चाहिए|କଣ କରିବି|କଣ କରିବା ଉଚିତ/i.test(q))hints.push('should i advice decision');
 return hints.join(' ');
}

function forcePrompt(question:string,u:ReturnType<typeof understandLocal>){
 const focus=FOCUS_HINT[u.focus]||'';const topic=TOPIC_HINT[u.topic];const intent=INTENT_HINT[u.intent]||'';
 return `${question} ${topic} ${topic} ${intent} ${intent} ${focus} ${focus} ${semanticHints(question)}`.trim();
}

/**
 * Offline AstroSathi AI entry point.
 * A compact learned semantic model first interprets arbitrary English/Hindi/Odia/Romanised text.
 * The deterministic Jyotish engine then produces the actual chart-based answer. No network AI is used.
 */
export function askMiniAI(chart:Chart,question:string,lang:GuidanceLanguage='en',previous?:MiniContext):MiniAnswer{
 const learned=understandLocal(question,previous);
 let answer=coreAsk(chart,forcePrompt(question,learned),lang,previous);
 // When the learned model is confident, force the semantic route if the older fuzzy layer disagrees.
 if((learned.topicConfidence>.24&&answer.topic!==learned.topic)||(learned.focus!=='none'&&learned.focusConfidence>.18&&answer.focus!==learned.focus)){
   const forced=`${forcePrompt(question,learned)} ${TOPIC_HINT[learned.topic]} ${INTENT_HINT[learned.intent]} ${FOCUS_HINT[learned.focus]||''}`;
   answer=coreAsk(chart,forced,lang,{topic:learned.topic,intent:learned.intent,focus:learned.focus});
 }
 if(answer.focus==='reconciliation'&&!explicitReconciliation(question)&&learned.focus!=='reconciliation'){
   const forced=forcePrompt(question,{...learned,focus:'none'});
   answer=coreAsk(chart,forced,lang,{topic:learned.topic,intent:learned.intent,focus:'none'});
 }
 return answer;
}

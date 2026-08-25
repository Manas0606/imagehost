import type {Chart} from './astrology';
import {askMiniAI as coreAsk,type MiniAnswer,type MiniContext,type MiniIntent,type MiniFocus} from './mini-ai';
import {understandLocal,LOCAL_AI_MODEL_INFO,type LocalUnderstanding} from './local-ai-model';
import type {GuidanceLanguage,GuidanceTopic} from './guidance';

export type {MiniAnswer,MiniContext} from './mini-ai';
export {LOCAL_AI_MODEL_INFO} from './local-ai-model';

export type ChatUnderstanding={
 topic:GuidanceTopic;
 intent:MiniIntent;
 focus:MiniFocus;
 topicConfidence:number;
 intentConfidence:number;
 focusConfidence:number;
 explicitTopic:boolean;
 explicitFocus:boolean;
 followUp:boolean;
 title:string;
 understanding:string;
};

const TOPIC_HINT:Record<GuidanceTopic,string>={
 career:'job career work employment promotion interview profession office',
 marriage:'marriage wedding spouse husband wife life partner',
 love:'love relationship romance emotional companionship girlfriend boyfriend dating',
 money:'money finance income salary wealth savings',
 education:'study education exam learning college course result',
 problems:'problems obstacles delays struggle difficult period',
 business:'business startup company trade shop entrepreneurship profit',
 travel:'foreign travel visa relocation overseas journey',
 children:'children baby family planning parenthood',
 property:'property house land flat vehicle purchase',
 family:'family parents home peace relatives',
 health:'health wellbeing body vitality',
 spiritual:'spiritual puja prayer mantra dharma guidance',
 general:'future life overall guidance'
};
const INTENT_HINT:Record<MiniIntent,string>={
 timing:'when timing period month date stronger window',
 current:'current situation now present phase',
 cause:'why reason cause explanation',
 remedy:'remedy practical guidance puja mantra what to do',
 likelihood:'possibility likelihood chances whether it can happen',
 comparison:'comparison versus which is more supported',
 profile:'profile nature characteristics what kind',
 forecast:'overall outlook future trend',
 advice:'decision guidance what should i do'
};
const FOCUS_HINT:Record<MiniFocus,string>={
 none:'',
 intimacy:'intimacy physical relationship kissing sexual relationship closeness',
 partner:'partner spouse girlfriend boyfriend characteristics',
 jobType:'government job private job career type',
 marriageType:'love marriage arranged marriage marriage type',
 businessVsJob:'business versus job employment entrepreneurship',
 studyAbroad:'study abroad foreign education overseas study',
 debt:'debt loan repayment financial obligation',
 reconciliation:'former partner ex reconciliation patch up return relationship'
};

function clean(s:string){return s.normalize('NFKC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim()}
function words(s:string){return clean(s).replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean)}

function topicFromText(raw:string):GuidanceTopic|undefined{
 const q=clean(raw);
 // Specific compound domains come before broad words such as "love" or "home".
 if(/\b(love\s+marriage|arranged\s+marriage|marr?iage|marrige|marry|wedding|shaadi|shadi|vivah|spouse|husband|wife)\b|शादी|विवाह|जीवनसाथी|पति|पत्नी|ବିବାହ|ଜୀବନସାଥୀ|ସ୍ୱାମୀ|ସ୍ତ୍ରୀ/i.test(q))return'marriage';
 if(/\b(job|career|employment|work|office|interview|promotion|profession|naukri|chakiri)\b|नौकरी|करियर|रोजगार|प्रमोशन|ଚାକିରି|କ୍ୟାରିୟର|ନିଯୁକ୍ତି|ପ୍ରମୋସନ/i.test(q))return'career';
 if(/\b(love|relationship|relation|romance|romantic|girlfriend|girl\s*friend|girlfreind|boyfriend|boy\s*friend|crush|dating|date|intimacy|intimate|sex|sexual|kiss|kissing|physical\s+relationship|ex)\b|प्यार|प्रेम|रिश्ता|गर्लफ्रेंड|बॉयफ्रेंड|रोमांस|अंतरंग|सेक्स|किस|एक्स|ପ୍ରେମ|ସମ୍ପର୍କ|ଗର୍ଲଫ୍ରେଣ୍ଡ|ବୟଫ୍ରେଣ୍ଡ|ରୋମାନ୍ସ|ଅନ୍ତରଙ୍ଗ|ଯୌନ|ଚୁମ୍ବନ/i.test(q))return'love';
 if(/\b(money|finance|financial|income|salary|wealth|saving|savings|loan|debt|paisa|karz|taka|run)\b|पैसा|धन|आय|सैलरी|कर्ज|लोन|ଟଙ୍କା|ଧନ|ଆୟ|ଦରମା|ଋଣ|ଲୋନ/i.test(q))return'money';
 if(/\b(study\s+abroad|study|education|exam|college|school|course|result|padhai|pariksha|padha)\b|पढ़ाई|शिक्षा|परीक्षा|कॉलेज|रिजल्ट|ପଢ଼ା|ଶିକ୍ଷା|ପରୀକ୍ଷା|କଲେଜ|ଫଳ/i.test(q))return'education';
 if(/\b(business|startup|company|shop|trade|entrepreneur|vyapar|byabasaya)\b|व्यापार|बिजनेस|कंपनी|दुकान|ବ୍ୟବସାୟ|ଷ୍ଟାର୍ଟଅପ|କମ୍ପାନୀ|ଦୋକାନ/i.test(q))return'business';
 if(/\b(foreign|abroad|travel|visa|immigration|relocation|overseas|videsh|bidesh)\b|विदेश|वीजा|यात्रा|ବିଦେଶ|ଭିସା|ଯାତ୍ରା/i.test(q))return'travel';
 if(/\b(child|children|baby|pregnancy|family\s+planning|fertility|santan|santana)\b|बच्चा|संतान|गर्भ|ସନ୍ତାନ|ଶିଶୁ|ଗର୍ଭ/i.test(q))return'children';
 if(/\b(property|land|flat|real\s+estate|buy\s+(?:a\s+)?house|buy\s+home|vehicle|jami)\b|संपत्ति|जमीन|मकान|फ्लैट|ସମ୍ପତ୍ତି|ଜମି|ଫ୍ଲାଟ/i.test(q))return'property';
 if(/\b(family|parents|mother|father|sibling|parivar|paribara)\b|परिवार|माता|पिता|भाई|बहन|ପରିବାର|ବାପା|ମା|ଭାଇ|ଭଉଣୀ/i.test(q))return'family';
 if(/\b(health|illness|disease|medical|wellbeing|sehat|swasthya)\b|स्वास्थ्य|बीमारी|रोग|ସ୍ୱାସ୍ଥ୍ୟ|ରୋଗ|ଅସୁସ୍ଥ/i.test(q))return'health';
 if(/\b(spiritual|puja|mantra|temple|dharma|prayer|upay|upaya)\b|पूजा|मंत्र|उपाय|धर्म|ପୂଜା|ମନ୍ତ୍ର|ଉପାୟ|ଧର୍ମ/i.test(q))return'spiritual';
 if(/\b(problem|obstacle|delay|struggle|trouble|bad\s+time|samasya|badha)\b|समस्या|बाधा|देरी|परेशानी|ସମସ୍ୟା|ବାଧା|ବିଳମ୍ବ|କଷ୍ଟ/i.test(q))return'problems';
 if(/\b(future|overall|life|destiny|bhavishya)\b|भविष्य|जीवन|ଭବିଷ୍ୟତ|ଜୀବନ/i.test(q))return'general';
 return undefined;
}

function intentFromText(raw:string):MiniIntent|undefined{
 const q=clean(raw),p=` ${q} `;
 if(/\bwhen\b|\bwhat\s+time\b|\bwhich\s+month\b|\bhow\s+soon\b|\bnext\s+(month|year|week)\b|\bkab\b|\bkebe\b|कब|कबतक|कब तक|କେବେ|କେତେବେଳେ/i.test(q))return'timing';
 if(/\bwhy\b|\breason\b|\bcause\b|\bkyun\b|\bkyu\b|\bkahinki\b|क्यों|कारण|କାହିଁକି|କାରଣ/i.test(q))return'cause';
 if(/\bremedy\b|\bpuja\b|\bmantra\b|\bupay\b|\bupaya\b|पूजा|उपाय|मंत्र|ପୂଜା|ଉପାୟ|ମନ୍ତ୍ର/i.test(q))return'remedy';
 if(/\b(vs|versus|better|compare|comparison)\b|\bor\b| या |बेहतर|कौन सा| ନା | କି |କେଉଁଟି/i.test(p))return'comparison';
 if(/\bwhat\s+kind\b|\bwhat\s+type\b|\bwhat\s+sort\b|\bnature\s+of\b|\bhow\s+will\s+(my\s+)?(wife|husband|spouse|partner|girlfriend|boyfriend)\b|कैसा होगा|कैसी होगी|କେମିତି ହେବ/i.test(q))return'profile';
 if(/\bshould\s+i\b|\bwhat\s+should\s+i\s+do\b|\bwhat\s+to\s+do\b|क्या करूं|करना चाहिए|କଣ କରିବି|କଣ କରିବା ଉଚିତ/i.test(q))return'advice';
 if(/\bnow\b|\bcurrently\b|\bpresent\b|\btoday\b|\bright\s+now\b|अभी|वर्तमान|फिलहाल|ଏବେ|ବର୍ତ୍ତମାନ/i.test(q))return'current';
 if(/\bwill\b|\bcan\b|\bcould\b|\bpossible\b|\bpossibility\b|\bchance(s)?\b|\bis\s+there\b|होगा|होगी|मिलेगा|मिलेगी|संभव|ହେବ|ମିଳିବ|ସମ୍ଭବ/i.test(q))return'likelihood';
 if(/\bfuture\b|\bforecast\b|\boutlook\b|\bhow\s+is\b|\bhow\s+will\b|\btell\s+me\b|कैसा रहेगा|कैसी रहेगी|କେମିତି ରହିବ/i.test(q))return'forecast';
 return undefined;
}

function focusFromText(raw:string,intent?:MiniIntent):MiniFocus|undefined{
 const q=clean(raw),p=` ${q} `;
 const hasBusiness=/\b(business|startup|company|entrepreneur|vyapar|byabasaya)\b|व्यापार|बिजनेस|ବ୍ୟବସାୟ/i.test(q);
 const hasJob=/\b(job|career|employment|naukri|chakiri)\b|नौकरी|ଚାକିରି/i.test(q);
 if(/\b(love\s+marriage)\b.*\b(arranged|arrange)\b|\b(arranged|arrange)\b.*\b(love\s+marriage)\b|लव मैरिज.*अरेंज|अरेंज.*लव मैरिज|ପ୍ରେମ ବିବାହ.*ଆରେଞ୍ଜ|ଆରେଞ୍ଜ.*ପ୍ରେମ ବିବାହ/i.test(q))return'marriageType';
 if(hasBusiness&&hasJob&&(/\b(or|vs|versus)\b| या | ନା | କି /i.test(p)))return'businessVsJob';
 if(/\b(government|govt|sarkari)\b.*\b(private)\b|\bprivate\b.*\b(government|govt|sarkari)\b|सरकारी.*प्राइवेट|प्राइवेट.*सरकारी|ସରକାରୀ.*ପ୍ରାଇଭେଟ|ପ୍ରାଇଭେଟ.*ସରକାରୀ/i.test(q))return'jobType';
 if(/\b(study|education|college|course)\b.*\b(abroad|foreign|overseas)\b|विदेश.*पढ़|पढ़.*विदेश|ବିଦେଶ.*ପଢ଼|ପଢ଼.*ବିଦେଶ/i.test(q))return'studyAbroad';
 if(/\b(debt|loan|karz|repay|repayment)\b|कर्ज|लोन|ऋण|ଋଣ|ଲୋନ/i.test(q))return'debt';
 if(/(^|\s)(ex|एक्स)(\s|$)|former\s+partner|former\s+(girlfriend|boyfriend)|reconcil|patch\s*up|come\s+back|return\s+to\s+me|वापस\s+आ|पैच\s*अप|ପୂର୍ବ\s+ସାଥୀ|ପୁଣି\s+ଫେର|ପୁନଃମିଳନ/i.test(q))return'reconciliation';
 if(/\b(sex|sexx|sexual|sexuality|intimacy|intimate|intimcy|kiss|kissing|kisss|hug|physical\s+(relationship|relation|closeness)|physical\s+intimacy)\b|सेक्स|यौन|किस|चुंबन|अंतरंग|शारीरिक\s+संबंध|ଯୌନ|ଚୁମ୍ବନ|ଅନ୍ତରଙ୍ଗ|ଶାରୀରିକ\s+ସମ୍ପର୍କ/i.test(q))return'intimacy';
 if(intent==='profile'&&(/\b(spouse|partner|wife|husband|girlfriend|girl\s*friend|boyfriend|boy\s*friend)\b|जीवनसाथी|पति|पत्नी|गर्लफ्रेंड|बॉयफ्रेंड|ଜୀବନସାଥୀ|ସ୍ୱାମୀ|ସ୍ତ୍ରୀ|ଗର୍ଲଫ୍ରେଣ୍ଡ|ବୟଫ୍ରେଣ୍ଡ/i.test(q)))return'partner';
 return undefined;
}

function impliedTopic(focus:MiniFocus|undefined):GuidanceTopic|undefined{
 if(focus==='intimacy'||focus==='reconciliation'||focus==='partner')return'love';
 if(focus==='jobType'||focus==='businessVsJob')return'career';
 if(focus==='marriageType')return'marriage';
 if(focus==='studyAbroad')return'education';
 if(focus==='debt')return'money';
 return undefined;
}

function genuineFollowUp(raw:string,previous?:MiniContext,explicitTopic?:GuidanceTopic):boolean{
 if(!previous||explicitTopic)return false;
 const q=clean(raw),wc=words(q).length;
 if(!q)return false;
 if(/^(and|then|so|also|okay|ok|why|when|how|where|which|what about|then what|after that|what next|tell me more|more|chances|chance|remedy|solution)\b/i.test(q))return wc<=8;
 if(/\b(next\s+(week|month|year)|this\s+(week|month|year)|when\s+exactly|how\s+soon|which\s+month|what\s+about|after\s+that|then|now|currently|chances?|possible)\b/i.test(q))return wc<=9;
 if(/^(कब|क्यों|फिर|अभी|और|क्या|କେବେ|କାହିଁକି|ତାପରେ|ଏବେ|ଆଉ|କଣ)\b/i.test(q))return wc<=8;
 const ei=intentFromText(q);
 return wc<=3&&Boolean(ei);
}

const TITLES:Record<GuidanceLanguage,Record<GuidanceTopic,string>>={
 en:{career:'CAREER & WORK',marriage:'MARRIAGE & SPOUSE',love:'LOVE & RELATIONSHIPS',money:'MONEY & FINANCES',education:'EDUCATION & EXAMS',problems:'CURRENT CHALLENGES',business:'BUSINESS & GROWTH',travel:'TRAVEL & FOREIGN OPPORTUNITIES',children:'CHILDREN & FAMILY PLANNING',property:'PROPERTY & HOME',family:'FAMILY & HOME LIFE',health:'HEALTH & WELLBEING',spiritual:'SPIRITUAL GUIDANCE',general:'LIFE GUIDANCE'},
 hi:{career:'करियर और नौकरी',marriage:'विवाह और जीवनसाथी',love:'प्रेम और संबंध',money:'धन और वित्त',education:'शिक्षा और परीक्षा',problems:'वर्तमान चुनौतियाँ',business:'व्यवसाय और प्रगति',travel:'यात्रा और विदेश अवसर',children:'संतान और परिवार नियोजन',property:'संपत्ति और घर',family:'परिवार और गृह जीवन',health:'स्वास्थ्य और कुशलता',spiritual:'आध्यात्मिक मार्गदर्शन',general:'जीवन मार्गदर्शन'},
 or:{career:'କ୍ୟାରିୟର ଓ ଚାକିରି',marriage:'ବିବାହ ଓ ଜୀବନସାଥୀ',love:'ପ୍ରେମ ଓ ସମ୍ପର୍କ',money:'ଧନ ଓ ଆର୍ଥିକ ଅବସ୍ଥା',education:'ଶିକ୍ଷା ଓ ପରୀକ୍ଷା',problems:'ବର୍ତ୍ତମାନର ଚ୍ୟାଲେଞ୍ଜ',business:'ବ୍ୟବସାୟ ଓ ଉନ୍ନତି',travel:'ଯାତ୍ରା ଓ ବିଦେଶ ସୁଯୋଗ',children:'ସନ୍ତାନ ଓ ପରିବାର ଯୋଜନା',property:'ସମ୍ପତ୍ତି ଓ ଘର',family:'ପରିବାର ଓ ଗୃହଜୀବନ',health:'ସ୍ୱାସ୍ଥ୍ୟ ଓ ସୁସ୍ଥତା',spiritual:'ଆଧ୍ୟାତ୍ମିକ ମାର୍ଗଦର୍ଶନ',general:'ଜୀବନ ମାର୍ଗଦର୍ଶନ'}
};
const FOCUS_TITLES:Record<GuidanceLanguage,Partial<Record<MiniFocus,string>>>= {
 en:{intimacy:'INTIMACY & PHYSICAL RELATIONSHIP',reconciliation:'RECONCILIATION & PAST RELATIONSHIP',partner:'PARTNER & RELATIONSHIP',jobType:'GOVERNMENT VS PRIVATE CAREER',marriageType:'LOVE VS ARRANGED MARRIAGE',businessVsJob:'BUSINESS VS JOB',studyAbroad:'STUDY ABROAD',debt:'DEBT & FINANCIAL RELIEF'},
 hi:{intimacy:'अंतरंगता और शारीरिक संबंध',reconciliation:'पुनर्मिलन और पिछला संबंध',partner:'जीवनसाथी और संबंध',jobType:'सरकारी बनाम निजी नौकरी',marriageType:'प्रेम विवाह बनाम अरेंज विवाह',businessVsJob:'व्यवसाय बनाम नौकरी',studyAbroad:'विदेश में पढ़ाई',debt:'कर्ज और आर्थिक राहत'},
 or:{intimacy:'ଅନ୍ତରଙ୍ଗତା ଓ ଶାରୀରିକ ସମ୍ପର୍କ',reconciliation:'ପୁନଃମିଳନ ଓ ପୂର୍ବ ସମ୍ପର୍କ',partner:'ଜୀବନସାଥୀ ଓ ସମ୍ପର୍କ',jobType:'ସରକାରୀ ବନାମ ପ୍ରାଇଭେଟ ଚାକିରି',marriageType:'ପ୍ରେମ ବିବାହ ବନାମ ଆରେଞ୍ଜ ବିବାହ',businessVsJob:'ବ୍ୟବସାୟ ବନାମ ଚାକିରି',studyAbroad:'ବିଦେଶରେ ପଢ଼ା',debt:'ଋଣ ଓ ଆର୍ଥିକ ରାହତ'}
};
const INTENT_LABELS:Record<GuidanceLanguage,Record<MiniIntent,string>>={
 en:{timing:'timing',current:'current situation',cause:'reason and cause',remedy:'remedy and guidance',likelihood:'possibility',comparison:'comparison',profile:'profile and nature',forecast:'overall outlook',advice:'decision guidance'},
 hi:{timing:'समय',current:'वर्तमान स्थिति',cause:'कारण',remedy:'उपाय और मार्गदर्शन',likelihood:'संभावना',comparison:'तुलना',profile:'स्वभाव और प्रोफ़ाइल',forecast:'समग्र संकेत',advice:'निर्णय मार्गदर्शन'},
 or:{timing:'ସମୟ',current:'ବର୍ତ୍ତମାନ ସ୍ଥିତି',cause:'କାରଣ',remedy:'ଉପାୟ ଓ ମାର୍ଗଦର୍ଶନ',likelihood:'ସମ୍ଭାବନା',comparison:'ତୁଳନା',profile:'ସ୍ୱଭାବ ଓ ପ୍ରୋଫାଇଲ୍',forecast:'ସାମଗ୍ରିକ ସଙ୍କେତ',advice:'ନିଷ୍ପତ୍ତି ମାର୍ଗଦର୍ଶନ'}
};

function titleFor(topic:GuidanceTopic,focus:MiniFocus,lang:GuidanceLanguage){
 // General girlfriend/boyfriend/partner questions stay under Love & Relationships.
 if(focus==='partner'&&topic==='love')return TITLES[lang].love;
 return FOCUS_TITLES[lang][focus]||TITLES[lang][topic];
}
function understoodFor(title:string,intent:MiniIntent,lang:GuidanceLanguage){
 if(lang==='hi')return `समझा गया: ${title} · ${INTENT_LABELS.hi[intent]}.`;
 if(lang==='or')return `ବୁଝିଲି: ${title} · ${INTENT_LABELS.or[intent]}।`;
 return `Understood: ${title} · ${INTENT_LABELS.en[intent]}.`;
}

function confidenceValue(explicit:boolean,base:number){return explicit?1:Math.max(0,Math.min(1,base))}

/**
 * High-precision conversation router used before deterministic Jyotish reasoning.
 * Explicit new domains reset stale context. Context is inherited only for genuine follow-ups.
 * Sensitive/special focuses are activated only by evidence in the current question.
 */
export function analyseChatQuestion(question:string,previous?:MiniContext,lang:GuidanceLanguage='en'):ChatUnderstanding{
 const explicitIntent=intentFromText(question);
 const explicitFocus=focusFromText(question,explicitIntent);
 const textTopic=topicFromText(question);
 const explicitTopic=textTopic||impliedTopic(explicitFocus);
 const followUp=genuineFollowUp(question,previous,explicitTopic);
 const learned:LocalUnderstanding=understandLocal(question,followUp?previous:undefined);
 const wc=words(question).length;

 let topic:GuidanceTopic=explicitTopic||(followUp&&previous?previous.topic:learned.topic);
 let intent:MiniIntent=explicitIntent||(explicitTopic&&wc<=2?'forecast':(followUp&&previous&&learned.intentConfidence<.18?previous.intent:learned.intent));
 let focus:MiniFocus;
 if(explicitFocus)focus=explicitFocus;
 else if(explicitTopic)focus='none';
 else if(followUp&&previous)focus=previous.focus;
 else focus='none';

 // These compound focuses imply a canonical topic even if a fuzzy model disagrees.
 topic=impliedTopic(focus)||topic;
 const title=titleFor(topic,focus,lang);
 return{
  topic,intent,focus,
  topicConfidence:confidenceValue(Boolean(explicitTopic),learned.topicConfidence),
  intentConfidence:confidenceValue(Boolean(explicitIntent),learned.intentConfidence),
  focusConfidence:confidenceValue(Boolean(explicitFocus),focus==='none'?1:learned.focusConfidence),
  explicitTopic:Boolean(explicitTopic),explicitFocus:Boolean(explicitFocus),followUp,title,
  understanding:understoodFor(title,intent,lang)
 };
}

function forcePrompt(question:string,u:Pick<ChatUnderstanding,'topic'|'intent'|'focus'>){
 const topic=TOPIC_HINT[u.topic],intent=INTENT_HINT[u.intent],focus=FOCUS_HINT[u.focus]||'';
 // Repetition is intentional: it makes the deterministic legacy parser strongly follow
 // the semantic route without adding a network model or large weights to the APK.
 return `${question} ${topic} ${topic} ${topic} ${intent} ${intent} ${focus} ${focus}`.trim();
}

function loveFollowUps(lang:GuidanceLanguage,focus:MiniFocus):string[]{
 if(lang==='hi'){
  if(focus==='intimacy')return['अंतरंगता के लिए मजबूत समय कब है?','भावनात्मक नज़दीकी कैसी है?','रिश्ते में किन बातों पर ध्यान दूँ?'];
  if(focus==='reconciliation')return['पुनर्मिलन के लिए मजबूत समय कब है?','पुराने रिश्ते का संकेत कैसा है?','मुझे आगे क्या करना चाहिए?'];
  return['मेरी लव लाइफ अभी कैसी है?','रिश्ते के लिए मजबूत समय कब है?','मेरे चार्ट में संबंधों का पैटर्न क्या है?'];
 }
 if(lang==='or'){
  if(focus==='intimacy')return['ଅନ୍ତରଙ୍ଗତା ପାଇଁ ଶକ୍ତିଶାଳୀ ସମୟ କେବେ?','ଭାବନାତ୍ମକ ନିକଟତା କେମିତି?','ସମ୍ପର୍କରେ କେଉଁଥିରେ ଧ୍ୟାନ ଦେବି?'];
  if(focus==='reconciliation')return['ପୁନଃମିଳନ ପାଇଁ ଭଲ ସମୟ କେବେ?','ପୂର୍ବ ସମ୍ପର୍କର ସଙ୍କେତ କେମିତି?','ମୁଁ ଆଗକୁ କଣ କରିବି?'];
  return['ମୋ ପ୍ରେମ ଜୀବନ ଏବେ କେମିତି?','ସମ୍ପର୍କ ପାଇଁ ଶକ୍ତିଶାଳୀ ସମୟ କେବେ?','ମୋ କୁଣ୍ଡଳୀରେ ସମ୍ପର୍କର ପ୍ୟାଟର୍ନ କଣ?'];
 }
 if(focus==='intimacy')return['When is a stronger intimacy period?','How is emotional closeness shown?','What relationship patterns should I watch?'];
 if(focus==='reconciliation')return['When is a stronger reconciliation period?','What does my chart show about the past relationship?','What should I focus on next?'];
 return['How is my love life now?','When is a stronger relationship period?','What relationship patterns does my chart show?'];
}

/**
 * Offline AstroSathi AI entry point.
 * Semantic understanding routes the question; deterministic Kundli/Dasha/Transit logic
 * remains the source of all astrological facts. No third-party or paid AI API is used.
 */
export function askMiniAI(chart:Chart,question:string,lang:GuidanceLanguage='en',previous?:MiniContext):MiniAnswer{
 const u=analyseChatQuestion(question,previous,lang);
 const corePrevious=u.followUp?previous:undefined;
 let answer=coreAsk(chart,forcePrompt(question,u),lang,corePrevious);

 // If the legacy parser chose a different semantic route, rerun once with an explicit
 // resolved context. This is deterministic and prevents stale chat context from leaking.
 if(answer.topic!==u.topic||answer.intent!==u.intent||answer.focus!==u.focus){
  answer=coreAsk(chart,`${forcePrompt(question,u)} ${TOPIC_HINT[u.topic]} ${INTENT_HINT[u.intent]} ${FOCUS_HINT[u.focus]||''}`,lang,{topic:u.topic,intent:u.intent,focus:u.focus});
 }

 return{
  ...answer,
  topic:u.topic,intent:u.intent,focus:u.focus,title:u.title,understanding:u.understanding,
  context:{topic:u.topic,intent:u.intent,focus:u.focus},
  suggestedFollowUps:u.topic==='love'?loveFollowUps(lang,u.focus):answer.suggestedFollowUps
 };
}

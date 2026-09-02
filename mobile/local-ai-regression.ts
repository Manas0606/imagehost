import {LOCAL_AI_MODEL_INFO,understandLocal} from './local-ai-model';

function check(x:boolean,m:string){if(!x)throw new Error(`Jyotish G local AI regression failed: ${m}`)}
const kiss=understandLocal('Kiss');
check(kiss.topic==='love','Kiss must map to love');
check(kiss.focus==='intimacy','Kiss must map to intimacy');
const sex=understandLocal('Sex');
check(sex.topic==='love'&&sex.focus==='intimacy','Sex must map to intimacy');
const govt=understandLocal('सरकारी नौकरी या private job?');
check(govt.topic==='career','mixed Hindi/English job comparison must map to career');
check(govt.intent==='comparison','government/private must be comparison');
check(govt.focus==='jobType','government/private must use jobType focus');
const odia=understandLocal('ମୋ ପ୍ରେମ ଜୀବନ କେମିତି ରହିବ?');
check(odia.topic==='love','Odia love question must map to love');
const debt=understandLocal('loan kebe sesa heba');
check(debt.topic==='money'&&debt.focus==='debt','Romanised Odia debt question must map to money/debt');
const marriage=understandLocal('marrige when');
check(marriage.topic==='marriage','misspelled marriage must map to marriage');
const prev={topic:'career' as const,intent:'timing' as const,focus:'none' as const};
const follow=understandLocal('when exactly?',prev);
check(follow.topic==='career','short follow-up must inherit previous career context');
check(follow.focus!=='reconciliation','exactly must never match ex/reconciliation');
check(LOCAL_AI_MODEL_INFO.networkRequired===false&&LOCAL_AI_MODEL_INFO.paidApiRequired===false,'model must be offline and free of paid APIs');
check(LOCAL_AI_MODEL_INFO.trainingExamples>=100,'semantic model corpus unexpectedly small');
console.log(`Jyotish G compact local AI regression passed (${LOCAL_AI_MODEL_INFO.trainingExamples} multilingual examples, ${LOCAL_AI_MODEL_INFO.dimensions} hashed dimensions)`);

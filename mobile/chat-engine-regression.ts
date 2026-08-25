import {analyseChatQuestion} from './mini-ai-engine';
import type {MiniContext} from './mini-ai-engine';

function ok(cond:unknown,msg:string){if(!cond)throw new Error(msg)}
function eq<T>(actual:T,expected:T,msg:string){if(actual!==expected)throw new Error(`${msg}: expected ${String(expected)}, got ${String(actual)}`)}

const intimacyPrev:MiniContext={topic:'love',intent:'current',focus:'intimacy'};
let u=analyseChatQuestion('Love',intimacyPrev,'en');
eq(u.topic,'love','Love starts a love route');
eq(u.focus,'none','Love must reset old intimacy focus');
eq(u.title,'LOVE & RELATIONSHIPS','Love heading');
ok(!/sexual|intimacy/i.test(u.title),'General love heading must not be sexual/intimacy');

u=analyseChatQuestion('Girlfriend',intimacyPrev,'en');
eq(u.topic,'love','Girlfriend topic');
eq(u.focus,'none','Girlfriend must not inherit intimacy');
eq(u.title,'LOVE & RELATIONSHIPS','Girlfriend heading');

u=analyseChatQuestion('Will I get a girlfriend?',intimacyPrev,'en');
eq(u.topic,'love','Girlfriend likelihood topic');
eq(u.intent,'likelihood','Girlfriend likelihood intent');
eq(u.focus,'none','Girlfriend likelihood must not imply intimacy');

u=analyseChatQuestion('How is intimacy in my chart?',undefined,'en');
eq(u.topic,'love','Explicit intimacy topic');
eq(u.focus,'intimacy','Explicit intimacy focus');
eq(u.title,'INTIMACY & PHYSICAL RELATIONSHIP','Explicit intimacy heading');

u=analyseChatQuestion('Sex',undefined,'en');
eq(u.topic,'love','Sex topic');
eq(u.focus,'intimacy','Sex focus');

u=analyseChatQuestion('Will my ex come back?',undefined,'en');
eq(u.topic,'love','Reconciliation topic');
eq(u.focus,'reconciliation','Reconciliation focus');
eq(u.intent,'likelihood','Reconciliation likelihood');

u=analyseChatQuestion('Love marriage or arranged marriage?',intimacyPrev,'en');
eq(u.topic,'marriage','Marriage type topic');
eq(u.focus,'marriageType','Marriage type focus');
eq(u.intent,'comparison','Marriage type intent');

u=analyseChatQuestion('Government vs private job?',undefined,'en');
eq(u.topic,'career','Job type topic');
eq(u.focus,'jobType','Job type focus');
eq(u.intent,'comparison','Job type intent');

u=analyseChatQuestion('Business or job?',undefined,'en');
eq(u.topic,'career','Business vs job topic');
eq(u.focus,'businessVsJob','Business vs job focus');

const careerPrev:MiniContext={topic:'career',intent:'current',focus:'none'};
u=analyseChatQuestion('when exactly?',careerPrev,'en');
eq(u.topic,'career','Timing follow-up keeps career');
eq(u.intent,'timing','Timing follow-up intent');
eq(u.focus,'none','Timing follow-up keeps neutral focus');
ok(u.followUp,'when exactly is a genuine follow-up');

u=analyseChatQuestion('what about next month?',careerPrev,'en');
eq(u.topic,'career','Next month follow-up keeps career');
eq(u.intent,'timing','Next month follow-up timing');
ok(u.followUp,'next month is a genuine follow-up');

const debtPrev:MiniContext={topic:'money',intent:'timing',focus:'debt'};
u=analyseChatQuestion('why?',debtPrev,'en');
eq(u.topic,'money','Why follow-up keeps money');
eq(u.focus,'debt','Why follow-up keeps debt focus');
eq(u.intent,'cause','Why follow-up cause intent');

u=analyseChatQuestion('Love',debtPrev,'en');
eq(u.topic,'love','Explicit new Love resets debt topic');
eq(u.focus,'none','Explicit new Love resets debt focus');
ok(!u.followUp,'Explicit new domain is not treated as follow-up');

u=analyseChatQuestion('marrige when',undefined,'en');
eq(u.topic,'marriage','Misspelled marriage is understood');
eq(u.intent,'timing','Misspelled marriage timing');

u=analyseChatQuestion('प्रेम',intimacyPrev,'hi');
eq(u.topic,'love','Hindi love topic');
eq(u.focus,'none','Hindi love resets intimacy');
eq(u.title,'प्रेम और संबंध','Hindi love heading');

u=analyseChatQuestion('गर्लफ्रेंड कब मिलेगी?',undefined,'hi');
eq(u.topic,'love','Hindi girlfriend topic');
eq(u.intent,'timing','Hindi girlfriend timing');
eq(u.focus,'none','Hindi girlfriend is not intimacy');

u=analyseChatQuestion('ପ୍ରେମ',intimacyPrev,'or');
eq(u.topic,'love','Odia love topic');
eq(u.focus,'none','Odia love resets intimacy');
eq(u.title,'ପ୍ରେମ ଓ ସମ୍ପର୍କ','Odia love heading');

u=analyseChatQuestion('ଗର୍ଲଫ୍ରେଣ୍ଡ କେବେ ମିଳିବ?',undefined,'or');
eq(u.topic,'love','Odia girlfriend topic');
eq(u.intent,'timing','Odia girlfriend timing');
eq(u.focus,'none','Odia girlfriend is not intimacy');

console.log('Chat engine regression checks passed');

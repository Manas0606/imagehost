import type {Chart,Planet,TransitPlanet} from './astrology';
import {calculateTransits,getDashaAt} from './astrology';

export type LifeLanguage='en'|'hi'|'or';
export type LifePatternReport={
  title:string;
  subtitle:string;
  nature:string[];
  current:string[];
  recent:string[];
  nearTerm:string[];
  evidence:string[];
  disclaimer:string;
};

const DAY=86400000;
const ELEMENT:Record<string,'fire'|'earth'|'air'|'water'>={Aries:'fire',Leo:'fire',Sagittarius:'fire',Taurus:'earth',Virgo:'earth',Capricorn:'earth',Gemini:'air',Libra:'air',Aquarius:'air',Cancer:'water',Scorpio:'water',Pisces:'water'};
const HOUSE_DOMAINS={
  en:['','self, confidence and personal direction','family, speech, savings and money','skills, communication, courage and siblings','home, mother, property and emotional comfort','education, creativity, romance and children','work, competition, debt, routines and health attention','marriage, partnership and one-to-one relationships','sudden change, shared money, vulnerability and deep transformation','higher study, beliefs, mentors, fortune and long-distance travel','career, responsibility, authority and public reputation','income, gains, friends, networks and fulfilment of goals','expenses, sleep, isolation, foreign matters and inner withdrawal'],
  hi:['','स्वभाव, आत्मविश्वास और निजी दिशा','परिवार, वाणी, बचत और धन','कौशल, संचार, साहस और भाई-बहन','घर, माता, संपत्ति और मानसिक आराम','शिक्षा, रचनात्मकता, प्रेम और संतान','काम, प्रतियोगिता, ऋण, दिनचर्या और स्वास्थ्य पर ध्यान','विवाह, साझेदारी और आमने-सामने के संबंध','अचानक बदलाव, साझा धन, संवेदनशीलता और गहरा परिवर्तन','उच्च शिक्षा, विश्वास, गुरु, भाग्य और लंबी यात्रा','करियर, जिम्मेदारी, अधिकारी और सामाजिक प्रतिष्ठा','आय, लाभ, मित्र, नेटवर्क और इच्छाओं की पूर्ति','खर्च, नींद, एकांत, विदेश और भीतर की ओर जाने की प्रवृत्ति'],
  or:['','ନିଜ ସ୍ୱଭାବ, ଆତ୍ମବିଶ୍ୱାସ ଓ ବ୍ୟକ୍ତିଗତ ଦିଗ','ପରିବାର, କଥାବାର୍ତ୍ତା, ସଞ୍ଚୟ ଓ ଧନ','ଦକ୍ଷତା, ଯୋଗାଯୋଗ, ସାହସ ଓ ଭାଇ-ଭଉଣୀ','ଘର, ମା, ସମ୍ପତ୍ତି ଓ ମାନସିକ ସୁବିଧା','ଶିକ୍ଷା, ସୃଜନଶୀଳତା, ପ୍ରେମ ଓ ସନ୍ତାନ','କାମ, ପ୍ରତିଯୋଗିତା, ଋଣ, ଦୈନନ୍ଦିନ ଅଭ୍ୟାସ ଓ ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରତି ଧ୍ୟାନ','ବିବାହ, ଭାଗୀଦାରୀ ଓ ଏକାନ୍ତରିକ ସମ୍ପର୍କ','ହଠାତ୍ ପରିବର୍ତ୍ତନ, ସଂଯୁକ୍ତ ଧନ, ସମ୍ବେଦନଶୀଳତା ଓ ଗଭୀର ପରିବର୍ତ୍ତନ','ଉଚ୍ଚ ଶିକ୍ଷା, ବିଶ୍ୱାସ, ଗୁରୁ, ଭାଗ୍ୟ ଓ ଦୀର୍ଘ ଯାତ୍ରା','କ୍ୟାରିୟର, ଦାୟିତ୍ୱ, ଅଧିକାରୀ ଓ ସାମାଜିକ ପ୍ରତିଷ୍ଠା','ଆୟ, ଲାଭ, ମିତ୍ର, ନେଟୱର୍କ ଓ ଲକ୍ଷ୍ୟ ପୂରଣ','ଖର୍ଚ୍ଚ, ନିଦ୍ରା, ଏକାକୀପଣ, ବିଦେଶ ଓ ଭିତରମୁଖୀ ପ୍ରବୃତ୍ତି']
} as const;

const GRAHA:any={
  en:{Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturn',Rahu:'Rahu',Ketu:'Ketu'},
  hi:{Sun:'सूर्य',Moon:'चंद्र',Mercury:'बुध',Venus:'शुक्र',Mars:'मंगल',Jupiter:'बृहस्पति',Saturn:'शनि',Rahu:'राहु',Ketu:'केतु'},
  or:{Sun:'ସୂର୍ଯ୍ୟ',Moon:'ଚନ୍ଦ୍ର',Mercury:'ବୁଧ',Venus:'ଶୁକ୍ର',Mars:'ମଙ୍ଗଳ',Jupiter:'ବୃହସ୍ପତି',Saturn:'ଶନି',Rahu:'ରାହୁ',Ketu:'କେତୁ'}
};

function g(l:LifeLanguage,n:string){return GRAHA[l]?.[n]||n}
function natal(chart:Chart,name:string){return chart.planets.find(p=>p.name===name)}
function houseOfTransit(chart:Chart,p:TransitPlanet){return((p.rashiIndex-chart.ascendant.rashiIndex+12)%12)+1}
function date(l:LifeLanguage,x:number){return new Date(x).toLocaleDateString(l==='hi'?'hi-IN':l==='or'?'or-IN':'en-IN',{day:'numeric',month:'short',year:'numeric'})}
function domain(l:LifeLanguage,h:number){return HOUSE_DOMAINS[l][Math.max(1,Math.min(12,h))]}

function planetTone(l:LifeLanguage,name:string){
 const t:any={
  en:{Sun:'authority, confidence, visibility and important decisions',Moon:'emotions, family, comfort and changing moods',Mercury:'communication, paperwork, learning, interviews and decisions',Venus:'relationships, attraction, comfort, pleasure and spending',Mars:'urgency, competition, courage, conflict and action',Jupiter:'growth, advice, education, family support and expansion',Saturn:'responsibility, delay, discipline, workload and long-term restructuring',Rahu:'uncertainty, ambition, unusual situations, technology, foreign links and sudden shifts',Ketu:'detachment, endings, simplification, inner questioning and loss of interest in old patterns'},
  hi:{Sun:'अधिकार, आत्मविश्वास, पहचान और महत्वपूर्ण निर्णय',Moon:'भावनाएँ, परिवार, आराम और बदलता मन',Mercury:'बातचीत, कागजी काम, सीखना, इंटरव्यू और निर्णय',Venus:'संबंध, आकर्षण, आराम, आनंद और खर्च',Mars:'जल्दी, प्रतियोगिता, साहस, टकराव और कार्रवाई',Jupiter:'विकास, सलाह, शिक्षा, परिवार का सहयोग और विस्तार',Saturn:'जिम्मेदारी, देरी, अनुशासन, काम का बोझ और लंबी पुनर्रचना',Rahu:'अनिश्चितता, महत्वाकांक्षा, असामान्य परिस्थिति, तकनीक, विदेश से जुड़ाव और अचानक बदलाव',Ketu:'विरक्ति, समाप्ति, सरलता, भीतर के प्रश्न और पुरानी चीजों में रुचि कम होना'},
  or:{Sun:'ଅଧିକାର, ଆତ୍ମବିଶ୍ୱାସ, ପରିଚୟ ଓ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସିଦ୍ଧାନ୍ତ',Moon:'ଭାବନା, ପରିବାର, ସୁବିଧା ଓ ମନୋଭାବର ପରିବର୍ତ୍ତନ',Mercury:'ଯୋଗାଯୋଗ, କାଗଜପତ୍ର, ଶିକ୍ଷା, ଇଣ୍ଟରଭ୍ୟୁ ଓ ସିଦ୍ଧାନ୍ତ',Venus:'ସମ୍ପର୍କ, ଆକର୍ଷଣ, ସୁବିଧା, ଆନନ୍ଦ ଓ ଖର୍ଚ୍ଚ',Mars:'ତ୍ୱରା, ପ୍ରତିଯୋଗିତା, ସାହସ, ଦ୍ୱନ୍ଦ୍ୱ ଓ କାର୍ଯ୍ୟ',Jupiter:'ବୃଦ୍ଧି, ପରାମର୍ଶ, ଶିକ୍ଷା, ପରିବାର ସହଯୋଗ ଓ ବିସ୍ତାର',Saturn:'ଦାୟିତ୍ୱ, ବିଳମ୍ବ, ଶୃଙ୍ଖଳା, କାମର ଭାର ଓ ଦୀର୍ଘମିଆଦି ପୁନର୍ଗଠନ',Rahu:'ଅନିଶ୍ଚିତତା, ଆକାଙ୍କ୍ଷା, ଅସାମାନ୍ୟ ପରିସ୍ଥିତି, ପ୍ରଯୁକ୍ତି, ବିଦେଶୀ ସଂଯୋଗ ଓ ହଠାତ୍ ପରିବର୍ତ୍ତନ',Ketu:'ବିରକ୍ତି, ସମାପ୍ତି, ସରଳତା, ଭିତରୁ ପ୍ରଶ୍ନ ଓ ପୁରୁଣା ଜିନିଷରେ ଆଗ୍ରହ କମିବା'}
 };
 return t[l][name]||name;
}

function elementNature(l:LifeLanguage,element:string,kind:'asc'|'moon'){
 const x:any={
  en:{fire:'direct, action-oriented and quick to respond',earth:'practical, steady and results-oriented',air:'analytical, communicative and mentally active',water:'sensitive, intuitive and emotionally perceptive'},
  hi:{fire:'सीधे, कार्य-केंद्रित और जल्दी प्रतिक्रिया देने वाले',earth:'व्यावहारिक, स्थिर और परिणाम-केंद्रित',air:'विश्लेषणात्मक, संवादप्रिय और मानसिक रूप से सक्रिय',water:'संवेदनशील, सहज-बोध वाले और भावनात्मक संकेत जल्दी पकड़ने वाले'},
  or:{fire:'ସରଳ, କାର୍ଯ୍ୟମୁଖୀ ଓ ଶୀଘ୍ର ପ୍ରତିକ୍ରିୟାଶୀଳ',earth:'ବ୍ୟବହାରିକ, ସ୍ଥିର ଓ ଫଳମୁଖୀ',air:'ବିଶ୍ଳେଷଣମୂଳକ, ଯୋଗାଯୋଗପ୍ରିୟ ଓ ମାନସିକ ଭାବେ ସକ୍ରିୟ',water:'ସମ୍ବେଦନଶୀଳ, ଅନ୍ତର୍ଜ୍ଞାନୀ ଓ ଭାବନାତ୍ମକ ସଙ୍କେତ ଶୀଘ୍ର ବୁଝୁଥିବା'}
 };
 const trait=x[l][element]||x[l].earth;
 if(l==='hi')return kind==='asc'?`आपकी मूल बाहरी शैली ${trait} दिखती है।`:`भावनात्मक स्तर पर आप ${trait} हो सकते हैं।`;
 if(l==='or')return kind==='asc'?`ଆପଣଙ୍କ ମୂଳ ବାହ୍ୟ ସ୍ୱଭାବ ${trait} ଦେଖାଏ।`:`ଭାବନାତ୍ମକ ଭାବେ ଆପଣ ${trait} ହୋଇପାରନ୍ତି।`;
 return kind==='asc'?`Your outward style is likely to be ${trait}.`:`Emotionally, you may be ${trait}.`;
}

function dashaBullet(chart:Chart,l:LifeLanguage,name:string,level:'maha'|'antar'|'praty',startsAt:number,endsAt:number){
 const p=natal(chart,name),h=p?.house||1,dom=domain(l,h),tone=planetTone(l,name),label=level==='maha'?(l==='hi'?'महादशा':l==='or'?'ମହାଦଶା':'Mahadasha'):level==='antar'?(l==='hi'?'अंतरदशा':l==='or'?'ଅନ୍ତରଦଶା':'Antardasha'):(l==='hi'?'प्रत्यंतर':l==='or'?'ପ୍ରତ୍ୟନ୍ତର':'Pratyantar');
 if(l==='hi')return`${label} ${g(l,name)} (${date(l,startsAt)}–${date(l,endsAt)}) आपकी कुंडली के भाव ${h} से जुड़ी है। इसलिए ${dom} के साथ ${tone} अभी अधिक दिखाई दे सकते हैं।`;
 if(l==='or')return`${label} ${g(l,name)} (${date(l,startsAt)}–${date(l,endsAt)}) ଆପଣଙ୍କ କୁଣ୍ଡଳୀର ${h} ନମ୍ବର ଭାବ ସହ ଜଡିତ। ସେଥିପାଇଁ ${dom} ସହିତ ${tone} ବର୍ତ୍ତମାନ ଅଧିକ ପ୍ରକାଶିତ ହୋଇପାରେ।`;
 return`${label} ${g(l,name)} (${date(l,startsAt)}–${date(l,endsAt)}) activates natal house ${h}. This can make ${dom}, together with ${tone}, more noticeable now.`;
}

function transitBullet(chart:Chart,l:LifeLanguage,name:string,kind:'pressure'|'support'|'change',at:Date){
 const p=calculateTransits(at).planets.find(x=>x.name===name)!;const h=houseOfTransit(chart,p),dom=domain(l,h);
 if(l==='hi')return kind==='pressure'?`${g(l,name)} का वर्तमान गोचर भाव ${h} में है; ${dom} में जिम्मेदारी, धीमापन या बार-बार प्रयास की जरूरत महसूस हो सकती है।`:kind==='support'?`${g(l,name)} का गोचर भाव ${h} में है; ${dom} में सीखने, मदद, विस्तार या अवसर की गुंजाइश बढ़ सकती है।`:`${g(l,name)} का गोचर भाव ${h} में है; ${dom} में असामान्य बदलाव, बेचैनी या नया रास्ता आजमाने की इच्छा बढ़ सकती है।`;
 if(l==='or')return kind==='pressure'?`${g(l,name)} ଙ୍କ ବର୍ତ୍ତମାନ ଗୋଚର ${h} ନମ୍ବର ଭାବରେ ଅଛି; ${dom} ରେ ଦାୟିତ୍ୱ, ଧୀରଗତି କିମ୍ବା ପୁନଃପୁନି ଚେଷ୍ଟାର ଆବଶ୍ୟକତା ଲାଗିପାରେ।`:kind==='support'?`${g(l,name)} ଙ୍କ ଗୋଚର ${h} ନମ୍ବର ଭାବରେ ଅଛି; ${dom} ରେ ଶିଖିବା, ସହଯୋଗ, ବିସ୍ତାର କିମ୍ବା ସୁଯୋଗ ବଢ଼ିପାରେ।`:`${g(l,name)} ଙ୍କ ଗୋଚର ${h} ନମ୍ବର ଭାବରେ ଅଛି; ${dom} ରେ ଅସାମାନ୍ୟ ପରିବର୍ତ୍ତନ, ଅଶାନ୍ତି କିମ୍ବା ନୂଆ ପଥ ଚେଷ୍ଟା କରିବାର ଇଚ୍ଛା ବଢ଼ିପାରେ।`;
 return kind==='pressure'?`${g(l,name)} is transiting house ${h}; ${dom} may require more responsibility, patience or repeated effort.`:kind==='support'?`${g(l,name)} is transiting house ${h}; ${dom} may receive more room for learning, support, expansion or opportunity.`:`${g(l,name)} is transiting house ${h}; ${dom} may feel more unusual, restless or change-oriented.`;
}

function recentShift(chart:Chart,l:LifeLanguage,now:number){
 const d=getDashaAt(chart,now),out:string[]=[];
 const ageP=(now-d.pratyantarStartsAt)/DAY,ageA=(now-d.antardashaStartsAt)/DAY;
 if(ageP>=0&&ageP<=180){
  const p=natal(chart,d.pratyantarLord),h=p?.house||1;
  if(l==='hi')out.push(`लगभग ${date(l,d.pratyantarStartsAt)} से प्रत्यंतर ${g(l,d.pratyantarLord)} शुरू हुआ। इसके बाद ${domain(l,h)} से जुड़े विषय और ${planetTone(l,d.pratyantarLord)} पहले की तुलना में अधिक महसूस हुए हों, यह एक संभावित संकेत है।`);
  else if(l==='or')out.push(`ପ୍ରାୟ ${date(l,d.pratyantarStartsAt)} ଠାରୁ ${g(l,d.pratyantarLord)} ପ୍ରତ୍ୟନ୍ତର ଆରମ୍ଭ ହୋଇଛି। ତାହା ପରେ ${domain(l,h)} ସମ୍ବନ୍ଧୀୟ ବିଷୟ ଓ ${planetTone(l,d.pratyantarLord)} ପୂର୍ବପେକ୍ଷା ଅଧିକ ଅନୁଭବ ହୋଇଥାଇପାରେ—ଏହା ଏକ ସମ୍ଭାବ୍ୟ ସଙ୍କେତ।`);
  else out.push(`Around ${date(l,d.pratyantarStartsAt)}, the Pratyantar shifted to ${g(l,d.pratyantarLord)}. Since then, ${domain(l,h)} and ${planetTone(l,d.pratyantarLord)} may have become more noticeable than before.`);
 }
 if(ageA>=0&&ageA<=365){
  const p=natal(chart,d.antardashaLord),h=p?.house||1;
  if(l==='hi')out.push(`${date(l,d.antardashaStartsAt)} के आसपास अंतरदशा ${g(l,d.antardashaLord)} शुरू हुई। इससे पिछले महीनों में ${domain(l,h)} एक लगातार चलने वाला मुख्य विषय रहा हो सकता है।`);
  else if(l==='or')out.push(`${date(l,d.antardashaStartsAt)} ଚାରିପାଖରେ ${g(l,d.antardashaLord)} ଅନ୍ତରଦଶା ଆରମ୍ଭ ହୋଇଛି। ତେଣୁ ଗତ କିଛି ମାସ ଧରି ${domain(l,h)} ଏକ ଚାଲୁଥିବା ମୁଖ୍ୟ ବିଷୟ ହୋଇଥାଇପାରେ।`);
  else out.push(`The ${g(l,d.antardashaLord)} Antardasha began around ${date(l,d.antardashaStartsAt)}, so ${domain(l,h)} may have been a repeating theme across recent months.`);
 }
 const old=calculateTransits(new Date(now-120*DAY)),cur=calculateTransits(new Date(now));
 for(const name of ['Saturn','Jupiter','Rahu'] as const){const a=old.planets.find(x=>x.name===name)!,b=cur.planets.find(x=>x.name===name)!;const ha=houseOfTransit(chart,a),hb=houseOfTransit(chart,b);if(ha!==hb){if(l==='hi')out.push(`पिछले लगभग चार महीनों में ${g(l,name)} का गोचर भाव ${ha} से भाव ${hb} में बदला है। इससे ध्यान ${domain(l,ha)} से ${domain(l,hb)} की ओर खिसका हो सकता है।`);else if(l==='or')out.push(`ଗତ ପ୍ରାୟ ଚାରି ମାସରେ ${g(l,name)} ଙ୍କ ଗୋଚର ${ha} ନମ୍ବର ଭାବରୁ ${hb} ନମ୍ବର ଭାବକୁ ବଦଳିଛି। ତେଣୁ ଧ୍ୟାନ ${domain(l,ha)} ଠାରୁ ${domain(l,hb)} ଦିଗକୁ ସରିଥାଇପାରେ।`);else out.push(`During roughly the last four months, ${g(l,name)} moved from house ${ha} to house ${hb}, potentially shifting emphasis from ${domain(l,ha)} toward ${domain(l,hb)}.`);break}}
 if(!out.length){const p=natal(chart,d.pratyantarLord),h=p?.house||1;if(l==='hi')out.push(`पिछले कुछ महीनों में कोई बड़ा दशा-स्तर परिवर्तन नहीं दिखता; इसलिए ${domain(l,h)} से जुड़े वही विषय बार-बार दोहराए गए हों, यह अधिक संभावित है।`);else if(l==='or')out.push(`ଗତ କିଛି ମାସରେ ବଡ଼ ଦଶା-ସ୍ତର ପରିବର୍ତ୍ତନ ଦେଖାଯାଉନାହିଁ; ସେଥିପାଇଁ ${domain(l,h)} ସମ୍ବନ୍ଧୀୟ ବିଷୟ ପୁନଃପୁନି ଆସିଥାଇପାରେ।`);else out.push(`There is no major dasha-level switch in the recent window, so themes linked with ${domain(l,h)} may have repeated rather than changed suddenly.`)}
 return out.slice(0,3);
}

function nearTerm(chart:Chart,l:LifeLanguage,now:number){const d=getDashaAt(chart,now),out:string[]=[];const nextAt=d.pratyantarEndsAt+3600000;if(nextAt>now&&nextAt-now<240*DAY){const n=getDashaAt(chart,nextAt),p=natal(chart,n.pratyantarLord),h=p?.house||1;if(l==='hi')out.push(`${date(l,d.pratyantarEndsAt)} के बाद अगला प्रत्यंतर ${g(l,n.pratyantarLord)} होगा। तब ध्यान ${domain(l,h)} और ${planetTone(l,n.pratyantarLord)} की ओर अधिक जा सकता है।`);else if(l==='or')out.push(`${date(l,d.pratyantarEndsAt)} ପରେ ପରବର୍ତ୍ତୀ ପ୍ରତ୍ୟନ୍ତର ${g(l,n.pratyantarLord)} ହେବ। ସେତେବେଳେ ଧ୍ୟାନ ${domain(l,h)} ଓ ${planetTone(l,n.pratyantarLord)} ଦିଗକୁ ଅଧିକ ଯାଇପାରେ।`);else out.push(`After ${date(l,d.pratyantarEndsAt)}, the next Pratyantar is ${g(l,n.pratyantarLord)}. Attention may then move more toward ${domain(l,h)} and ${planetTone(l,n.pratyantarLord)}.`)}
 const future=calculateTransits(new Date(now+90*DAY)),cur=calculateTransits(new Date(now));for(const name of ['Saturn','Jupiter','Rahu'] as const){const a=cur.planets.find(x=>x.name===name)!,b=future.planets.find(x=>x.name===name)!;const ha=houseOfTransit(chart,a),hb=houseOfTransit(chart,b);if(ha!==hb){if(l==='hi')out.push(`अगले लगभग 90 दिनों में ${g(l,name)} भाव ${ha} से भाव ${hb} की ओर जा रहा है, इसलिए ${domain(l,hb)} का महत्व बढ़ सकता है।`);else if(l==='or')out.push(`ଆସନ୍ତା ପ୍ରାୟ 90 ଦିନରେ ${g(l,name)} ${ha} ନମ୍ବର ଭାବରୁ ${hb} ନମ୍ବର ଭାବକୁ ଯାଉଛନ୍ତି; ସେଥିପାଇଁ ${domain(l,hb)} ର ଗୁରୁତ୍ୱ ବଢ଼ିପାରେ।`);else out.push(`Over roughly the next 90 days, ${g(l,name)} moves from house ${ha} toward house ${hb}, increasing emphasis on ${domain(l,hb)}.`);break}}
 if(!out.length){if(l==='hi')out.push(`निकट अवधि में वर्तमान प्रत्यंतर ${g(l,d.pratyantarLord)} ही मुख्य संकेतक रहेगा; इसलिए अचानक निष्कर्ष के बजाय इसी अवधि की दोहराती थीम पर ध्यान दें।`);else if(l==='or')out.push(`ନିକଟ ଅବଧିରେ ବର୍ତ୍ତମାନର ${g(l,d.pratyantarLord)} ପ୍ରତ୍ୟନ୍ତର ମୁଖ୍ୟ ସଙ୍କେତକ ରହିବ; ହଠାତ୍ ନିଷ୍କର୍ଷ ନେବାଠାରୁ ଏହି ଅବଧିର ପୁନରାବୃତ୍ତ ବିଷୟକୁ ଧ୍ୟାନ ଦିଅନ୍ତୁ।`);else out.push(`In the near term, the current ${g(l,d.pratyantarLord)} Pratyantar remains the main timing signal, so repeated themes matter more than a sudden one-off prediction.`)}return out.slice(0,2)}

export function buildLifePatterns(chart:Chart,l:LifeLanguage='en',at:Date=new Date()):LifePatternReport{
 const now=at.getTime(),d=getDashaAt(chart,now),moon=natal(chart,'Moon')!;
 const nature=[elementNature(l,ELEMENT[chart.ascendant.rashi]||'earth','asc'),elementNature(l,ELEMENT[moon.rashi]||'water','moon')];
 if(l==='hi')nature.push(`अभी आपके व्यवहार पर ${g(l,d.antardashaLord)} और ${g(l,d.pratyantarLord)} का समय-प्रभाव अधिक है; इससे ${planetTone(l,d.pratyantarLord)} जैसी प्रवृत्तियाँ सामान्य से अधिक महसूस हो सकती हैं।`);else if(l==='or')nature.push(`ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ବ୍ୟବହାରରେ ${g(l,d.antardashaLord)} ଓ ${g(l,d.pratyantarLord)} ସମୟ-ପ୍ରଭାବ ଅଧିକ; ତେଣୁ ${planetTone(l,d.pratyantarLord)} ଭଳି ପ୍ରବୃତ୍ତି ସାଧାରଣଠାରୁ ଅଧିକ ଅନୁଭବ ହୋଇପାରେ।`);else nature.push(`Recently, ${g(l,d.antardashaLord)} and ${g(l,d.pratyantarLord)} are the strongest timing influences, so ${planetTone(l,d.pratyantarLord)} may feel stronger than your usual baseline.`);
 const current=[dashaBullet(chart,l,d.pratyantarLord,'praty',d.pratyantarStartsAt,d.pratyantarEndsAt),dashaBullet(chart,l,d.antardashaLord,'antar',d.antardashaStartsAt,d.antardashaEndsAt),transitBullet(chart,l,'Saturn','pressure',at),transitBullet(chart,l,'Jupiter','support',at),transitBullet(chart,l,'Rahu','change',at)];
 const sat=calculateTransits(at).planets.find(x=>x.name==='Saturn')!,jup=calculateTransits(at).planets.find(x=>x.name==='Jupiter')!,rah=calculateTransits(at).planets.find(x=>x.name==='Rahu')!;
 const evidence=l==='hi'?[`महादशा: ${g(l,d.mahadashaLord)} · अंतरदशा: ${g(l,d.antardashaLord)} · प्रत्यंतर: ${g(l,d.pratyantarLord)}`,`वर्तमान गोचर भाव — शनि ${houseOfTransit(chart,sat)}, बृहस्पति ${houseOfTransit(chart,jup)}, राहु ${houseOfTransit(chart,rah)}`]:l==='or'?[`ମହାଦଶା: ${g(l,d.mahadashaLord)} · ଅନ୍ତରଦଶା: ${g(l,d.antardashaLord)} · ପ୍ରତ୍ୟନ୍ତର: ${g(l,d.pratyantarLord)}`,`ବର୍ତ୍ତମାନ ଗୋଚର ଭାବ — ଶନି ${houseOfTransit(chart,sat)}, ବୃହସ୍ପତି ${houseOfTransit(chart,jup)}, ରାହୁ ${houseOfTransit(chart,rah)}`]:[`Mahadasha: ${g(l,d.mahadashaLord)} · Antardasha: ${g(l,d.antardashaLord)} · Pratyantar: ${g(l,d.pratyantarLord)}`,`Current transit houses — Saturn ${houseOfTransit(chart,sat)}, Jupiter ${houseOfTransit(chart,jup)}, Rahu ${houseOfTransit(chart,rah)}`];
 const title=l==='hi'?'अभी आपके जीवन में क्या चल रहा हो सकता है':l==='or'?'ଏବେ ଆପଣଙ୍କ ଜୀବନରେ କଣ ଚାଲିଥାଇପାରେ':'What may be happening in your life now';
 const subtitle=l==='hi'?'दशा, जन्म-भाव और वर्तमान गोचर से निकला व्यक्तिगत पारंपरिक ज्योतिषीय पैटर्न':l==='or'?'ଦଶା, ଜନ୍ମ ଭାବ ଓ ବର୍ତ୍ତମାନ ଗୋଚରରୁ ନିଷ୍ପାଦିତ ବ୍ୟକ୍ତିଗତ ପାରମ୍ପରିକ ଜ୍ୟୋତିଷୀୟ ପ୍ୟାଟର୍ନ':'Personal traditional Jyotish patterns derived from your dasha, natal houses and current transits';
 const disclaimer=l==='hi'?'ये सत्यापित घटनाएँ नहीं हैं। ये आपकी कुंडली से निकले संभावित पैटर्न हैं; सही जन्म समय/स्थान से समय-संवेदनशील भाग अधिक विश्वसनीय होता है। ज्योतिष वैज्ञानिक रूप से स्थापित भविष्यवाणी नहीं है।':l==='or'?'ଏଗୁଡ଼ିକ ସତ୍ୟାପିତ ଘଟଣା ନୁହେଁ। ଏଗୁଡ଼ିକ ଆପଣଙ୍କ କୁଣ୍ଡଳୀରୁ ନିଷ୍ପାଦିତ ସମ୍ଭାବ୍ୟ ପ୍ୟାଟର୍ନ; ସଠିକ୍ ଜନ୍ମ ସମୟ ଓ ସ୍ଥାନ ଥିଲେ ସମୟ-ସମ୍ବେଦନଶୀଳ ଅଂଶ ଅଧିକ ନିଖୁତ ହୁଏ। ଜ୍ୟୋତିଷ ବୈଜ୍ଞାନିକ ଭାବେ ସ୍ଥାପିତ ଭବିଷ୍ୟବାଣୀ ନୁହେଁ।':'These are not verified events. They are possible chart-derived patterns; exact birth time and place improve timing-sensitive interpretation. Astrology is not a scientifically established prediction method.';
 return{title,subtitle,nature,current:current.slice(0,5),recent:recentShift(chart,l,now),nearTerm:nearTerm(chart,l,now),evidence,disclaimer};
}

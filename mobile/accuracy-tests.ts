import {calculateChart,calculateTransits,getDashaAt} from './astrology';
import {analyseQuestion} from './guidance';

function check(condition:boolean,message:string){if(!condition)throw new Error(`AstroSathi regression failed: ${message}`)}
function in360(v:number){return Number.isFinite(v)&&v>=0&&v<360}

const chart=calculateChart('2000-01-01','12:00',28.6139,77.2090,330);
check(chart.planets.length===9,'expected 9 grahas');
check(in360(chart.ascendant.longitude),'ascendant longitude out of range');
check(chart.ascendant.rashiIndex>=0&&chart.ascendant.rashiIndex<12,'lagna sign index out of range');
check(chart.panchang.tithiNumber>=1&&chart.panchang.tithiNumber<=30,'tithi out of range');
for(const x of chart.planets){check(in360(x.siderealLongitude),`${x.name} longitude out of range`);check(x.house>=1&&x.house<=12,`${x.name} house out of range`);check(x.rashiIndex>=0&&x.rashiIndex<12,`${x.name} rashi index out of range`)}
const rahu=chart.planets.find(x=>x.name==='Rahu')!,ketu=chart.planets.find(x=>x.name==='Ketu')!;
const nodeSep=Math.abs((((ketu.siderealLongitude-rahu.siderealLongitude)+360)%360)-180);
check(nodeSep<1e-7,'Rahu/Ketu must be exactly opposite');
check(chart.ayanamsaDegrees>20&&chart.ayanamsaDegrees<30,'ayanamsa sanity range failed');

const now=Date.now(),dasha=getDashaAt(chart,now);
check(dasha.mahadashaStartsAt<=now&&now<dasha.mahadashaEndsAt,'current Mahadasha must contain now');
check(dasha.antardashaStartsAt<=now&&now<dasha.antardashaEndsAt,'current Antardasha must contain now');
check(dasha.pratyantarStartsAt<=now&&now<dasha.pratyantarEndsAt,'current Pratyantar must contain now');
check(dasha.antardashaStartsAt>=dasha.mahadashaStartsAt&&dasha.antardashaEndsAt<=dasha.mahadashaEndsAt,'Antardasha must stay inside Mahadasha');
check(dasha.pratyantarStartsAt>=dasha.antardashaStartsAt&&dasha.pratyantarEndsAt<=dasha.antardashaEndsAt,'Pratyantar must stay inside Antardasha');

const transits=calculateTransits(new Date('2026-08-14T00:00:00Z'));
check(transits.planets.length===9,'transit snapshot must contain 9 grahas');
for(const x of transits.planets)check(in360(x.siderealLongitude),`transit ${x.name} longitude out of range`);

const career=analyseQuestion(chart,'When will I get a job?','en');
check(career.topic==='career','career intent detection failed');
check(career.timingWindows.length>0&&career.timingWindows.length<=3,'career timing windows missing');
for(const w of career.timingWindows){check(w.startAt<=w.endAt,'timing window order invalid');check(w.score>=15&&w.score<=92,'timing score out of range')}
check(career.currentSituation.includes('Mahadasha'),'current dasha explanation missing');
check(career.remedies.length>0,'remedies missing');
const followUp=analyseQuestion(chart,'when exactly?','en',career.topic);
check(followUp.topic==='career','follow-up topic memory failed');
const study=analyseQuestion(chart,'ମୋ ପରୀକ୍ଷା ଓ ପଢ଼ା କେମିତି ହେବ?','or');
check(study.topic==='education','Odia education intent detection failed');

console.log('AstroSathi deterministic astrology/guidance regression checks passed');

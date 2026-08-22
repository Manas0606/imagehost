import {calculateChart,calculateTransits,getDashaAt,normalizeBirthTime} from './astrology';
import {analyseQuestion} from './guidance';
import {historicalOffsetMinutes,timezoneForLocation} from './location';

function check(condition:boolean,message:string){if(!condition)throw new Error(`AstroSathi regression failed: ${message}`)}
function in360(v:number){return Number.isFinite(v)&&v>=0&&v<360}

check(normalizeBirthTime('2:30 AM')==='02:30','12-hour AM parsing failed');
check(normalizeBirthTime('2:30 PM')==='14:30','12-hour PM parsing failed');
check(normalizeBirthTime('12:00 AM')==='00:00','midnight parsing failed');
check(normalizeBirthTime('12:00 PM')==='12:00','noon parsing failed');
check(normalizeBirthTime('2:30')==='02:30','short 24-hour parsing failed');
const chart12=calculateChart('1998-07-10','2:30 AM',20.4625,85.8830,330);
const chart24=calculateChart('1998-07-10','02:30',20.4625,85.8830,330);
check(chart12.utc===chart24.utc,'AM/PM and 24-hour inputs must resolve to same UTC instant');
check(Math.abs(chart12.ascendant.longitude-chart24.ascendant.longitude)<1e-10,'AM/PM and 24-hour inputs must produce same ascendant');
let invalidDateRejected=false;try{calculateChart('2026-02-31','12:00',20.2961,85.8245,330)}catch{invalidDateRejected=true}check(invalidDateRejected,'invalid calendar date must be rejected');

const odishaZone=timezoneForLocation(20.4625,85.8830,'IN');
check(odishaZone==='Asia/Kolkata','Indian birthplace must resolve to Asia/Kolkata');
const indiaOffset=historicalOffsetMinutes('1998-07-10','2:30 AM',odishaZone);
check(indiaOffset===330,'1998 Indian birth must resolve to UTC +05:30');
const villageChart=calculateChart('1998-07-10','2:30 AM',20.123456,84.654321,indiaOffset);
check(villageChart.utc==='1998-07-09T21:00:00.000Z','birth local time must convert to UTC using resolved Indian offset');

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

console.log('AstroSathi deterministic astrology/guidance/location regression checks passed');

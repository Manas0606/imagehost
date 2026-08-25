import {calculateChart} from './astrology';
import {buildLifePatterns} from './life-patterns';

function check(x:boolean,m:string){if(!x)throw new Error(`AstroSathi life-pattern regression failed: ${m}`)}
const at=new Date('2026-08-25T03:00:00Z');
const chart=calculateChart('1998-07-10','2:30 AM',20.4625,85.8830,330);
const en=buildLifePatterns(chart,'en',at);
check(en.nature.length>=3,'nature analysis is missing');
check(en.current.length>=4,'current-life analysis is too shallow');
check(en.recent.length>=1,'recent-period analysis is missing');
check(en.nearTerm.length>=1,'near-term analysis is missing');
check(en.evidence.some(x=>/Mahadasha/i.test(x)),'dasha evidence is missing');
check(en.current.some(x=>/house \d+/i.test(x)),'current analysis is not tied to natal houses');
check(!en.recent.join(' ').toLowerCase().includes('definitely happened'),'recent-period wording must not claim unverified events as facts');
const hi=buildLifePatterns(chart,'hi',at);
check(/[\u0900-\u097F]/.test(hi.title+hi.current.join('')),'Hindi life-pattern localization failed');
const od=buildLifePatterns(chart,'or',at);
check(/[\u0B00-\u0B7F]/.test(od.title+od.current.join('')),'Odia life-pattern localization failed');
const other=calculateChart('1994-03-21','14:15',28.6139,77.2090,330);
const en2=buildLifePatterns(other,'en',at);
check(JSON.stringify(en.current)!==JSON.stringify(en2.current),'different charts should not produce identical current predictions');
console.log('AstroSathi chart-derived life-pattern regression passed');

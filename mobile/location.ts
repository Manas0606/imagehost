import tzlookup from '@photostructure/tz-lookup';
import {normalizeBirthTime} from './astrology';

export type BirthPlaceResult={
  label:string;
  latitude:number;
  longitude:number;
  countryCode?:string;
  source?:string;
};

export function timezoneForLocation(latitude:number,longitude:number,countryCode?:string){
  if(!Number.isFinite(latitude)||latitude<-90||latitude>90)throw new Error('Invalid latitude.');
  if(!Number.isFinite(longitude)||longitude<-180||longitude>180)throw new Error('Invalid longitude.');
  // India uses one civil IANA zone. Keeping this explicit avoids any border-compression
  // ambiguity from compact global timezone lookup data for Indian villages.
  if((countryCode||'').trim().toUpperCase()==='IN')return'Asia/Kolkata';
  return tzlookup(latitude,longitude);
}

function partsAt(utcMs:number,timeZone:string){
  const fmt=new Intl.DateTimeFormat('en-CA',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  });
  const p=fmt.formatToParts(new Date(utcMs));
  const get=(t:Intl.DateTimeFormatPartTypes)=>Number(p.find(x=>x.type===t)?.value||0);
  return{year:get('year'),month:get('month'),day:get('day'),hour:get('hour'),minute:get('minute'),second:get('second')};
}

/**
 * Returns the historical UTC offset, in minutes east of UTC, that applies to
 * the supplied local wall-clock birth date/time in an IANA timezone.
 */
export function historicalOffsetMinutes(date:string,time:string,timeZone:string){
  const dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if(!dm)throw new Error('Use birth date as YYYY-MM-DD.');
  const nt=normalizeBirthTime(time);
  const tm=/^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(nt)!;
  const y=+dm[1],m=+dm[2],d=+dm[3],h=+tm[1],mi=+tm[2],s=+(tm[3]||0);
  const localAsUtc=Date.UTC(y,m-1,d,h,mi,s);
  let utcGuess=localAsUtc;
  // Fixed-point conversion from desired local wall-clock to UTC. Four rounds
  // are ample even around DST transitions. India has no modern DST ambiguity.
  for(let i=0;i<4;i++){
    const p=partsAt(utcGuess,timeZone);
    const renderedAsUtc=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
    utcGuess+=localAsUtc-renderedAsUtc;
  }
  return Math.round((localAsUtc-utcGuess)/60000);
}

export function resolveBirthLocation(result:BirthPlaceResult,date:string,time:string){
  const timeZone=timezoneForLocation(result.latitude,result.longitude,result.countryCode);
  const offsetMinutes=historicalOffsetMinutes(date,time,timeZone);
  return{...result,timeZone,offsetMinutes};
}

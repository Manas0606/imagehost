import {NativeModules} from 'react-native';

const {AstroNative}=NativeModules;

export const PREMIUM_SERVICE_URL='https://astro-sathi-approval.lovable.app';
export const PREMIUM_POLL_MS=3*1000;
export const PREMIUM_STALE_MS=60*1000;
export const DEFAULT_PREMIUM_PRICE_INR=20;
export const DEFAULT_PREMIUM_DURATION_MINUTES=360;

export type PremiumStateKind='checking'|'active'|'pending'|'stopped'|'rejected'|'expired'|'offline';
export type PremiumState={
 kind:PremiumStateKind;
 message:string;
 approvedAt?:number;
 expiresAt?:number;
 serverNow:number;
 syncedAt:number;
 priceInr?:number;
 durationMinutes?:number;
 currency?:string;
 telegramAdminReady?:boolean;
 requestSubmitted?:boolean;
 requestId?:string;
};
export type PremiumRequestPayload={name:string;email:string;deviceId:string;utr:string};

type LocalRequest={requestId:string;email:string;deviceId:string;createdAt:number};

function normEmail(v?:string){return(v||'').trim().toLowerCase()}
async function readLocal():Promise<LocalRequest|undefined>{
 try{
  if(!AstroNative?.getPremiumLocalState)return undefined;
  const raw=await AstroNative.getPremiumLocalState();
  if(!raw||typeof raw!=='string')return undefined;
  const x=JSON.parse(raw);
  return x?.requestId?{requestId:String(x.requestId),email:normEmail(x.email),deviceId:String(x.deviceId||''),createdAt:Number(x.createdAt||Date.now())}:undefined;
 }catch{return undefined}
}
async function saveLocal(x:LocalRequest){try{if(AstroNative?.savePremiumLocalState)await AstroNative.savePremiumLocalState(JSON.stringify(x))}catch{}}
async function clearLocal(){try{if(AstroNative?.clearPremiumLocalState)await AstroNative.clearPremiumLocalState()}catch{}}

function asTime(v:any):number|undefined{
 if(v==null||v==='')return undefined;
 if(typeof v==='number'&&Number.isFinite(v))return v;
 const numeric=Number(v);
 if(typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v.trim())&&Number.isFinite(numeric))return numeric;
 const parsed=Date.parse(String(v));
 return Number.isFinite(parsed)?parsed:undefined;
}
function asNumber(v:any){const n=Number(v);return Number.isFinite(n)?n:undefined}
function asState(data:any,local?:LocalRequest):PremiumState{
 const now=Date.now();
 const rawKind=String(data?.kind||'pending');
 const kind=(['active','pending','stopped','rejected','expired'].includes(rawKind)?rawKind:'pending') as PremiumStateKind;
 const requestId=String(data?.requestId||local?.requestId||'')||undefined;
 const approvedAt=asTime(data?.approvedAt);
 const expiresAt=asTime(data?.expiresAt);
 const serverNow=asTime(data?.serverNow)||now;
 const defaultMessage=kind==='active'?'Payment approved. Premium is active.':kind==='pending'?'Premium request is waiting for admin approval.':kind==='rejected'?'Premium request was rejected.':kind==='stopped'?'Premium access was stopped.':'Premium access has expired.';
 return{
  kind,
  message:String(data?.message||defaultMessage),
  approvedAt,
  expiresAt,
  serverNow,
  syncedAt:now,
  priceInr:asNumber(data?.priceInr)||DEFAULT_PREMIUM_PRICE_INR,
  durationMinutes:asNumber(data?.durationMinutes)||DEFAULT_PREMIUM_DURATION_MINUTES,
  currency:String(data?.currency||'INR'),
  telegramAdminReady:true,
  requestSubmitted:kind==='pending'&&Boolean(local?.requestId),
  requestId,
 };
}

export async function fetchPremium(deviceId:string,email?:string):Promise<PremiumState>{
 const e=normEmail(email);
 if(!e||!e.includes('@'))throw new Error('Login email is required to check Premium.');
 const local=await readLocal();
 const params=[`email=${encodeURIComponent(e)}`,`deviceId=${encodeURIComponent(deviceId||'')}`];
 if(local?.requestId)params.push(`requestId=${encodeURIComponent(local.requestId)}`);
 const res=await fetch(`${PREMIUM_SERVICE_URL}/api/premium/status?${params.join('&')}`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
 const body=await res.json().catch(()=>({}));
 if(!res.ok||body?.error)throw new Error(body?.message||body?.error||`Premium service returned ${res.status}.`);
 const st=asState(body,local);
 if(local&&['active','rejected','stopped','expired'].includes(st.kind))await clearLocal();
 return st;
}

export async function sendTelegramPremiumRequest(state:PremiumState,payload:PremiumRequestPayload){
 const email=normEmail(payload.email),deviceId=(payload.deviceId||'').trim(),utr=(payload.utr||'').trim();
 if(!email||!email.includes('@'))throw new Error('Login email is required for Premium recovery.');
 if(!deviceId||!utr)throw new Error('Device ID and UTR are required.');
 const res=await fetch(`${PREMIUM_SERVICE_URL}/api/premium/request`,{
  method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
  body:JSON.stringify({email,deviceId,utr}),
 });
 const body=await res.json().catch(()=>({}));
 if(!res.ok||body?.error)throw new Error(body?.message||body?.error||`Premium request failed (${res.status}).`);
 const requestId=String(body.requestId||'');
 if(!requestId)throw new Error('Premium service did not return a request ID.');
 await saveLocal({requestId,email,deviceId,createdAt:Date.now()});
 return requestId;
}

export function trustedNow(state?:PremiumState){if(!state)return Date.now();return state.serverNow+Math.max(0,Date.now()-state.syncedAt)}
export function remainingMs(state?:PremiumState){if(!state?.expiresAt)return 0;return Math.max(0,state.expiresAt-trustedNow(state))}
export function isPremiumUsable(state?:PremiumState){return Boolean(state?.kind==='active'&&state.expiresAt&&remainingMs(state)>0&&(Date.now()-state.syncedAt)<=PREMIUM_STALE_MS)}
export function formatRemaining(ms:number){const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`}

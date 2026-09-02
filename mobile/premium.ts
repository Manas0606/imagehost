import {NativeModules} from 'react-native';

const {AstroNative}=NativeModules;

export const PREMIUM_CONTROL_URL =
  'https://raw.githubusercontent.com/Manas0606/imagehost/astrosathi-control/premium-control.json';

export const PREMIUM_POLL_MS = 15 * 1000;
export const PREMIUM_STALE_MS = 45 * 1000;
export const DEFAULT_PREMIUM_PRICE_INR = 20;
export const DEFAULT_PREMIUM_DURATION_MINUTES = 360;

export type RemoteEntry = {
  status?: 'approved' | 'stopped' | 'pending' | 'rejected';
  approvedAt?: string;
  expiresAt?: string;
  durationMinutes?: number;
  message?: string;
  requestId?: string;
  decisionAt?: string;
};

export type PremiumConfig = {
  priceInr?: number;
  durationMinutes?: number;
  currency?: string;
  telegramAdminChatId?: string | number;
  telegramAdminUserId?: string | number;
  telegramBotToken?: string;
};

export type PremiumControl = {
  version?: number;
  config?: PremiumConfig;
  global?: { premiumEnabled?: boolean; message?: string };
  devices?: Record<string, RemoteEntry>;
  users?: Record<string, RemoteEntry>;
};

export type PremiumStateKind =
  | 'checking' | 'active' | 'pending' | 'stopped' | 'rejected' | 'expired' | 'offline';

export type PremiumState = {
  kind: PremiumStateKind;
  message: string;
  approvedAt?: number;
  expiresAt?: number;
  serverNow: number;
  syncedAt: number;
  priceInr?: number;
  durationMinutes?: number;
  currency?: string;
  telegramAdminChatId?: string;
  telegramAdminUserId?: string;
  telegramBotToken?: string;
  telegramAdminReady?: boolean;
  requestSubmitted?: boolean;
  requestId?: string;
};

export type PremiumRequestPayload = {
  name: string;
  email: string;
  deviceId: string;
  utr: string;
};

type LocalPremiumRecord = {
  requestId: string;
  name: string;
  email: string;
  deviceId: string;
  amount: number;
  durationMinutes: number;
  status: 'pending'|'approved'|'rejected'|'stopped';
  createdAt: number;
  approvedAt?: number;
  expiresAt?: number;
  message?: string;
  decisionUpdateId?: number;
};

function normEmail(v?: string) { return (v || '').trim().toLowerCase(); }
function safePositiveInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}
function configOf(cfg: PremiumControl) {
  const priceInr = safePositiveInt(cfg.config?.priceInr, DEFAULT_PREMIUM_PRICE_INR);
  const durationMinutes = safePositiveInt(cfg.config?.durationMinutes, DEFAULT_PREMIUM_DURATION_MINUTES);
  const currency = (cfg.config?.currency || 'INR').trim().toUpperCase() || 'INR';
  const telegramAdminChatId = cfg.config?.telegramAdminChatId == null ? undefined : String(cfg.config.telegramAdminChatId).trim();
  const telegramAdminUserId = cfg.config?.telegramAdminUserId == null ? undefined : String(cfg.config.telegramAdminUserId).trim();
  const telegramBotToken = (cfg.config?.telegramBotToken || '').trim() || undefined;
  return {
    priceInr,durationMinutes,currency,
    telegramAdminChatId:telegramAdminChatId||undefined,
    telegramAdminUserId:telegramAdminUserId||undefined,
    telegramBotToken,
    telegramAdminReady:Boolean(telegramAdminChatId&&telegramAdminUserId&&telegramBotToken),
  };
}
function pickEntry(cfg: PremiumControl, deviceId: string, email?: string): RemoteEntry | undefined {
  if (cfg.devices?.[deviceId]) return cfg.devices[deviceId];
  const e = normEmail(email);
  if (e && cfg.users?.[e]) return cfg.users[e];
  return undefined;
}
function base(cfg: PremiumControl, serverNow: number, syncedAt: number) { return {serverNow,syncedAt,...configOf(cfg)}; }
function sameLocal(local:LocalPremiumRecord|undefined,deviceId:string,email?:string){
  if(!local||local.deviceId!==deviceId)return false;
  const a=normEmail(local.email),b=normEmail(email);
  return !a||!b||a===b;
}
async function readLocal():Promise<LocalPremiumRecord|undefined>{
  try{
    if(!AstroNative?.getPremiumLocalState)return undefined;
    const raw=await AstroNative.getPremiumLocalState();
    if(!raw||typeof raw!=='string')return undefined;
    const parsed=JSON.parse(raw) as LocalPremiumRecord;
    return parsed?.requestId&&parsed?.deviceId?parsed:undefined;
  }catch{return undefined}
}
async function saveLocal(record:LocalPremiumRecord){
  try{if(AstroNative?.savePremiumLocalState)await AstroNative.savePremiumLocalState(JSON.stringify(record))}catch{}
}
async function clearLocal(){try{if(AstroNative?.clearPremiumLocalState)await AstroNative.clearPremiumLocalState()}catch{}}

export function resolvePremium(cfg: PremiumControl, deviceId: string, email: string|undefined, serverNow: number, syncedAt: number): PremiumState {
  const common=base(cfg,serverNow,syncedAt), globalMessage=cfg.global?.message||'';
  if(cfg.global?.premiumEnabled===false)return{kind:'stopped',message:globalMessage||'Premium access is temporarily stopped by the Jyotish G admin.',...common};
  const entry=pickEntry(cfg,deviceId,email);
  if(!entry)return{kind:'pending',message:globalMessage||'Pay the configured amount and send your UTR for admin approval.',...common};
  const requestId=entry.requestId;
  if(entry.status==='stopped')return{kind:'stopped',message:entry.message||globalMessage||'Your premium access has been stopped by the admin.',requestId,...common};
  if(entry.status==='rejected')return{kind:'rejected',message:entry.message||'Your premium request was rejected. Please verify the payment details and try again.',requestId,...common};
  if(entry.status!=='approved')return{kind:'pending',message:entry.message||globalMessage||'Your payment is waiting for admin approval.',requestId,...common};
  const approvedAt=Date.parse(entry.approvedAt||'');
  if(!Number.isFinite(approvedAt))return{kind:'pending',message:'Approval exists, but the approval time is invalid.',requestId,...common};
  const storedExpiry=Date.parse(entry.expiresAt||'');
  const approvalDuration=safePositiveInt(entry.durationMinutes,common.durationMinutes);
  const expiresAt=Number.isFinite(storedExpiry)?storedExpiry:approvedAt+approvalDuration*60*1000;
  if(serverNow<approvedAt)return{kind:'pending',message:entry.message||'Premium is approved and will start at the configured approval time.',approvedAt,expiresAt,requestId,...common};
  if(serverNow>=expiresAt)return{kind:'expired',message:entry.message||'Your premium access has expired. You can request a new approval after payment.',approvedAt,expiresAt,requestId,...common};
  return{kind:'active',message:entry.message||globalMessage||'Payment approved. Premium is active until the stored expiry time.',approvedAt,expiresAt,requestId,...common};
}

async function notifyAdminDecision(state:PremiumState,callbackId:string,record:LocalPremiumRecord,action:'A'|'R'|'S'){
  const token=(state.telegramBotToken||'').trim(),chatId=(state.telegramAdminChatId||'').trim();
  if(!token||!chatId)return;
  const label=action==='A'?'✅ APPROVAL RECEIVED':action==='R'?'❌ REJECTION RECEIVED':'⛔ STOP RECEIVED';
  const detail=action==='A'
    ?`${label}\nYou approved ${record.name||record.email||record.deviceId}.\nEmail: ${record.email}\nDevice ID: ${record.deviceId}\nPremium duration: ${record.durationMinutes} minutes\nExpires: ${record.expiresAt?new Date(record.expiresAt).toISOString():'-' }\nThe user app has been updated.`
    :`${label}\nUser: ${record.name||record.email||record.deviceId}\nEmail: ${record.email}\nDevice ID: ${record.deviceId}\nThe user app has been updated.`;
  try{await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callback_query_id:callbackId,text:action==='A'?'Premium approved. User app updated.':action==='R'?'Request rejected. User app updated.':'Premium stopped. User app updated.',show_alert:false})})}catch{}
  try{await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:detail})})}catch{}
}

async function syncTelegramDecision(state:PremiumState,local:LocalPremiumRecord):Promise<LocalPremiumRecord>{
  const token=(state.telegramBotToken||'').trim(),adminUser=(state.telegramAdminUserId||'').trim();
  if(!token||!adminUser||!local.requestId)return local;
  if(local.status==='rejected'||local.status==='stopped')return local;
  try{
    const res=await fetch(`https://api.telegram.org/bot${token}/getUpdates`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({limit:100,timeout:0,allowed_updates:['message','callback_query']})
    });
    const body=await res.json().catch(()=>({ok:false,result:[]}));
    if(!res.ok||!body?.ok||!Array.isArray(body.result))return local;
    const candidates=[...body.result].reverse();
    const found=candidates.find((u:any)=>{
      const cb=u?.callback_query,data=String(cb?.data||''),sender=String(cb?.from?.id||''),txt=String(cb?.message?.text||'');
      if(!cb||sender!==adminUser)return false;
      if(!data.endsWith(`:${local.requestId}`))return false;
      if(!txt.includes(`Request ID: ${local.requestId}`)||!txt.includes(`Device ID: ${local.deviceId}`))return false;
      const action=data.split(':',1)[0];
      return local.status==='pending'?(action==='A'||action==='R'):(local.status==='approved'&&action==='S');
    });
    if(!found)return local;
    const updateId=Number(found.update_id||0);
    if(updateId&&local.decisionUpdateId===updateId)return local;
    const cb=found.callback_query,action=String(cb.data).split(':',1)[0] as 'A'|'R'|'S';
    const headerTime=Date.parse(res.headers.get('date')||'');
    const now=Number.isFinite(headerTime)?headerTime:Date.now();
    let next:LocalPremiumRecord;
    if(action==='A'&&local.status==='pending'){
      const approvedAt=now,expiresAt=approvedAt+local.durationMinutes*60*1000;
      next={...local,status:'approved',approvedAt,expiresAt,decisionUpdateId:updateId,message:`Payment approved. Premium is active until ${new Date(expiresAt).toISOString()}.`};
    }else if(action==='R'&&local.status==='pending'){
      next={...local,status:'rejected',decisionUpdateId:updateId,message:'Your premium request was rejected by the Jyotish G admin.'};
    }else if(action==='S'&&local.status==='approved'){
      next={...local,status:'stopped',decisionUpdateId:updateId,message:'Premium access was stopped by the Jyotish G admin.'};
    }else return local;
    await saveLocal(next);
    await notifyAdminDecision(state,String(cb.id||''),next,action);
    return next;
  }catch{return local}
}

function localState(remote:PremiumState,local:LocalPremiumRecord):PremiumState{
  const common={...remote,requestId:local.requestId};
  if(local.status==='pending')return{...common,kind:'pending',requestSubmitted:true,message:'Premium request sent successfully. Waiting for admin approval. You will be notified automatically in the app.'};
  if(local.status==='rejected')return{...common,kind:'rejected',requestSubmitted:false,message:local.message||'Your premium request was rejected by the Jyotish G admin.'};
  if(local.status==='stopped')return{...common,kind:'stopped',requestSubmitted:false,message:local.message||'Premium access was stopped by the Jyotish G admin.'};
  const approvedAt=local.approvedAt||Date.now(),expiresAt=local.expiresAt||approvedAt+local.durationMinutes*60*1000;
  const now=trustedNow(remote);
  if(now>=expiresAt)return{...common,kind:'expired',requestSubmitted:false,approvedAt,expiresAt,message:'Your premium period has ended. You can renew from the Premium screen.'};
  return{...common,kind:'active',requestSubmitted:false,approvedAt,expiresAt,message:local.message||'Payment approved. Premium is active.'};
}

export async function fetchPremium(deviceId:string,email?:string):Promise<PremiumState>{
  const startedLocal=Date.now();
  const res=await fetch(`${PREMIUM_CONTROL_URL}?t=${startedLocal}`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
  if(!res.ok)throw new Error(`Premium server returned ${res.status}.`);
  const cfg=(await res.json()) as PremiumControl;
  const dateHeader=res.headers.get('date'), serverHeader=dateHeader?Date.parse(dateHeader):NaN;
  const serverNow=Number.isFinite(serverHeader)?serverHeader:Date.now();
  const remote=resolvePremium(cfg,deviceId,email,serverNow,Date.now());
  let local=await readLocal();
  if(!sameLocal(local,deviceId,email))return remote;
  local=await syncTelegramDecision(remote,local!);
  const entry=pickEntry(cfg,deviceId,email);
  if(entry?.requestId&&entry.requestId===local.requestId){
    if(remote.kind==='active'||remote.kind==='rejected'||remote.kind==='stopped'||remote.kind==='expired'){
      await clearLocal();
      return remote;
    }
  }
  const merged=localState(remote,local);
  if(merged.kind==='expired')await clearLocal();
  return merged;
}

export async function sendTelegramPremiumRequest(state:PremiumState,payload:PremiumRequestPayload){
  const token=(state.telegramBotToken||'').trim();
  const chatId=(state.telegramAdminChatId||'').trim();
  if(!token||!chatId)throw new Error('Premium approval service is not connected yet.');
  const name=payload.name.trim().slice(0,80),email=payload.email.trim().toLowerCase().slice(0,120);
  const deviceId=payload.deviceId.trim().slice(0,80),utr=payload.utr.trim().slice(0,100);
  if(!deviceId||!utr)throw new Error('Device ID and UTR are required.');
  const amount=state.priceInr||DEFAULT_PREMIUM_PRICE_INR;
  const duration=state.durationMinutes||DEFAULT_PREMIUM_DURATION_MINUTES;
  const requestId=`${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`.slice(0,20);
  const text=[
    '🔔 Jyotish G_PREMIUM_REQUEST',
    `Request ID: ${requestId}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Device ID: ${deviceId}`,
    `UTR: ${utr}`,
    `Amount: ₹${amount}`,
    `Displayed duration: ${duration} minutes`,
    '',
    'Verify the payment, then tap Approve or Reject.',
  ].join('\n');
  const res=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:chatId,text,reply_markup:{inline_keyboard:[[
      {text:'✅ APPROVE',callback_data:`A:${requestId}`},
      {text:'❌ REJECT',callback_data:`R:${requestId}`},
    ]]}}),
  });
  const body=await res.json().catch(()=>({ok:false}));
  if(!res.ok||!body?.ok)throw new Error(body?.description||`Telegram request failed (${res.status}).`);
  await saveLocal({requestId,name,email,deviceId,amount,durationMinutes:duration,status:'pending',createdAt:Date.now(),message:'Premium request sent successfully. Waiting for admin approval.'});
  return requestId;
}

export function trustedNow(state?:PremiumState){if(!state)return Date.now();return state.serverNow+Math.max(0,Date.now()-state.syncedAt)}
export function remainingMs(state?:PremiumState){if(!state?.expiresAt)return 0;return Math.max(0,state.expiresAt-trustedNow(state))}
export function isPremiumUsable(state?:PremiumState){if(!state||state.kind!=='active')return false;if(Date.now()-state.syncedAt>PREMIUM_STALE_MS)return false;return remainingMs(state)>0}
export function formatRemaining(ms:number){const total=Math.max(0,Math.floor(ms/1000)),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return[h,m,s].map(v=>String(v).padStart(2,'0')).join(':')}

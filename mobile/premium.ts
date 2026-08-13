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
};

export type PremiumRequestPayload = {
  name: string;
  email: string;
  deviceId: string;
  utr: string;
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
    telegramAdminReady:Boolean(telegramAdminChatId&&telegramBotToken),
  };
}
function pickEntry(cfg: PremiumControl, deviceId: string, email?: string): RemoteEntry | undefined {
  if (cfg.devices?.[deviceId]) return cfg.devices[deviceId];
  const e = normEmail(email);
  if (e && cfg.users?.[e]) return cfg.users[e];
  return undefined;
}
function base(cfg: PremiumControl, serverNow: number, syncedAt: number) { return {serverNow,syncedAt,...configOf(cfg)}; }

export function resolvePremium(cfg: PremiumControl, deviceId: string, email: string|undefined, serverNow: number, syncedAt: number): PremiumState {
  const common=base(cfg,serverNow,syncedAt), globalMessage=cfg.global?.message||'';
  if(cfg.global?.premiumEnabled===false)return{kind:'stopped',message:globalMessage||'Premium access is temporarily stopped by the AstroSathi admin.',...common};
  const entry=pickEntry(cfg,deviceId,email);
  if(!entry)return{kind:'pending',message:globalMessage||'Pay the configured amount and send your UTR for admin approval.',...common};
  if(entry.status==='stopped')return{kind:'stopped',message:entry.message||globalMessage||'Your premium access has been stopped by the admin.',...common};
  if(entry.status==='rejected')return{kind:'rejected',message:entry.message||'Your premium request was rejected. Please verify the payment details and try again.',...common};
  if(entry.status!=='approved')return{kind:'pending',message:entry.message||globalMessage||'Your payment is waiting for admin approval.',...common};
  const approvedAt=Date.parse(entry.approvedAt||'');
  if(!Number.isFinite(approvedAt))return{kind:'pending',message:'Approval exists, but the approval time is invalid.',...common};
  const storedExpiry=Date.parse(entry.expiresAt||'');
  const approvalDuration=safePositiveInt(entry.durationMinutes,common.durationMinutes);
  const expiresAt=Number.isFinite(storedExpiry)?storedExpiry:approvedAt+approvalDuration*60*1000;
  if(serverNow<approvedAt)return{kind:'pending',message:entry.message||'Premium is approved and will start at the configured approval time.',approvedAt,expiresAt,...common};
  if(serverNow>=expiresAt)return{kind:'expired',message:entry.message||'Your premium access has expired. You can request a new approval after payment.',approvedAt,expiresAt,...common};
  return{kind:'active',message:entry.message||globalMessage||'Payment approved. Premium is active until the stored expiry time.',approvedAt,expiresAt,...common};
}

export async function fetchPremium(deviceId:string,email?:string):Promise<PremiumState>{
  const startedLocal=Date.now();
  const res=await fetch(`${PREMIUM_CONTROL_URL}?t=${startedLocal}`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
  if(!res.ok)throw new Error(`Premium server returned ${res.status}.`);
  const cfg=(await res.json()) as PremiumControl;
  const dateHeader=res.headers.get('date'), serverHeader=dateHeader?Date.parse(dateHeader):NaN;
  const serverNow=Number.isFinite(serverHeader)?serverHeader:Date.now();
  return resolvePremium(cfg,deviceId,email,serverNow,Date.now());
}

export async function sendTelegramPremiumRequest(state:PremiumState,payload:PremiumRequestPayload){
  const token=(state.telegramBotToken||'').trim();
  const chatId=(state.telegramAdminChatId||'').trim();
  if(!token||!chatId)throw new Error('Telegram admin is not connected yet.');
  const name=payload.name.trim().slice(0,80),email=payload.email.trim().toLowerCase().slice(0,120);
  const deviceId=payload.deviceId.trim().slice(0,80),utr=payload.utr.trim().slice(0,100);
  if(!deviceId||!utr)throw new Error('Device ID and UTR are required.');
  const amount=state.priceInr||DEFAULT_PREMIUM_PRICE_INR;
  const duration=state.durationMinutes||DEFAULT_PREMIUM_DURATION_MINUTES;
  const requestId=`${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`.slice(0,20);
  const text=[
    '🔔 ASTROSATHI_PREMIUM_REQUEST',
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
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      chat_id:chatId,
      text,
      reply_markup:{inline_keyboard:[[
        {text:'✅ APPROVE',callback_data:`A:${requestId}`},
        {text:'❌ REJECT',callback_data:`R:${requestId}`},
      ]]},
    }),
  });
  const body=await res.json().catch(()=>({ok:false}));
  if(!res.ok||!body?.ok)throw new Error(body?.description||`Telegram request failed (${res.status}).`);
  return requestId;
}

export function trustedNow(state?:PremiumState){if(!state)return Date.now();return state.serverNow+Math.max(0,Date.now()-state.syncedAt)}
export function remainingMs(state?:PremiumState){if(!state?.expiresAt)return 0;return Math.max(0,state.expiresAt-trustedNow(state))}
export function isPremiumUsable(state?:PremiumState){if(!state||state.kind!=='active')return false;if(Date.now()-state.syncedAt>PREMIUM_STALE_MS)return false;return remainingMs(state)>0}
export function formatRemaining(ms:number){const total=Math.max(0,Math.floor(ms/1000)),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return[h,m,s].map(v=>String(v).padStart(2,'0')).join(':')}

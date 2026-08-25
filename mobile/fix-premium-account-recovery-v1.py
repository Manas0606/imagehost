#!/usr/bin/env python3
from pathlib import Path
import re

path=Path.cwd()/'generated/AstroSathi/premium.ts'
if not path.exists(): raise SystemExit('Generated premium.ts not found')
text=path.read_text()

# Premium belongs to the authenticated account first. Device ID is only a secondary
# anti-abuse/recovery signal and must never let another account inherit paid access.
text=text.replace(
"export type RemoteEntry = {\n  status?: 'approved' | 'stopped' | 'pending' | 'rejected';",
"export type RemoteEntry = {\n  email?: string;\n  status?: 'approved' | 'stopped' | 'pending' | 'rejected';",
1)

# While a request is pending, poll Telegram often enough that Approve/Reject feels
# immediate. This is still lightweight and does not change the durable account sync.
text=text.replace('export const PREMIUM_POLL_MS = 15 * 1000;','export const PREMIUM_POLL_MS = 5 * 1000;',1)

pick_pattern=r"function pickEntry\(cfg: PremiumControl, deviceId: string, email\?: string\): RemoteEntry \| undefined \{.*?\n\}"
pick_repl="""function pickEntry(cfg: PremiumControl, deviceId: string, email?: string): RemoteEntry | undefined {
  const e = normEmail(email);
  if (e) {
    const accountEntry = cfg.users?.[e];
    if (accountEntry) return accountEntry;
    const deviceEntry = cfg.devices?.[deviceId];
    if (deviceEntry && normEmail(deviceEntry.email) === e) return deviceEntry;
    return undefined;
  }
  return cfg.devices?.[deviceId];
}"""
text,count=re.subn(pick_pattern,pick_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium account-entry selector marker not found')

# Immediate UX + durable recovery:
# - Telegram approval is authoritative enough to unlock the CURRENT installation now.
# - The encrypted local approval remains until the scheduled admin sync writes the same
#   request to users[email].
# - Once that central account entry appears, fetchPremium() clears the local cache and
#   the account entitlement becomes the durable source of truth for reinstall/login.
local_pattern=r"function localState\(remote:PremiumState,local:LocalPremiumRecord\):PremiumState\{.*?\n\}"
local_repl="""function localState(remote:PremiumState,local:LocalPremiumRecord):PremiumState{
  const common={...remote,requestId:local.requestId};
  if(local.status==='pending')return{...common,kind:'pending',requestSubmitted:true,message:'Premium request sent successfully. Waiting for admin approval. You will be notified automatically in the app.'};
  if(local.status==='rejected')return{...common,kind:'rejected',requestSubmitted:false,message:local.message||'Your premium request was rejected by the AstroSathi admin.'};
  if(local.status==='stopped')return{...common,kind:'stopped',requestSubmitted:false,message:local.message||'Premium access was stopped by the AstroSathi admin.'};
  const approvedAt=local.approvedAt||Date.now(),expiresAt=local.expiresAt||approvedAt+local.durationMinutes*60*1000;
  const now=trustedNow(remote);
  if(now>=expiresAt)return{...common,kind:'expired',requestSubmitted:false,approvedAt,expiresAt,message:'Your premium period has ended. You can renew from the Premium screen.'};
  return{...common,kind:'active',requestSubmitted:false,approvedAt,expiresAt,message:local.message||'Payment approved. Premium is active now. Your account entitlement is syncing in the background for reinstall recovery.'};
}"""
text,count=re.subn(local_pattern,local_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium local-state marker not found')

# The app can acknowledge immediate activation while also being precise that durable
# account recovery is completed by the background central sync.
text=text.replace('The user app has been updated.','Premium activated on the user device; account entitlement sync is continuing in the background.')
text=text.replace('Premium approved. User app updated.','Premium activated. Account recovery sync is continuing in the background.')

for needle in (
  'export const PREMIUM_POLL_MS = 5 * 1000;',
  'const accountEntry = cfg.users?.[e];',
  'normEmail(deviceEntry.email) === e',
  "kind:'active'",
  'account entitlement is syncing in the background',
):
  if needle not in text: raise SystemExit(f'Premium recovery patch missing: {needle}')
path.write_text(text)
print('AstroSathi Premium approval now unlocks immediately; account/email recovery sync continues in the background')

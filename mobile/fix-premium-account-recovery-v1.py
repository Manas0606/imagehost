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

# A locally observed Telegram approval is not treated as active until the central
# account entitlement has been persisted. Therefore once the app ever shows Active,
# reinstall/login can restore the exact original expiry from users[email].
local_pattern=r"function localState\(remote:PremiumState,local:LocalPremiumRecord\):PremiumState\{.*?\n\}"
local_repl="""function localState(remote:PremiumState,local:LocalPremiumRecord):PremiumState{
  const common={...remote,requestId:local.requestId};
  if(local.status==='pending')return{...common,kind:'pending',requestSubmitted:true,message:'Premium request sent successfully. Waiting for admin approval. You will be notified automatically in the app.'};
  if(local.status==='rejected')return{...common,kind:'rejected',requestSubmitted:false,message:local.message||'Your premium request was rejected by the AstroSathi admin.'};
  if(local.status==='stopped')return{...common,kind:'stopped',requestSubmitted:false,message:local.message||'Premium access was stopped by the AstroSathi admin.'};
  const approvedAt=local.approvedAt||Date.now(),expiresAt=local.expiresAt||approvedAt+local.durationMinutes*60*1000;
  const now=trustedNow(remote);
  if(now>=expiresAt)return{...common,kind:'expired',requestSubmitted:false,approvedAt,expiresAt,message:'Your premium period has ended. You can renew from the Premium screen.'};
  return{...common,kind:'pending',requestSubmitted:true,approvedAt,expiresAt,message:'Approval received. Finalizing Premium on your AstroSathi account. Access will unlock automatically after the account entitlement is saved.'};
}"""
text,count=re.subn(local_pattern,local_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium local-state marker not found')

# Do not tell the admin that access is already durable when only the local callback
# was observed. The central sync is the durable source of truth.
text=text.replace('The user app has been updated.','The approval was received; account entitlement sync is in progress.')
text=text.replace('Premium approved. User app updated.','Premium approval received. Account sync in progress.')

for needle in (
  'const accountEntry = cfg.users?.[e];',
  'normEmail(deviceEntry.email) === e',
  'Finalizing Premium on your AstroSathi account',
):
  if needle not in text: raise SystemExit(f'Premium recovery patch missing: {needle}')
path.write_text(text)
print('AstroSathi Premium now restores by authenticated account/email; local approval waits for durable central entitlement before unlocking')

#!/usr/bin/env python3
from pathlib import Path
import re

path=Path.cwd()/'generated/JyotishG/premium.ts'
if not path.exists(): raise SystemExit('Generated premium.ts not found')
text=path.read_text()

# Premium belongs to the authenticated account first. Device ID is only a secondary
# anti-abuse/recovery signal and must never let another account inherit paid access.
text=text.replace(
"export type RemoteEntry = {\n  status?: 'approved' | 'stopped' | 'pending' | 'rejected';",
"export type RemoteEntry = {\n  email?: string;\n  status?: 'approved' | 'stopped' | 'pending' | 'rejected';",
1)

# Pending payment decisions are intentionally checked every 3 seconds. The durable
# GitHub account-sync waits 45 seconds before consuming Telegram updates, so the
# phone has a large deterministic first-read window for immediate activation.
text=text.replace('export const PREMIUM_POLL_MS = 15 * 1000;','export const PREMIUM_POLL_MS = 3 * 1000;',1)

pick_pattern=r"function pickEntry\(cfg: PremiumControl, deviceId: string, email\?: string\): RemoteEntry \| undefined \{.*?\n\}"
pick_repl="""function pickEntry(cfg: PremiumControl, deviceId: string, email?: string): RemoteEntry | undefined {
  const e = normEmail(email);
  if (e) {
    const accountEntry = cfg.users?.[e];
    if (accountEntry) return accountEntry;
    const deviceEntry = cfg.devices?.[deviceId];
    if (deviceEntry && (!deviceEntry.email || normEmail(deviceEntry.email) === e)) return deviceEntry;
    return undefined;
  }
  return cfg.devices?.[deviceId];
}"""
text,count=re.subn(pick_pattern,pick_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium account-entry selector marker not found')

# Immediate UX + durable recovery:
# - Telegram callback unlocks the CURRENT installation immediately.
# - The encrypted local approval remains until the delayed scheduled sync persists the
#   same request to users[email].
# - Once that account entry appears, fetchPremium() switches to the durable server
#   record with the original approvedAt/expiresAt so reinstall never restarts time.
local_pattern=r"function localState\(remote:PremiumState,local:LocalPremiumRecord\):PremiumState\{.*?\n\}"
local_repl="""function localState(remote:PremiumState,local:LocalPremiumRecord):PremiumState{
  const common={...remote,requestId:local.requestId};
  if(local.status==='pending')return{...common,kind:'pending',requestSubmitted:true,message:'Premium request sent successfully. Waiting for admin approval. You will be notified automatically in the app.'};
  if(local.status==='rejected')return{...common,kind:'rejected',requestSubmitted:false,message:local.message||'Your premium request was rejected by the Jyotish G admin.'};
  if(local.status==='stopped')return{...common,kind:'stopped',requestSubmitted:false,message:local.message||'Premium access was stopped by the Jyotish G admin.'};
  const approvedAt=local.approvedAt||Date.now(),expiresAt=local.expiresAt||approvedAt+local.durationMinutes*60*1000;
  const now=trustedNow(remote);
  if(now>=expiresAt)return{...common,kind:'expired',requestSubmitted:false,approvedAt,expiresAt,message:'Your premium period has ended. You can renew from the Premium screen.'};
  return{...common,kind:'active',requestSubmitted:false,approvedAt,expiresAt,message:local.message||'Payment approved. Premium is active. Account recovery backup is syncing in the background.'};
}"""
text,count=re.subn(local_pattern,local_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium local-state marker not found')

for needle in (
  'export const PREMIUM_POLL_MS = 3 * 1000;',
  'const accountEntry = cfg.users?.[e];',
  "kind:'active'",
  'Account recovery backup is syncing in the background',
):
  if needle not in text: raise SystemExit(f'Premium recovery patch missing: {needle}')
path.write_text(text)
print('Jyotish G Premium: immediate Telegram decision every 3s + durable email recovery handoff')

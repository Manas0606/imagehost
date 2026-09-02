#!/usr/bin/env python3
from pathlib import Path

root=Path.cwd(); app=root/'generated'/'JyotishG'
premium=app/'premium.ts'; app_ts=app/'App.tsx'
if not premium.exists() or not app_ts.exists():
    raise SystemExit('Generated Jyotish G files not found for 30-minute Premium patch')

text=premium.read_text()
text=text.replace('export const DEFAULT_PREMIUM_DURATION_MINUTES = 360;','export const DEFAULT_PREMIUM_DURATION_MINUTES = 30;',1)

# Approval must use the CURRENT remotely configured duration, not a stale duration
# captured when an older pending request was originally created.
old="""const approvedAt=now,expiresAt=approvedAt+local.durationMinutes*60*1000;
      next={...local,status:'approved',approvedAt,expiresAt,decisionUpdateId:updateId,message:`Payment approved. Premium is active until ${new Date(expiresAt).toISOString()}.`};"""
new="""const approvedAt=now,durationMinutes=safePositiveInt(state.durationMinutes,DEFAULT_PREMIUM_DURATION_MINUTES),expiresAt=approvedAt+durationMinutes*60*1000;
      next={...local,durationMinutes,status:'approved',approvedAt,expiresAt,decisionUpdateId:updateId,message:`Payment approved. Premium is active until ${new Date(expiresAt).toISOString()}.`};"""
if old not in text:
    raise SystemExit('Telegram approval duration marker not found')
text=text.replace(old,new,1)
premium.write_text(text)

ui=app_ts.read_text()
ui=ui.replace('premium.durationMinutes||360','premium.durationMinutes||30')
app_ts.write_text(ui)

checks=(
    'export const DEFAULT_PREMIUM_DURATION_MINUTES = 30;',
    'durationMinutes=safePositiveInt(state.durationMinutes,DEFAULT_PREMIUM_DURATION_MINUTES)',
)
for needle in checks:
    if needle not in text:
        raise SystemExit(f'30-minute Premium patch missing: {needle}')
if 'premium.durationMinutes||360' in ui:
    raise SystemExit('Old 360-minute UI fallback still present')
if 'premium.durationMinutes||30' not in ui:
    raise SystemExit('30-minute UI fallback missing')
print('Jyotish G Premium duration set consistently to 30 minutes for display and approval expiry')

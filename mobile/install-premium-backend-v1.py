#!/usr/bin/env python3
from pathlib import Path
import shutil

root=Path.cwd(); app=root/'generated/JyotishG'; src=root/'mobile'
if not app.exists(): raise SystemExit('Generated Jyotish G project not found')
backend=src/'premium-backend.ts'
if not backend.exists(): raise SystemExit('premium-backend.ts missing')
shutil.copy2(backend,app/'premium.ts')
text=(app/'premium.ts').read_text()
for required in ('PREMIUM_SERVICE_URL','PREMIUM_POLL_MS=3*1000','/api/premium-status','/api/premium-request','telegramAdminReady:true'):
    if required not in text: raise SystemExit(f'Premium backend client missing: {required}')
for forbidden in ('api.telegram.org/bot','getUpdates','telegramBotToken','PREMIUM_CONTROL_URL'):
    if forbidden in text: raise SystemExit(f'Legacy premium transport still present: {forbidden}')
print('Jyotish G premium client now uses the single webhook backend; direct Telegram polling removed')

#!/usr/bin/env python3
from pathlib import Path

native=Path.cwd()/'generated/JyotishG/android/app/src/main/java/com/jyotishg/AstroNativeModule.kt'
if not native.exists(): raise SystemExit('Generated AstroNativeModule.kt not found')
text=native.read_text()
text=text.replace('import java.util.concurrent.Executors\n','',1)
old='        Executors.newSingleThreadExecutor().execute {\n'
if old not in text: raise SystemExit('Place-search executor marker not found')
text=text.replace(old,'        Thread {\n',1)
end='            }\n        }\n    }\n\n    @ReactMethod\n    fun requestNotificationPermission'
if end not in text: raise SystemExit('Place-search thread end marker not found')
text=text.replace(end,'            }\n        }.start()\n    }\n\n    @ReactMethod\n    fun requestNotificationPermission',1)
if 'Executors.newSingleThreadExecutor' in text or 'Thread {' not in text or '}.start()' not in text:
    raise SystemExit('Place-search thread fix verification failed')
native.write_text(text)
print('Jyotish G place search uses short-lived background thread')

#!/usr/bin/env python3
from pathlib import Path

scripts = Path(__file__).resolve().parent
for name in ('install-overlay-base.py', 'install-premium-v2.py', 'fix-guidance-v2.py', 'install-guidance-v2.py', 'install-premium-state-v3.py', 'install-birth-input-v2.py', 'install-place-search-v3.py', 'fix-place-thread-v1.py', 'fix-verified-birth-load-v1.py', 'prep-mini-ai-v4.py', 'install-mini-ai-v4.py', 'fix-mini-ai-ex-token-v2.py', 'fix-mini-ai-intent-priority-v1.py', 'fix-mini-ai-engine-v1.py', 'fix-premium-notice-key-v1.py', 'install-kundli-explain-v1.py', 'fix-local-ai-build-v1.py', 'fix-local-ai-reconciliation-v1.py'):
    path = scripts / name
    if not path.exists():
        raise SystemExit(f'Missing AstroSathi overlay component: {name}')
    scope = {'__name__': '__main__', '__file__': str(path)}
    exec(compile(path.read_text(), str(path), 'exec'), scope, scope)

print('AstroSathi combined overlay completed')

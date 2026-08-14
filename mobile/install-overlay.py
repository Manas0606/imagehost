#!/usr/bin/env python3
from pathlib import Path

scripts = Path(__file__).resolve().parent
for name in ('install-overlay-base.py', 'install-premium-v2.py', 'install-guidance-v2.py'):
    path = scripts / name
    if not path.exists():
        raise SystemExit(f'Missing AstroSathi overlay component: {name}')
    scope = {'__name__': '__main__', '__file__': str(path)}
    exec(compile(path.read_text(), str(path), 'exec'), scope, scope)

print('AstroSathi combined overlay completed')

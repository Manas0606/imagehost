#!/usr/bin/env python3
from pathlib import Path
import re

root=Path.cwd()/'generated/JyotishG'
path=root/'App.tsx'
manifest=root/'android/app/src/main/AndroidManifest.xml'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
if not manifest.exists(): raise SystemExit('Generated AndroidManifest.xml not found')

text=path.read_text()
start=text.find('function PremiumScreen(')
end=text.find('\nfunction Benefits',start)
if start<0 or end<0: raise SystemExit('PremiumScreen marker not found')
fn=text[start:end]

# Preserve the original Premium screen layout. Do not auto-jump the form when UTR
# receives focus and do not force a numeric-only keyboard. Instead, keep the whole
# page manually scrollable while Android resizes the window for the IME.
old_return='return<ScrollView contentContainerStyle={s.page}>'
new_return='return<ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[s.page,{paddingBottom:260}]}>'
if old_return not in fn: raise SystemExit('Premium ScrollView marker not found')
fn=fn.replace(old_return,new_return,1)

# Keep the original UTR field so users may enter numeric or alphanumeric references.
field='<Field label={t.utr} value={utr} onChangeText={setUtr}/>'
if field not in fn: raise SystemExit('Original UTR field marker not found')

text=text[:start]+fn+text[end:]
path.write_text(text)

# Make Android shrink the app viewport when the keyboard opens. Combined with the
# ScrollView above, the user can simply drag the Premium page up/down without any
# automatic repositioning or layout jump.
m=manifest.read_text()
if 'android:windowSoftInputMode=' in m:
    m=re.sub(r'android:windowSoftInputMode="[^"]*"','android:windowSoftInputMode="adjustResize"',m,count=1)
else:
    marker='android:name=".MainActivity"'
    if marker not in m: raise SystemExit('MainActivity manifest marker not found')
    m=m.replace(marker,marker+'\n        android:windowSoftInputMode="adjustResize"',1)
manifest.write_text(m)

for forbidden in ('scrollToEnd','keyboardType="number-pad"','ref={scroll}'):
    if forbidden in fn: raise SystemExit(f'Premium UTR screen still contains unwanted behavior: {forbidden}')
for required in ('keyboardShouldPersistTaps="handled"','paddingBottom:260','android:windowSoftInputMode="adjustResize"'):
    target=fn if required!='android:windowSoftInputMode="adjustResize"' else m
    if required not in target: raise SystemExit(f'Premium manual-scroll patch missing: {required}')

print('Jyotish G Premium layout restored: normal UTR keyboard + manual keyboard-safe scrolling, no auto-jump')

#!/usr/bin/env python3
from pathlib import Path

path=Path.cwd()/'generated/AstroSathi/App.tsx'
if not path.exists(): raise SystemExit('Generated App.tsx not found')
text=path.read_text()
start=text.find('function PremiumScreen(')
end=text.find('\nfunction Benefits',start)
if start<0 or end<0: raise SystemExit('PremiumScreen marker not found')
fn=text[start:end]

if 'const scroll=useRef<any>(null),' not in fn:
    fn=fn.replace(
      "{const price=premium.priceInr||20,duration=premium.durationMinutes||360,upi=buildUpiUri(price),submitted=",
      "{const scroll=useRef<any>(null),price=premium.priceInr||20,duration=premium.durationMinutes||360,upi=buildUpiUri(price),submitted=",
      1)

old_return='return<ScrollView contentContainerStyle={s.page}>'
new_return="return<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}><ScrollView ref={scroll} keyboardShouldPersistTaps=\"handled\" keyboardDismissMode=\"on-drag\" contentContainerStyle={[s.page,{paddingBottom:300}]} >"
if old_return not in fn: raise SystemExit('Premium ScrollView marker not found')
fn=fn.replace(old_return,new_return,1)

old_field='<Field label={t.utr} value={utr} onChangeText={setUtr}/>'
new_field='<Field label={t.utr} value={utr} onChangeText={setUtr} keyboardType="number-pad" returnKeyType="done" onFocus={()=>setTimeout(()=>scroll.current?.scrollToEnd({animated:true}),180)}/>'
if old_field not in fn: raise SystemExit('UTR field marker not found')
fn=fn.replace(old_field,new_field,1)

if not fn.endswith('</ScrollView>}'): raise SystemExit('PremiumScreen closing marker changed unexpectedly')
fn=fn[:-len('</ScrollView>}')]+'</ScrollView></KeyboardAvoidingView>}'

text=text[:start]+fn+text[end:]
for needle in ('ref={scroll}','paddingBottom:300','scroll.current?.scrollToEnd','keyboardType="number-pad"'):
    if needle not in fn: raise SystemExit(f'Premium keyboard patch missing: {needle}')
path.write_text(text)
print('AstroSathi Premium UTR input is keyboard-safe and auto-scrolls into view on focus')

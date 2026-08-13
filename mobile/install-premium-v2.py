#!/usr/bin/env python3
from pathlib import Path
import re

root = Path.cwd()
app = root / 'generated' / 'AstroSathi'
if not app.exists():
    raise SystemExit('Generated React Native project not found')

app_ts = app / 'App.tsx'
text = app_ts.read_text()

text = text.replace(
    "import{PREMIUM_POLL_MS,type PremiumState,fetchPremium,isPremiumUsable,remainingMs,formatRemaining}from'./premium';",
    "import{PREMIUM_POLL_MS,type PremiumState,fetchPremium,sendTelegramPremiumRequest,isPremiumUsable,remainingMs,formatRemaining}from'./premium';",
    1,
)

old_constants = "const PRICE=49,TELEGRAM='OdiaEduJobs';\nconst UPI_URI='upi://pay?pa=7750924539-3@axl&pn=MANAS%20SAMAL&mc=0000&mode=02&purpose=00';"
new_constants = """const TELEGRAM='AstroSathiAdminBot';
const buildUpiUri=(price:number)=>`upi://pay?pa=7750924539-3@axl&pn=MANAS%20SAMAL&am=${Math.max(1,Math.round(price)).toFixed(2)}&cu=INR&mc=0000&mode=02&purpose=00`;"""
if old_constants not in text:
    raise SystemExit('Premium constants marker not found')
text = text.replace(old_constants, new_constants, 1)

text = text.replace("pay:'Pay ₹49 with UPI'", "pay:'Pay with UPI'")
text = text.replace("pay:'UPI से ₹49 भुगतान'", "pay:'UPI से भुगतान'")
text = text.replace("pay:'UPI ଦ୍ୱାରା ₹49 ପେମେଣ୍ଟ'", "pay:'UPI ଦ୍ୱାରା ପେମେଣ୍ଟ'")

pattern = r" async function telegramRequest\(\)\{.*?\}\n async function unlock"
replacement = """ async function telegramRequest(){if(!utr.trim())return Alert.alert('Premium','Enter the payment UTR / Transaction ID first.');setBusy(true);try{await sendTelegramPremiumRequest(premium,{name:boot?.name||'',email:boot?.email||'',deviceId:boot?.deviceId||'',utr:utr.trim()});setUtr('');Alert.alert('Premium Request','Request sent to AstroSathi admin on Telegram. Premium will activate automatically after approval.')}catch(e:any){Alert.alert('Premium Request',e?.message||String(e))}finally{setBusy(false)}}
 async function unlock"""
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit('Telegram request function marker not found')

text = text.replace(
    "pay={()=>Linking.openURL(UPI_URI)}",
    "pay={()=>Linking.openURL(buildUpiUri(premium.priceInr||20))}",
    1,
)

pattern = r"function PremiumScreen\(.*?\nfunction Benefits"
replacement = """function durationLabel(minutes:number){const m=Math.max(1,Math.round(minutes));if(m%60===0){const h=m/60;return`${h} hour${h===1?'':'s'}`}return`${m} minutes`}
function PremiumScreen({t,active,premium,utr,setUtr,boot,pay,send,chat,back}:any){const price=premium.priceInr||20,duration=premium.durationMinutes||360,upi=buildUpiUri(price);return<ScrollView contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.premium}</Text>{active?<><Card><Text style={s.good}>✓ {t.active}</Text><Text style={s.count}>{formatRemaining(remainingMs(premium))}</Text><Text style={s.small}>{t.remaining}</Text><Text style={s.gold}>Approved: {clock(premium.approvedAt)}</Text><Text style={s.gold}>Expires: {clock(premium.expiresAt)}</Text><Text style={s.muted}>{premium.message}</Text></Card><Benefits/><Btn onPress={chat}>☉ {t.chat}</Btn></>:<><View style={premium.kind==='stopped'?s.stopCard:s.card}><Text style={premium.kind==='stopped'?s.stopTitle:s.gold}>{premium.kind==='stopped'?'Premium Stopped':premium.kind==='rejected'?'Request Rejected':t.pending}</Text><Text style={s.muted}>{premium.message}</Text></View><Card><Text style={s.price}>₹{price}</Text><Text style={s.small}>Premium access after approval: {durationLabel(duration)}</Text><View style={s.qr}><QRCode value={upi} size={220} backgroundColor=\"#fff\" color=\"#111\"/></View><Btn onPress={pay}>{t.pay} ₹{price}</Btn></Card><Field label={t.utr} value={utr} onChangeText={setUtr}/><Card><Text style={s.small}>Device ID</Text><Text selectable style={s.white}>{boot.deviceId}</Text></Card><Btn onPress={send}>✈ {t.send}</Btn>{!premium.telegramAdminReady&&<Text style={s.small}>Telegram admin is not connected yet. Open @AstroSathiAdminBot and press Start, then retry after the GitHub admin job picks it up.</Text>}</>}<Btn secondary onPress={()=>Linking.openURL(`https://t.me/${TELEGRAM}`)}>Telegram @{TELEGRAM}</Btn></ScrollView>}
function Benefits"""
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit('Premium screen marker not found')

for needle in (
    "sendTelegramPremiumRequest",
    "const TELEGRAM='AstroSathiAdminBot'",
    'function durationLabel(',
    'premium.priceInr||20',
):
    if needle not in text:
        raise SystemExit(f'Premium v2 patch missing: {needle}')

app_ts.write_text(text)
print('AstroSathi premium v2 overlay installed: configurable price/duration + Telegram admin notifications')

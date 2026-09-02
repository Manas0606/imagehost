#!/usr/bin/env python3
from pathlib import Path
import re

root=Path.cwd(); app=root/'generated'/'JyotishG'
if not app.exists(): raise SystemExit('Generated React Native project not found')

app_ts=app/'App.tsx'; text=app_ts.read_text()

pattern=r"function PremiumScreen\(.*?\nfunction Benefits"
replacement="""function PremiumScreen({t,active,premium,utr,setUtr,boot,pay,send,chat,back}:any){const price=premium.priceInr||20,duration=premium.durationMinutes||360,upi=buildUpiUri(price),submitted=premium.kind==='pending'&&premium.requestSubmitted;const bad=premium.kind==='rejected'||premium.kind==='stopped';const statusTitle=premium.kind==='rejected'?'Request Rejected':premium.kind==='stopped'?'Premium Stopped':premium.kind==='expired'?'Premium Expired':'Premium Access';return<ScrollView contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.premium}</Text>{active?<><Card><Text style={s.good}>✓ {t.active}</Text><Text style={s.count}>{formatRemaining(remainingMs(premium))}</Text><Text style={s.small}>{t.remaining}</Text><Text style={s.gold}>Approved: {clock(premium.approvedAt)}</Text><Text style={s.gold}>Expires: {clock(premium.expiresAt)}</Text><Text style={s.muted}>{premium.message}</Text></Card><Benefits/><Btn onPress={chat}>☉ {t.chat}</Btn></>:submitted?<><Card><Text style={s.good}>✓ PREMIUM REQUEST SENT</Text><Text style={s.cardTitle}>Waiting for admin approval</Text><Text style={s.muted}>{premium.message}</Text><Text style={s.gold}>Amount: ₹{price}</Text><Text style={s.gold}>Access after approval: {durationLabel(duration)}</Text><Text style={s.small}>You do not need to send the request again. This screen will update automatically after Approve or Reject.</Text></Card><Card><Text style={s.small}>Device ID</Text><Text selectable style={s.white}>{boot.deviceId}</Text></Card></>:<><View style={bad?s.stopCard:s.card}><Text style={bad?s.stopTitle:s.gold}>{statusTitle}</Text><Text style={s.muted}>{premium.message}</Text></View><Card><Text style={s.price}>₹{price}</Text><Text style={s.small}>Premium access after approval: {durationLabel(duration)}</Text><View style={s.qr}><QRCode value={upi} size={220} backgroundColor=\"#fff\" color=\"#111\"/></View><Btn onPress={pay}>{t.pay} ₹{price}</Btn></Card><Field label={t.utr} value={utr} onChangeText={setUtr}/><Card><Text style={s.small}>Device ID</Text><Text selectable style={s.white}>{boot.deviceId}</Text></Card><Btn onPress={send}>✈ {t.send}</Btn>{!premium.telegramAdminReady&&<Text style={s.small}>Premium approval service is temporarily unavailable. Please retry shortly.</Text>}</>}</ScrollView>}
function Benefits"""
text,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Premium screen v3 marker not found')

# Remove visible direct Telegram bot/support controls from the app UI.
text=text.replace("<Btn secondary onPress={()=>Linking.openURL(`https://t.me/${TELEGRAM}`)}>{t.support} @{TELEGRAM}</Btn>","")

# Add explicit rejection notification + in-app message alongside approval/stop/expiry transitions.
needle="if(prevPremium.current==='active'&&st.kind==='expired'){AstroNative.showNotification('Jyotish G Premium Expired','Your premium period has ended. You can renew from the Premium screen.').catch(()=>{})}"
replacement_notice=needle+"if(prevPremium.current!=='rejected'&&st.kind==='rejected'){AstroNative.showNotification('Jyotish G Premium Request Rejected',st.message||'Your premium request was rejected.').catch(()=>{});Alert.alert('Premium Request Rejected',st.message||'Your premium request was rejected. Please verify the payment and try again.')}"
if needle not in text: raise SystemExit('Premium expiry notification marker not found')
text=text.replace(needle,replacement_notice,1)

app_ts.write_text(text)

# Add encrypted local premium request/decision storage to the existing Android Keystore-backed native vault.
java=app/'android/app/src/main/java/com/jyotishg/AstroNativeModule.kt'
kt=java.read_text()
marker='    @ReactMethod\n    fun setAppLock(mode: String, secret: String, p: Promise) {'
addition='''    @ReactMethod
    fun savePremiumLocalState(json: String, p: Promise) {
        try {
            JSONObject(json)
            write("premium_local", json)
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("PREMIUM_LOCAL_SAVE", e)
        }
    }

    @ReactMethod
    fun getPremiumLocalState(p: Promise) {
        try {
            p.resolve(read("premium_local"))
        } catch (e: Exception) {
            p.reject("PREMIUM_LOCAL_READ", e)
        }
    }

    @ReactMethod
    fun clearPremiumLocalState(p: Promise) {
        try {
            prefs.edit().remove("enc_premium_local").apply()
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("PREMIUM_LOCAL_CLEAR", e)
        }
    }

'''
if marker not in kt: raise SystemExit('Native premium storage insertion marker not found')
if 'fun savePremiumLocalState(' not in kt:
    kt=kt.replace(marker,addition+marker,1)
java.write_text(kt)

for required in ('PREMIUM REQUEST SENT','premium.requestSubmitted','Premium Request Rejected','fun savePremiumLocalState(','fun getPremiumLocalState(','fun clearPremiumLocalState('):
    target=text if required in text else kt
    if required not in target: raise SystemExit(f'Premium state v3 patch missing: {required}')
if 'Telegram @{TELEGRAM}' in text: raise SystemExit('Visible Telegram bot button still present')
print('Jyotish G premium state v3 installed: hidden bot UI, encrypted pending request state, immediate approve/reject/stop UI and notifications')

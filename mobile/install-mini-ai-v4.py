#!/usr/bin/env python3
from pathlib import Path
import re,shutil

root=Path.cwd(); app=root/'generated'/'JyotishG'; src=root/'mobile'
path=app/'App.tsx'; native=app/'android/app/src/main/java/com/jyotishg/AstroNativeModule.kt'
if not path.exists() or not native.exists(): raise SystemExit('Generated Jyotish G files missing for mini AI v4')
shutil.copy2(src/'mini-ai.ts',app/'mini-ai.ts')
text=path.read_text()

old="import{analyseQuestion,type Guidance}from'./guidance';"
new="import{askMiniAI,type MiniAnswer,type MiniContext}from'./mini-ai';"
if old not in text: raise SystemExit('Guidance import marker not found')
text=text.replace(old,new,1)

old_state="const[locked,setLocked]=useState(false),[lockSecret,setLockSecret]=useState(''),[pattern,setPattern]=useState<number[]>([]),[question,setQuestion]=useState(''),[answer,setAnswer]=useState<Guidance>(),[turns,setTurns]=useState<Array<{q:string;g:Guidance}>>([]);"
new_state="const[locked,setLocked]=useState(false),[lockSecret,setLockSecret]=useState(''),[pattern,setPattern]=useState<number[]>([]),[question,setQuestion]=useState(''),[answer,setAnswer]=useState<MiniAnswer>(),[turns,setTurns]=useState<Array<{q:string;a:MiniAnswer}>>([]);"
if old_state not in text: raise SystemExit('Mini AI state marker not found')
text=text.replace(old_state,new_state,1)

old_ask="function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium','Premium must be active to use Ask Jyotish G.');if(!text)return;const previous=turns.length?turns[turns.length-1].g.topic:undefined;const g=analyseQuestion(chart,text,l,previous);setAnswer(g);setTurns(v=>[...v,{q:text,g}].slice(-30));setQuestion('')}"
new_ask="function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium',l==='hi'?'Ask Jyotish G उपयोग करने के लिए Premium सक्रिय होना चाहिए।':l==='or'?'Ask Jyotish G ବ୍ୟବହାର ପାଇଁ Premium ସକ୍ରିୟ ହେବା ଦରକାର।':'Premium must be active to use Ask Jyotish G.');if(!text)return;const previous:MiniContext|undefined=turns.length?turns[turns.length-1].a.context:undefined;const a=askMiniAI(chart,text,l,previous);setAnswer(a);setTurns(v=>[...v,{q:text,a}].slice(-30));setQuestion('')}"
if old_ask not in text: raise SystemExit('Mini AI ask marker not found')
text=text.replace(old_ask,new_ask,1)

old_route="{screen==='chat'&&<ChatScreen t={t} l={l} active={active} chart={chart} question={question} setQuestion={setQuestion} turns={turns} ask={ask} clear={()=>{setTurns([]);setAnswer(undefined);setQuestion('')}} premiumState={premium} premium={()=>setScreen('premium')} birth={()=>setScreen('birth')} back={()=>setScreen('home')}/>}"
new_route="{screen==='chat'&&<ChatScreen t={t} l={l} active={active} chart={chart} question={question} setQuestion={setQuestion} turns={turns} ask={ask} clear={()=>{setTurns([]);setAnswer(undefined);setQuestion('')}} premiumState={premium} premium={()=>setScreen('premium')} birth={()=>setScreen('birth')} back={()=>setScreen('home')}/>}"
if old_route not in text: raise SystemExit('Chat route marker not found')
text=text.replace(old_route,new_route,1)

# Re-render prior local answers in the newly selected language.
insert_after="const prevPremium=useRef<string>('checking'),t=T[l];"
lang_effect="""const prevPremium=useRef<string>('checking'),t=T[l];
 useEffect(()=>{if(!chart)return;setTurns(old=>{if(!old.length)return old;let prev:MiniContext|undefined;return old.map(x=>{const a=askMiniAI(chart,x.q,l,prev);prev=a.context;return{q:x.q,a}})})},[l,chart?.utc]);"""
if insert_after not in text: raise SystemExit('Language regeneration marker not found')
text=text.replace(insert_after,lang_effect,1)

# Persistent one-time premium decision notifications. Reopening the app must not repeat the same decision.
notice_anchor=" useEffect(()=>{if(boot?.loggedIn&&boot.lockMode&&boot.lockMode!=='none')setLocked(true)},[boot?.loggedIn,boot?.lockMode]);\n"
notice_helper=""" useEffect(()=>{if(boot?.loggedIn&&boot.lockMode&&boot.lockMode!=='none')setLocked(true)},[boot?.loggedIn,boot?.lockMode]);
 async function notifyPremiumOnce(st:PremiumState){
  if(!['active','rejected','stopped','expired'].includes(st.kind))return;
  const key=`${st.kind}|${st.requestId||''}|${st.approvedAt||''}|${st.expiresAt||''}|${st.message||''}`;
  const seen=await AstroNative.getPremiumNoticeKey().catch(()=> '');if(seen===key)return;
  const activeMsg=l==='hi'?`आपका Premium ${clock(st.expiresAt)} तक सक्रिय है। Ask Jyotish G अब खुल गया है।`:l==='or'?`ଆପଣଙ୍କ Premium ${clock(st.expiresAt)} ପର୍ଯ୍ୟନ୍ତ ସକ୍ରିୟ। Ask Jyotish G ଏବେ ଖୋଲା ଅଛି।`:`Your Premium is active until ${clock(st.expiresAt)}. Ask Jyotish G is now unlocked.`;
  const rejectedMsg=st.message||(l==='hi'?'आपका Premium अनुरोध अस्वीकार किया गया है। भुगतान विवरण जाँचकर फिर प्रयास करें।':l==='or'?'ଆପଣଙ୍କ Premium ଅନୁରୋଧ ଅସ୍ୱୀକୃତ ହୋଇଛି। ପେମେଣ୍ଟ ବିବରଣୀ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।':'Your Premium request was rejected. Verify the payment details and try again.');
  const stoppedMsg=st.message||(l==='hi'?'Admin ने Premium रोक दिया है।':l==='or'?'Admin Premium ବନ୍ଦ କରିଛନ୍ତି।':'Premium access was stopped by the admin.');
  const expiredMsg=l==='hi'?'आपकी Premium अवधि समाप्त हो गई है। Premium स्क्रीन से नवीनीकरण कर सकते हैं।':l==='or'?'ଆପଣଙ୍କ Premium ସମୟ ଶେଷ ହୋଇଛି। Premium ସ୍କ୍ରିନ୍‌ରୁ ପୁଣି ନବୀକରଣ କରିପାରିବେ।':'Your Premium period has ended. You can renew from the Premium screen.';
  if(st.kind==='active'){AstroNative.showNotification('Jyotish G Premium Approved',activeMsg).catch(()=>{});Alert.alert(l==='hi'?'Premium स्वीकृत':l==='or'?'Premium ଅନୁମୋଦିତ':'Premium Approved',activeMsg)}
  else if(st.kind==='rejected'){AstroNative.showNotification('Jyotish G Premium',rejectedMsg).catch(()=>{});Alert.alert(l==='hi'?'अनुरोध अस्वीकार':l==='or'?'ଅନୁରୋଧ ଅସ୍ୱୀକୃତ':'Request Rejected',rejectedMsg)}
  else if(st.kind==='stopped'){AstroNative.showNotification('Jyotish G Premium',stoppedMsg).catch(()=>{});Alert.alert(l==='hi'?'Premium रोका गया':l==='or'?'Premium ବନ୍ଦ':'Premium Stopped',stoppedMsg)}
  else{AstroNative.showNotification('Jyotish G Premium',expiredMsg).catch(()=>{})}
  await AstroNative.savePremiumNoticeKey(key).catch(()=>{});
 }
"""
if notice_anchor not in text: raise SystemExit('Premium notice helper marker not found')
text=text.replace(notice_anchor,notice_helper,1)

# Replace all session-only premium transition notices with the persisted decision notifier.
sync_pattern=r"if\(prevPremium\.current!=='active'&&st\.kind==='active'\).*?prevPremium\.current=st\.kind;setPremium\(st\)"
m=re.search(sync_pattern,text,flags=re.S)
if not m: raise SystemExit('Premium transition notification block not found')
text=text[:m.start()]+"await notifyPremiumOnce(st);prevPremium.current=st.kind;setPremium(st)"+text[m.end():]
# Language is now part of the notification effect closure; persisted keys prevent duplicate notices after language changes.
text=text.replace("},[boot?.loggedIn,boot?.deviceId,boot?.email]);","},[boot?.loggedIn,boot?.deviceId,boot?.email,l]);",1)

chat_pattern=r"function ChatScreen\(.*?\nfunction GuidanceCard"
chat_repl=r'''function ChatScreen({t,l,active,chart,question,setQuestion,turns,ask,clear,premiumState,premium,birth,back}:any){const scroll=useRef<any>(null),last=turns.length?turns[turns.length-1].a:undefined;const ui=l==='hi'?{required:'Premium आवश्यक',requiredText:'व्यक्तिगत कुंडली Mini-AI उपयोग करने के लिए Premium सक्रिय करें।',view:'Premium देखें',active:'PREMIUM MINI-AI सक्रिय',sub:'Premium समाप्त होने तक अपनी कुंडली पर असीमित प्रश्न पूछें।',engine:'पूरी तरह local Mini-AI • कोई paid API नहीं',label:'अपना प्रश्न लिखें',placeholder:'नौकरी, शादी, पढ़ाई, पैसा, प्यार, अंतरंग संबंध, बाधा, पूजा, भविष्य… कुछ भी पूछें',ask:'पूछें',clear:'चैट साफ करें',you:'आप'}:l==='or'?{required:'Premium ଆବଶ୍ୟକ',requiredText:'ବ୍ୟକ୍ତିଗତ କୁଣ୍ଡଳୀ Mini-AI ବ୍ୟବହାର ପାଇଁ Premium ସକ୍ରିୟ କରନ୍ତୁ।',view:'Premium ଦେଖନ୍ତୁ',active:'PREMIUM MINI-AI ସକ୍ରିୟ',sub:'Premium ସମୟ ଶେଷ ହେବା ପର୍ଯ୍ୟନ୍ତ ନିଜ କୁଣ୍ଡଳୀ ବିଷୟରେ ଅସୀମିତ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।',engine:'ସମ୍ପୂର୍ଣ୍ଣ local Mini-AI • କୌଣସି paid API ନାହିଁ',label:'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ',placeholder:'ଚାକିରି, ବିବାହ, ପଢ଼ା, ଟଙ୍କା, ପ୍ରେମ, ଅନ୍ତରଙ୍ଗ ସମ୍ପର୍କ, ବାଧା, ପୂଜା, ଭବିଷ୍ୟତ… ଯାହା ଚାହିଁବେ ପଚାରନ୍ତୁ',ask:'ପଚାରନ୍ତୁ',clear:'ଚାଟ୍ ସଫା କରନ୍ତୁ',you:'ଆପଣ'}:{required:'Premium required',requiredText:'Activate Premium to use the personal kundali Mini-AI.',view:'View Premium',active:'PREMIUM MINI-AI ACTIVE',sub:'Ask unlimited questions about your kundali until Premium expires.',engine:'Fully local Mini-AI • no paid API',label:'Your question',placeholder:'Ask anything: job, marriage, study, money, love, intimacy, obstacles, puja, future…',ask:'Ask',clear:'Clear chat',you:'YOU'};const defaults=l==='hi'?['मुझे नौकरी कब मिलेगी?','शादी का सबसे अच्छा समय कब है?','सरकारी या निजी नौकरी?','मेरे रिश्ते/अंतरंग जीवन का समय कैसा है?','अभी बाधा क्यों है?','कौन-सा सरल पूजा/उपाय करूं?']:l==='or'?['ମୋତେ ଚାକିରି କେବେ ମିଳିବ?','ବିବାହ ପାଇଁ ସବୁଠାରୁ ଭଲ ସମୟ କେବେ?','ସରକାରୀ କି ପ୍ରାଇଭେଟ ଚାକିରି?','ମୋ ସମ୍ପର୍କ/ଅନ୍ତରଙ୍ଗ ଜୀବନର ସମୟ କେମିତି?','ଏବେ ବାଧା କାହିଁକି?','କେଉଁ ସରଳ ପୂଜା/ଉପାୟ କରିବି?']:['When will I get a job?','When is marriage strongest?','Government or private job?','How is my relationship/intimacy period?','Why am I facing obstacles now?','What simple puja/remedy should I do?'];const prompts=last?.suggestedFollowUps?.length?last.suggestedFollowUps:defaults;useEffect(()=>{if(turns.length)setTimeout(()=>scroll.current?.scrollToEnd({animated:true}),80)},[turns.length]);return<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[s.page,{paddingBottom:220}]} onContentSizeChange={()=>{if(turns.length)scroll.current?.scrollToEnd({animated:false})}}><Back t={t} go={back}/><Text style={s.title}>☉ {t.chat}</Text>{!active?<Card><Text style={s.gold}>{ui.required}</Text><Text style={s.muted}>{ui.requiredText}</Text><Btn onPress={premium}>{ui.view}</Btn></Card>:!chart?<Card><Text style={s.muted}>{t.noChart}</Text><Btn onPress={birth}>{t.kundli}</Btn></Card>:<><Card><Text style={s.good}>✓ {ui.active}</Text><Text style={s.count}>{formatRemaining(remainingMs(premiumState))}</Text><Text style={s.small}>{ui.sub}</Text><Text style={s.gold}>{ui.engine}</Text></Card><View style={s.chips}>{prompts.slice(0,6).map((x:string)=><Pressable key={x} style={s.chip} onPress={()=>ask(x)}><Text style={s.chipText}>{x}</Text></Pressable>)}</View>{turns.map((turn:any,i:number)=><View key={`${i}-${turn.q}`} style={{gap:10}}><View style={[s.card,{alignSelf:'flex-end',maxWidth:'92%',backgroundColor:'#24132f'}]}><Text style={s.small}>{ui.you}</Text><Text style={s.white}>{turn.q}</Text></View><MiniAnswerCard a={turn.a} l={l}/></View>)}<Field label={ui.label} value={question} onChangeText={setQuestion} multiline placeholder={ui.placeholder} returnKeyType="default" blurOnSubmit={false} onFocus={()=>setTimeout(()=>scroll.current?.scrollToEnd({animated:true}),180)}/><Btn onPress={()=>ask()}>{ui.ask}</Btn>{turns.length>0&&<Btn secondary onPress={clear}>{ui.clear}</Btn>}</>}</ScrollView></KeyboardAvoidingView>}
function GuidanceCard'''
text,count=re.subn(chat_pattern,chat_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Keyboard-safe Mini AI chat screen marker not found')

guidance_pattern=r"function GuidanceCard\(.*?\nfunction Section"
guidance_repl=r'''function MiniAnswerCard({a,l}:{a:MiniAnswer;l:L}){const z=l==='hi'?{answer:'सीधा उत्तर',current:'वर्तमान स्थिति',timing:'मजबूत आने वाले समय',why:'कुंडली से कारण',actions:'व्यावहारिक कदम',remedies:'पारंपरिक पूजा / उपाय',confidence:'विश्वसनीयता'}:l==='or'?{answer:'ସିଧା ଉତ୍ତର',current:'ବର୍ତ୍ତମାନ ସ୍ଥିତି',timing:'ଆଗାମୀ ଶକ୍ତିଶାଳୀ ସମୟ',why:'କୁଣ୍ଡଳୀ ଆଧାରିତ କାରଣ',actions:'ବ୍ୟବହାରିକ ପଦକ୍ଷେପ',remedies:'ପାରମ୍ପରିକ ପୂଜା / ଉପାୟ',confidence:'ଭରସା'}:{answer:'Direct answer',current:'Current situation',timing:'Strongest upcoming windows',why:'Kundali reasoning',actions:'Practical actions',remedies:'Traditional puja / remedies',confidence:'Confidence'};return<View style={{gap:12}}><Card><Text style={s.gold}>{a.title.toUpperCase()}</Text><Text style={s.small}>{a.understanding}</Text><Text style={s.cardTitle}>{a.directAnswer}</Text></Card><Card><Text style={s.gold}>{z.current.toUpperCase()}</Text><Text style={s.muted}>{a.currentSituation}</Text></Card>{a.timingWindows?.length>0&&<Card><Text style={s.gold}>{z.timing.toUpperCase()}</Text>{a.timingWindows.map((w:any,i:number)=><View key={`${w.startAt}-${i}`} style={{paddingVertical:9,borderBottomWidth:i===a.timingWindows.length-1?0:1,borderBottomColor:'#32243c'}}><Text style={s.white}>{w.label}</Text><Text style={s.small}>{w.score}/100 · {w.meaning}</Text></View>)}</Card>}<Section title={z.why} items={a.reasoning}/><Section title={z.actions} items={a.actions}/><Section title={z.remedies} items={a.remedies}/><Card><Text style={s.gold}>{z.confidence.toUpperCase()}</Text><Text style={s.muted}>{a.confidence}</Text><Text style={s.disc}>{a.disclaimer}</Text></Card></View>}
function GuidanceCard({g}:any){return null}
function Section'''
text,count=re.subn(guidance_pattern,guidance_repl,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Mini AI answer card marker not found')

# Add persistent notice acknowledgement to Android native storage.
kt=native.read_text()
marker='    @ReactMethod\n    fun requestNotificationPermission(p: Promise) {'
addition='''    @ReactMethod
    fun getPremiumNoticeKey(p: Promise) {
        try { p.resolve(prefs.getString("premium_notice_key", "") ?: "") }
        catch (e: Exception) { p.reject("PREMIUM_NOTICE_READ", e) }
    }

    @ReactMethod
    fun savePremiumNoticeKey(key: String, p: Promise) {
        try { prefs.edit().putString("premium_notice_key", key).apply(); p.resolve(true) }
        catch (e: Exception) { p.reject("PREMIUM_NOTICE_SAVE", e) }
    }

'''
if marker not in kt: raise SystemExit('Native premium notice marker not found')
if 'fun getPremiumNoticeKey(' not in kt: kt=kt.replace(marker,addition+marker,1)
native.write_text(kt)

for needle in ('askMiniAI(chart,text,l,previous)','PREMIUM MINI-AI ACTIVE','getPremiumNoticeKey','savePremiumNoticeKey','KeyboardAvoidingView','MiniAnswerCard','paddingBottom:220','suggestedFollowUps'):
    target=kt if needle in ('getPremiumNoticeKey','savePremiumNoticeKey') else text
    if needle not in target: raise SystemExit(f'Mini AI v4 patch missing: {needle}')
if 'analyseQuestion(chart,text,l,previous)' in text: raise SystemExit('Old canned guidance ask path still present')
path.write_text(text)
print('Jyotish G Mini AI v4 installed: one-time premium notices, keyboard-safe multilingual local semantic chat')

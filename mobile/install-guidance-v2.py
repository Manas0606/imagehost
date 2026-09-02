#!/usr/bin/env python3
from pathlib import Path
import re

root=Path.cwd(); app=root/'generated'/'JyotishG'
if not app.exists(): raise SystemExit('Generated React Native project not found')
app_ts=app/'App.tsx'; text=app_ts.read_text()

state_old="const[locked,setLocked]=useState(false),[lockSecret,setLockSecret]=useState(''),[pattern,setPattern]=useState<number[]>([]),[question,setQuestion]=useState(''),[answer,setAnswer]=useState<Guidance>();"
state_new="const[locked,setLocked]=useState(false),[lockSecret,setLockSecret]=useState(''),[pattern,setPattern]=useState<number[]>([]),[question,setQuestion]=useState(''),[answer,setAnswer]=useState<Guidance>(),[turns,setTurns]=useState<Array<{q:string;g:Guidance}>>([]);"
if state_old not in text: raise SystemExit('Chat state marker not found')
text=text.replace(state_old,state_new,1)

ask_old="function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium','Premium must be active to use Ask Jyotish G.');if(!text)return;setQuestion(text);setAnswer(analyseQuestion(chart,text))}"
ask_new="function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium','Premium must be active to use Ask Jyotish G.');if(!text)return;const previous=turns.length?turns[turns.length-1].g.topic:undefined;const g=analyseQuestion(chart,text,l,previous);setAnswer(g);setTurns(v=>[...v,{q:text,g}].slice(-30));setQuestion('')}"
if ask_old not in text: raise SystemExit('Ask function marker not found')
text=text.replace(ask_old,ask_new,1)

route_old="{screen==='chat'&&<ChatScreen t={t} active={active} chart={chart} question={question} setQuestion={setQuestion} answer={answer} ask={ask} premium={()=>setScreen('premium')} birth={()=>setScreen('birth')} back={()=>setScreen('home')}/>}"
route_new="{screen==='chat'&&<ChatScreen t={t} l={l} active={active} chart={chart} question={question} setQuestion={setQuestion} turns={turns} ask={ask} clear={()=>{setTurns([]);setAnswer(undefined);setQuestion('')}} premiumState={premium} premium={()=>setScreen('premium')} birth={()=>setScreen('birth')} back={()=>setScreen('home')}/>}"
if route_old not in text: raise SystemExit('Chat route marker not found')
text=text.replace(route_old,route_new,1)

# Make premium approval/expiry visible even while the app is open.
active_old="if(prevPremium.current!=='active'&&st.kind==='active'){AstroNative.showNotification('Jyotish G Premium Approved',`Your premium is active until ${clock(st.expiresAt)}.`).catch(()=>{})}if(prevPremium.current==='active'&&st.kind==='stopped'){AstroNative.showNotification('Jyotish G Premium Stopped',st.message||'Premium access was stopped by admin.').catch(()=>{})}"
active_new="if(prevPremium.current!=='active'&&st.kind==='active'){AstroNative.showNotification('Jyotish G Premium Approved',`Premium is active until ${clock(st.expiresAt)}. Ask Jyotish G is now unlocked.`).catch(()=>{});Alert.alert('Premium Approved',`Your premium is active until ${clock(st.expiresAt)}. Ask Jyotish G is now unlocked.`)}if(prevPremium.current==='active'&&st.kind==='stopped'){AstroNative.showNotification('Jyotish G Premium Stopped',st.message||'Premium access was stopped by admin.').catch(()=>{})}if(prevPremium.current==='active'&&st.kind==='expired'){AstroNative.showNotification('Jyotish G Premium Expired','Your premium period has ended. You can renew from the Premium screen.').catch(()=>{})}"
if active_old not in text: raise SystemExit('Premium notification marker not found')
text=text.replace(active_old,active_new,1)

pattern=r"function ChatScreen\(.*?\nfunction GuidanceCard"
replacement="""function ChatScreen({t,l,active,chart,question,setQuestion,turns,ask,clear,premiumState,premium,birth,back}:any){const prompts=l==='hi'?['मुझे नौकरी कब मिलेगी?','शादी के लिए अच्छा समय कब है?','पढ़ाई/परीक्षा का समय कैसा है?','मेरे जीवन में अभी बाधा क्यों है?','पैसे का समय कैसा है?','विदेश जाने का योग कब है?']:l==='or'?['ମୋତେ ଚାକିରି କେବେ ମିଳିବ?','ବିବାହ ପାଇଁ ଭଲ ସମୟ କେବେ?','ପଢ଼ା/ପରୀକ୍ଷା ପାଇଁ ସମୟ କେମିତି?','ଏବେ ଜୀବନରେ ବାଧା କାହିଁକି?','ଟଙ୍କାର ସମୟ କେମିତି?','ବିଦେଶ ଯିବାର ସମୟ କେବେ?']:['When will I get a job?','When is marriage supportive?','How is my study/exam period?','Why am I facing obstacles now?','How is my money period?','When is foreign travel supported?'];return<ScrollView keyboardShouldPersistTaps=\"handled\" contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>☉ {t.chat}</Text>{!active?<Card><Text style={s.gold}>Premium required</Text><Text style={s.muted}>Activate Premium to use the personal kundali guidance engine.</Text><Btn onPress={premium}>View Premium</Btn></Card>:!chart?<Card><Text style={s.muted}>{t.noChart}</Text><Btn onPress={birth}>{t.kundli}</Btn></Card>:<><Card><Text style={s.good}>✓ PREMIUM CHAT ACTIVE</Text><Text style={s.count}>{formatRemaining(remainingMs(premiumState))}</Text><Text style={s.small}>Ask unlimited kundali questions until your premium period expires.</Text></Card><View style={s.chips}>{prompts.map(x=><Pressable key={x} style={s.chip} onPress={()=>ask(x)}><Text style={s.chipText}>{x}</Text></Pressable>)}</View>{turns.map((turn:any,i:number)=><View key={`${i}-${turn.q}`} style={{gap:10}}><View style={[s.card,{alignSelf:'flex-end',maxWidth:'92%',backgroundColor:'#24132f'}]}><Text style={s.small}>YOU</Text><Text style={s.white}>{turn.q}</Text></View><GuidanceCard g={turn.g} l={l}/></View>)}<Field label={l==='hi'?'अपना प्रश्न लिखें':l==='or'?'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ':'Your question'} value={question} onChangeText={setQuestion} multiline placeholder={t.question}/><Btn onPress={()=>ask()}>{t.ask}</Btn>{turns.length>0&&<Btn secondary onPress={clear}>{l==='hi'?'चैट साफ करें':l==='or'?'ଚାଟ୍ ସଫା କରନ୍ତୁ':'Clear chat'}</Btn>}</>}</ScrollView>}
function GuidanceCard"""
text,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Chat screen marker not found')

pattern=r"function GuidanceCard\(\{g\}:\{g:Guidance\}\)\{.*?\nfunction Section"
replacement="""function GuidanceCard({g,l}:{g:Guidance;l:any}){const labels=l==='hi'?{current:'अभी की स्थिति',timing:'आने वाले मजबूत समय',why:'यह निष्कर्ष क्यों',actions:'क्या करें',remedies:'पारंपरिक पूजा / उपाय',confidence:'विश्वसनीयता'}:l==='or'?{current:'ବର୍ତ୍ତମାନ ସ୍ଥିତି',timing:'ଆଗାମୀ ଭଲ ସମୟ',why:'ଏହି ବିଶ୍ଳେଷଣ କାହିଁକି',actions:'କଣ କରିବେ',remedies:'ପାରମ୍ପରିକ ପୂଜା / ଉପାୟ',confidence:'ଭରସା'}:{current:'Current situation',timing:'Strongest upcoming windows',why:'Why this reading',actions:'What you should do',remedies:'Traditional puja / remedies',confidence:'Confidence'};return<View style={{gap:12}}><Card><Text style={s.gold}>{g.title.toUpperCase()}</Text><Text style={s.cardTitle}>{g.summary}</Text></Card><Card><Text style={s.gold}>{labels.current.toUpperCase()}</Text><Text style={s.muted}>{g.currentSituation}</Text></Card>{g.timingWindows?.length>0&&<Card><Text style={s.gold}>{labels.timing.toUpperCase()}</Text>{g.timingWindows.map((w:any,i:number)=><View key={`${w.startAt}-${i}`} style={{paddingVertical:9,borderBottomWidth:i===g.timingWindows.length-1?0:1,borderBottomColor:'#32243c'}}><Text style={s.white}>{w.label}</Text><Text style={s.small}>Traditional support score: {w.score}/100</Text>{w.reasons.slice(0,2).map((x:string,j:number)=><Text key={j} style={s.small}>• {x}</Text>)}</View>)}</Card>}<Section title={labels.why} items={g.why}/><Section title={labels.actions} items={g.actions}/><Section title={labels.remedies} items={g.remedies}/><Card><Text style={s.gold}>{labels.confidence.toUpperCase()}</Text><Text style={s.muted}>{g.confidence}</Text><Text style={s.disc}>{g.disclaimer}</Text></Card></View>}
function Section"""
text,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit('Guidance card marker not found')

required=(
    'turns,setTurns',
    'analyseQuestion(chart,text,l,previous)',
    'PREMIUM CHAT ACTIVE',
    'g.currentSituation',
    'g.timingWindows',
    'Premium Approved',
)
for needle in required:
    if needle not in text: raise SystemExit(f'Guidance v2 patch missing: {needle}')
app_ts.write_text(text)
print('Jyotish G guidance v2 overlay installed: multi-turn local kundali chat, timing windows, remedies, approval/expiry notifications')

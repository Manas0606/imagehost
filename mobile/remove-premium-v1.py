#!/usr/bin/env python3
from pathlib import Path
import json
import re

root = Path.cwd()
app = root / 'generated' / 'JyotishG'
path = app / 'App.tsx'
pkg = app / 'package.json'
native = app / 'android/app/src/main/java/com/jyotishg/AstroNativeModule.kt'
manifest = app / 'android/app/src/main/AndroidManifest.xml'
if not path.exists() or not pkg.exists():
    raise SystemExit('Generated Jyotish G files missing for premium removal')

text = path.read_text().replace('\r\n', '\n')
text = re.sub(r"import QRCode from'react-native-qrcode-svg';\n", '', text)
text = re.sub(r"import\{[^}]*Premium[^}]*\}from'\./premium';\n", '', text)
text = re.sub(r"const PRICE=[^;]+;\n", '', text)
text = re.sub(r"const TELEGRAM=[^;]+;\n", '', text)
text = re.sub(r"const UPI_URI=[^;]+;\n", '', text)
text = text.replace("type Screen='home'|'birth'|'chart'|'premium'|'chat'|'settings'|'lockSettings';", "type Screen='home'|'birth'|'chart'|'chat'|'settings'|'lockSettings';")

text = re.sub(r",premium:'[^']*'", '', text)
text = re.sub(r",support:'[^']*'", '', text)
text = re.sub(r",active:'[^']*'", '', text)
text = re.sub(r",pending:'[^']*'", '', text)
text = re.sub(r",remaining:'[^']*'", '', text)
text = re.sub(r",pay:'[^']*'", '', text)
text = re.sub(r",send:'[^']*'", '', text)
text = re.sub(r",utr:'[^']*'", '', text)
text = re.sub(r",benefits:'[^']*'", '', text)

text = re.sub(r",\[utr,setUtr\]=useState\(''\),\[premium,setPremium\]=useState<PremiumState>\([^;]+;", ';', text)
text = text.replace("const prevPremium=useRef<string>('checking'),appState=useRef(AppState.currentState),t=T[l];", "const appState=useRef(AppState.currentState),t=T[l];")
text = text.replace("const prevPremium=useRef<string>('checking'),t=T[l];", "const t=T[l];")
text = re.sub(r"\n async function notifyPremiumOnce\(st:PremiumState\)\{.*?\n \}\n", "\n", text, flags=re.S)
text = re.sub(r"\n useEffect\(\(\)=>\{\n  if\(!boot\?\.loggedIn\)return;\n  AstroNative\.requestNotificationPermission\(\)\.catch\(\(\)=>\{\}\);\n  let dead=false;\n  const sync=async\(\)=>\{.*?\n \},\[[^\]]*boot\?\.email[^\]]*\]\);\n", "\n", text, flags=re.S)
text = re.sub(r"fetchPremium\(boot\.deviceId,boot\.email\)\.then\(setPremium\)\.catch\(\(\)=>\{\}\);", '', text)
text = re.sub(r"\n const active=isPremiumUsable\(premium\);\n async function telegramRequest\(\)\{.*?\n async function unlock", "\n async function unlock", text, flags=re.S)
text = text.replace("function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium',l==='hi'?'Ask Jyotish G उपयोग करने के लिए Premium सक्रिय होना चाहिए।':l==='or'?'Ask Jyotish G ବ୍ୟବହାର ପାଇଁ Premium ସକ୍ରିୟ ହେବା ଦରକାର।':'Premium must be active to use Ask Jyotish G.');if(!text)return;", "function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!text)return;")
text = text.replace("function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!active)return Alert.alert('Premium','Premium must be active to use Ask Jyotish G.');if(!text)return;", "function ask(q?:string){const text=(q||question).trim();if(!chart)return Alert.alert('Jyotish G',t.noChart);if(!text)return;")

text = re.sub(r"<View style=\{s\.row\}><Tile icon=\"☾\" title=\{t\.chart\} onPress=\{\(\)=>setScreen\('chart'\)\} small/><Tile icon=\"✦\" title=\{active\?t\.active:t\.premium\} onPress=\{\(\)=>setScreen\('premium'\)\} small/></View>", "<Tile icon=\"☾\" title={t.chart} onPress={()=>setScreen('chart')}/>", text)
text = re.sub(r"\n \{screen==='premium'&&<PremiumScreen[^\n]*\n?", "\n", text)
text = re.sub(r"\n \{screen==='chat'&&<ChatScreen([^>]*) active=\{active\}([^>]*) premiumState=\{premium\} premium=\{\(\)=>setScreen\('premium'\)\}([^>]*)/>\} ", r"\n {screen==='chat'&&<ChatScreen\1\2\3/>} ", text)
text = re.sub(r"\n \{screen==='chat'&&<ChatScreen([^>]*) active=\{active\}([^>]*) premium=\{\(\)=>setScreen\('premium'\)\}([^>]*)/>\} ", r"\n {screen==='chat'&&<ChatScreen\1\2\3/>} ", text)
text = re.sub(r" active=\{active\}", '', text)
text = re.sub(r" premiumState=\{premium\}", '', text)
text = re.sub(r" premium=\{\(\)=>setScreen\('premium'\)\}", '', text)
text = re.sub(r"<Btn secondary onPress=\{\(\)=>Linking\.openURL\(`https://t\.me/\$\{TELEGRAM\}`\)\}>\{t\.support\} @\{TELEGRAM\}</Btn>", '', text)
text = re.sub(r"\nfunction PremiumScreen\(.*?\nfunction ChatScreen", "\nfunction ChatScreen", text, flags=re.S)

chat_pattern = r"function ChatScreen\(.*?\nfunction GuidanceCard"
chat_repl = r'''function ChatScreen({t,l,chart,question,setQuestion,turns,ask,clear,birth,back}:any){const scroll=useRef<any>(null),last=turns.length?turns[turns.length-1].a:undefined;const ui=l==='hi'?{active:'MINI-AI सक्रिय',sub:'अपनी कुंडली पर असीमित प्रश्न पूछें।',engine:'पूरी तरह local Mini-AI • कोई paid API नहीं',label:'अपना प्रश्न लिखें',placeholder:'नौकरी, शादी, पढ़ाई, पैसा, प्यार, अंतरंग संबंध, बाधा, पूजा, भविष्य… कुछ भी पूछें',ask:'पूछें',clear:'चैट साफ करें',you:'आप'}:l==='or'?{active:'MINI-AI ସକ୍ରିୟ',sub:'ନିଜ କୁଣ୍ଡଳୀ ବିଷୟରେ ଅସୀମିତ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।',engine:'ସମ୍ପୂର୍ଣ୍ଣ local Mini-AI • କୌଣସି paid API ନାହିଁ',label:'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ',placeholder:'ଚାକିରି, ବିବାହ, ପଢ଼ା, ଟଙ୍କା, ପ୍ରେମ, ଅନ୍ତରଙ୍ଗ ସମ୍ପର୍କ, ବାଧା, ପୂଜା, ଭବିଷ୍ୟତ… ଯାହା ଚାହିଁବେ ପଚାରନ୍ତୁ',ask:'ପଚାରନ୍ତୁ',clear:'ଚାଟ୍ ସଫା କରନ୍ତୁ',you:'ଆପଣ'}:{active:'MINI-AI ACTIVE',sub:'Ask unlimited questions about your kundali.',engine:'Fully local Mini-AI • no paid API',label:'Your question',placeholder:'Ask anything: job, marriage, study, money, love, intimacy, obstacles, puja, future…',ask:'Ask',clear:'Clear chat',you:'YOU'};const defaults=l==='hi'?['मुझे नौकरी कब मिलेगी?','शादी का सबसे अच्छा समय कब है?','सरकारी या निजी नौकरी?','मेरे रिश्ते/अंतरंग जीवन का समय कैसा है?','अभी बाधा क्यों है?','कौन-सा सरल पूजा/उपाय करूं?']:l==='or'?['ମୋତେ ଚାକିରି କେବେ ମିଳିବ?','ବିବାହ ପାଇଁ ସବୁଠାରୁ ଭଲ ସମୟ କେବେ?','ସରକାରୀ କି ପ୍ରାଇଭେଟ ଚାକିରି?','ମୋ ସମ୍ପର୍କ/ଅନ୍ତରଙ୍ଗ ଜୀବନର ସମୟ କେମିତି?','ଏବେ ବାଧା କାହିଁକି?','କେଉଁ ସରଳ ପୂଜା/ଉପାୟ କରିବି?']:['When will I get a job?','When is marriage strongest?','Government or private job?','How is my relationship/intimacy period?','Why am I facing obstacles now?','What simple puja/remedy should I do?'];const prompts=last?.suggestedFollowUps?.length?last.suggestedFollowUps:defaults;useEffect(()=>{if(turns.length)setTimeout(()=>scroll.current?.scrollToEnd({animated:true}),80)},[turns.length]);return<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[s.page,{paddingBottom:220}]} onContentSizeChange={()=>{if(turns.length)scroll.current?.scrollToEnd({animated:false})}}><Back t={t} go={back}/><Text style={s.title}>☉ {t.chat}</Text>{!chart?<Card><Text style={s.muted}>{t.noChart}</Text><Btn onPress={birth}>{t.kundli}</Btn></Card>:<><Card><Text style={s.good}>✓ {ui.active}</Text><Text style={s.small}>{ui.sub}</Text><Text style={s.gold}>{ui.engine}</Text></Card><View style={s.chips}>{prompts.slice(0,6).map((x:string)=><Pressable key={x} style={s.chip} onPress={()=>ask(x)}><Text style={s.chipText}>{x}</Text></Pressable>)}</View>{turns.map((turn:any,i:number)=><View key={`${i}-${turn.q}`} style={{gap:10}}><View style={[s.card,{alignSelf:'flex-end',maxWidth:'92%',backgroundColor:'#24132f'}]}><Text style={s.small}>{ui.you}</Text><Text style={s.white}>{turn.q}</Text></View><MiniAnswerCard a={turn.a} l={l}/></View>)}<Field label={ui.label} value={question} onChangeText={setQuestion} multiline placeholder={ui.placeholder} returnKeyType="default" blurOnSubmit={false} onFocus={()=>setTimeout(()=>scroll.current?.scrollToEnd({animated:true}),180)}/><Btn onPress={()=>ask()}>{ui.ask}</Btn>{turns.length>0&&<Btn secondary onPress={clear}>{ui.clear}</Btn>}</>}</ScrollView></KeyboardAvoidingView>}
function GuidanceCard'''
text, count = re.subn(chat_pattern, chat_repl, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit('Chat screen replacement failed during premium removal')
mini_answer = """function MiniAnswerCard({a,l}:{a:MiniAnswer;l:L}){const z=l==='hi'?{current:'वर्तमान स्थिति',timing:'मजबूत आने वाले समय',why:'कुंडली से कारण',actions:'व्यावहारिक कदम',remedies:'पारंपरिक पूजा / उपाय',confidence:'विश्वसनीयता'}:l==='or'?{current:'ବର୍ତ୍ତମାନ ସ୍ଥିତି',timing:'ଆଗାମୀ ଶକ୍ତିଶାଳୀ ସମୟ',why:'କୁଣ୍ଡଳୀ ଆଧାରିତ କାରଣ',actions:'ବ୍ୟବହାରିକ ପଦକ୍ଷେପ',remedies:'ପାରମ୍ପରିକ ପୂଜା / ଉପାୟ',confidence:'ଭରସା'}:{current:'Current situation',timing:'Strongest upcoming windows',why:'Kundali reasoning',actions:'Practical actions',remedies:'Traditional puja / remedies',confidence:'Confidence'};return<View style={{gap:12}}><Card><Text style={s.gold}>{a.title.toUpperCase()}</Text><Text style={s.small}>{a.understanding}</Text><Text style={s.cardTitle}>{a.directAnswer}</Text></Card><Card><Text style={s.gold}>{z.current.toUpperCase()}</Text><Text style={s.muted}>{a.currentSituation}</Text></Card>{a.timingWindows?.length>0&&<Card><Text style={s.gold}>{z.timing.toUpperCase()}</Text>{a.timingWindows.map((w:any,i:number)=><View key={`${w.startAt}-${i}`} style={{paddingVertical:9,borderBottomWidth:i===a.timingWindows.length-1?0:1,borderBottomColor:'#32243c'}}><Text style={s.white}>{w.label}</Text><Text style={s.small}>{w.score}/100 · {w.meaning}</Text></View>)}</Card>}<Section title={z.why} items={a.reasoning}/><Section title={z.actions} items={a.actions}/><Section title={z.remedies} items={a.remedies}/><Card><Text style={s.gold}>{z.confidence.toUpperCase()}</Text><Text style={s.muted}>{a.confidence}</Text><Text style={s.disc}>{a.disclaimer}</Text></Card></View>}\n"""
text = text.replace("function GuidanceCard({g}:any){return null}\n", mini_answer + "function GuidanceCard({g}:any){return null}\n")

text = re.sub(r",price:\{[^}]+\}", '', text)
text = re.sub(r",good:\{[^}]+\}", ",good:{color:'#78e8a0',fontSize:24,fontWeight:'900'}", text)
text = re.sub(r",count:\{[^}]+\}", '', text)
text = re.sub(r",qr:\{[^}]+\}", '', text)
text = re.sub(r",stopCard:\{[^}]+\}", '', text)
text = re.sub(r",stopTitle:\{[^}]+\}", '', text)
text = re.sub(r",benefit:\{[^}]+\}", '', text)

for forbidden in ('Premium', 'premium', 'Telegram', 'telegram', 'Admin', 'admin', 'UTR', 'UPI', 'QRCode', 'PREMIUM_', 'AstroSathiAdminBot'):
    if forbidden in text:
        path.write_text(text)
        raise SystemExit(f'Premium removal left app text/code behind: {forbidden}')
path.write_text(text)

data = json.loads(pkg.read_text())
deps = data.get('dependencies', {})
for dep in ('react-native-qrcode-svg', 'react-native-svg'):
    deps.pop(dep, None)
pkg.write_text(json.dumps(data, indent=2) + '\n')

if native.exists():
    kt = native.read_text().replace('\r\n', '\n')
    blocked = (
        'savePremiumLocalState',
        'getPremiumLocalState',
        'clearPremiumLocalState',
        'getPremiumNoticeKey',
        'savePremiumNoticeKey',
    )
    lines = kt.splitlines()
    kept = []
    i = 0
    while i < len(lines):
        if lines[i].strip() == '@ReactMethod' and i + 1 < len(lines) and any(f'fun {name}(' in lines[i + 1] for name in blocked):
            i += 2
            while i < len(lines) and lines[i].strip() != '@ReactMethod':
                i += 1
            continue
        kept.append(lines[i])
        i += 1
    kt = '\n'.join(kept) + '\n'
    kt = kt.replace('Premium approval and Jyotish G status updates', 'Jyotish G status updates')
    for forbidden in ('Premium', 'premium', 'Telegram', 'telegram', 'PREMIUM_', 'AstroSathiAdminBot'):
        if forbidden in kt:
            raise SystemExit(f'Premium removal left native code behind: {forbidden}')
    native.write_text(kt)

if manifest.exists():
    mt = manifest.read_text().replace('\r\n', '\n')
    mt = re.sub(r'\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />', '', mt)
    manifest.write_text(mt)

print('Jyotish G premium, Telegram, UPI and admin flows removed; Mini-AI chat is unlocked after Kundli creation')

import React,{useEffect,useRef,useState}from'react';
import {
  ActivityIndicator,Alert,Animated,Image,KeyboardAvoidingView,Linking,NativeModules,
  Platform,Pressable,ScrollView,Share,StatusBar,StyleSheet,Text,TextInput,View
}from'react-native';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import {calculateChart,type Chart} from './astrology';
import {
  PREMIUM_CONTROL_URL,PREMIUM_POLL_MS,type PremiumState,
  fetchPremium,isPremiumUsable,remainingMs,formatRemaining
} from './premium';

const {AstroNative}=NativeModules;
const PRICE=49;
const TELEGRAM='OdiaEduJobs';
const UPI_URI='upi://pay?pa=7750924539-3@axl&pn=MANAS%20SAMAL&mc=0000&mode=02&purpose=00';
const GOOGLE_WEB_CLIENT_ID=''; // Add OAuth Web client ID to make Google Sign-In live.
const RISHI_URL='https://upload.wikimedia.org/wikipedia/commons/f/f7/Bharadwaja.jpg';

type L='en'|'hi'|'or';
type Screen='home'|'birth'|'chart'|'premium'|'settings';
type Boot={deviceId:string;loggedIn:boolean;name?:string;email?:string;premium:boolean;birthProfile?:string};
type Birth={date:string;time:string;place:string;latitude:string;longitude:string;tz:string};

const TXT={
  en:{
    login:'Login',register:'Create account',name:'Full name',email:'Email',password:'Password',confirm:'Confirm password',
    go:'Continue',google:'Continue with Google',hello:'Namaste',sub:'Private Vedic astrology with deterministic astronomical calculations.',
    kundli:'Create Kundli',chart:'My Chart',premium:'Premium',settings:'Settings',birth:'Birth Details',
    help:'Exact birth time matters. Use accurate coordinates and UTC offset.',date:'Birth date (YYYY-MM-DD)',
    time:'Birth time (HH:MM)',place:'Birth place',lat:'Latitude',lon:'Longitude',tz:'UTC offset minutes',
    calc:'Calculate Kundli',lagna:'Lagna',panchang:'Panchang',planets:'Planetary Positions',dasha:'Current Mahadasha',
    pay:'Pay ₹49 with UPI',scan:'Scan & Pay',paymentHelp:'After payment, send your UTR and Device ID to Telegram for approval.',
    utr:'UTR / Transaction ID',share:'Send payment details',device:'Device ID',active:'Premium Active',pending:'Awaiting admin approval',
    stopped:'Premium stopped',expired:'Premium expired',remaining:'Time remaining',support:'Telegram Support',privacy:'Your local profile is encrypted using Android Keystore-backed storage.',
    logout:'Logout',back:'Back',no:'Create a Kundli first.',disc:'Astrology is traditional guidance and is not scientifically established. Do not use it as medical, legal or financial advice.',
    six:'Premium starts only after admin approval and remains active for exactly 6 hours.'
  },
  hi:{
    login:'लॉग इन',register:'खाता बनाएँ',name:'पूरा नाम',email:'ईमेल',password:'पासवर्ड',confirm:'पासवर्ड दोबारा लिखें',
    go:'आगे बढ़ें',google:'Google से जारी रखें',hello:'नमस्ते',sub:'निजी वैदिक ज्योतिष और निश्चित खगोलीय गणना।',
    kundli:'कुंडली बनाएँ',chart:'मेरी कुंडली',premium:'प्रीमियम',settings:'सेटिंग्स',birth:'जन्म विवरण',
    help:'सटीक जन्म समय महत्वपूर्ण है। सही coordinates और UTC offset दें।',date:'जन्म तिथि (YYYY-MM-DD)',
    time:'जन्म समय (HH:MM)',place:'जन्म स्थान',lat:'अक्षांश',lon:'देशांतर',tz:'UTC offset minutes',
    calc:'कुंडली गणना करें',lagna:'लग्न',panchang:'पंचांग',planets:'ग्रह स्थिति',dasha:'वर्तमान महादशा',
    pay:'UPI से ₹49 भुगतान',scan:'स्कैन और भुगतान',paymentHelp:'भुगतान के बाद UTR और Device ID Telegram पर approval के लिए भेजें।',
    utr:'UTR / Transaction ID',share:'भुगतान विवरण भेजें',device:'डिवाइस ID',active:'प्रीमियम सक्रिय',pending:'एडमिन approval की प्रतीक्षा',
    stopped:'प्रीमियम बंद',expired:'प्रीमियम समाप्त',remaining:'शेष समय',support:'Telegram सहायता',privacy:'आपका local profile Android Keystore encryption से सुरक्षित है।',
    logout:'लॉग आउट',back:'वापस',no:'पहले कुंडली बनाएँ।',disc:'ज्योतिष पारंपरिक मार्गदर्शन है और वैज्ञानिक रूप से स्थापित नहीं है। चिकित्सा, कानूनी या वित्तीय सलाह के स्थान पर इसका उपयोग न करें।',
    six:'प्रीमियम केवल admin approval के बाद शुरू होगा और ठीक 6 घंटे तक चलेगा।'
  },
  or:{
    login:'ଲଗ୍ ଇନ୍',register:'ଆକାଉଣ୍ଟ ତିଆରି',name:'ପୂର୍ଣ୍ଣ ନାମ',email:'ଇମେଲ୍',password:'ପାସୱାର୍ଡ',confirm:'ପାସୱାର୍ଡ ପୁଣି ଲେଖନ୍ତୁ',
    go:'ଆଗକୁ',google:'Google ସହ ଜାରି ରଖନ୍ତୁ',hello:'ନମସ୍କାର',sub:'ବ୍ୟକ୍ତିଗତ ବୈଦିକ ଜ୍ୟୋତିଷ ଓ ନିର୍ଦ୍ଧାରିତ ଖଗୋଳୀୟ ଗଣନା।',
    kundli:'କୁଣ୍ଡଳୀ ତିଆରି',chart:'ମୋ କୁଣ୍ଡଳୀ',premium:'ପ୍ରିମିୟମ୍',settings:'ସେଟିଂସ୍',birth:'ଜନ୍ମ ବିବରଣୀ',
    help:'ସଠିକ୍ ଜନ୍ମ ସମୟ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ। ସଠିକ୍ coordinates ଓ UTC offset ଦିଅନ୍ତୁ।',date:'ଜନ୍ମ ତାରିଖ (YYYY-MM-DD)',
    time:'ଜନ୍ମ ସମୟ (HH:MM)',place:'ଜନ୍ମ ସ୍ଥାନ',lat:'Latitude',lon:'Longitude',tz:'UTC offset minutes',
    calc:'କୁଣ୍ଡଳୀ ଗଣନା',lagna:'ଲଗ୍ନ',panchang:'ପଞ୍ଚାଙ୍ଗ',planets:'ଗ୍ରହ ସ୍ଥିତି',dasha:'ବର୍ତ୍ତମାନ ମହାଦଶା',
    pay:'UPI ଦ୍ୱାରା ₹49 ପେମେଣ୍ଟ',scan:'ସ୍କାନ୍ କରି ପେମେଣ୍ଟ',paymentHelp:'ପେମେଣ୍ଟ ପରେ UTR ଓ Device ID Telegram ରେ approval ପାଇଁ ପଠାନ୍ତୁ।',
    utr:'UTR / Transaction ID',share:'ପେମେଣ୍ଟ ବିବରଣୀ ପଠାନ୍ତୁ',device:'ଡିଭାଇସ୍ ID',active:'ପ୍ରିମିୟମ୍ ସକ୍ରିୟ',pending:'Admin approval ପାଇଁ ଅପେକ୍ଷା',
    stopped:'ପ୍ରିମିୟମ୍ ବନ୍ଦ',expired:'ପ୍ରିମିୟମ୍ ସମାପ୍ତ',remaining:'ଅବଶିଷ୍ଟ ସମୟ',support:'Telegram ସହାୟତା',privacy:'ଆପଣଙ୍କ local profile Android Keystore encryption ଦ୍ୱାରା ସୁରକ୍ଷିତ।',
    logout:'ଲଗ୍ ଆଉଟ୍',back:'ପଛକୁ',no:'ପ୍ରଥମେ କୁଣ୍ଡଳୀ ତିଆରି କରନ୍ତୁ।',disc:'ଜ୍ୟୋତିଷ ପାରମ୍ପରିକ ମାର୍ଗଦର୍ଶନ ଓ ବୈଜ୍ଞାନିକ ଭାବେ ସ୍ଥାପିତ ନୁହେଁ। medical, legal କିମ୍ବା financial advice ର ବଦଳରେ ବ୍ୟବହାର କରନ୍ତୁ ନାହିଁ।',
    six:'ପ୍ରିମିୟମ୍ କେବଳ admin approval ପରେ ଆରମ୍ଭ ହେବ ଏବଂ ଠିକ୍ 6 ଘଣ୍ଟା ଚାଲିବ।'
  }
} as const;

const cities=[
  ['Bhubaneswar','20.2961','85.8245','330'],['Cuttack','20.4625','85.8830','330'],['Puri','19.8135','85.8312','330'],
  ['Delhi','28.6139','77.2090','330'],['Mumbai','19.0760','72.8777','330'],['Bengaluru','12.9716','77.5946','330']
];
const EMPTY:Birth={date:'',time:'',place:'Bhubaneswar',latitude:'20.2961',longitude:'85.8245',tz:'330'};

export default function App(){
  return <SafeAreaProvider><AppBody/></SafeAreaProvider>
}

function AppBody(){
  const[l,setL]=useState<L>('en');
  const[boot,setBoot]=useState<Boot|null>(null);
  const[mode,setMode]=useState<'login'|'register'>('login');
  const[screen,setScreen]=useState<Screen>('home');
  const[name,setName]=useState('');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[confirm,setConfirm]=useState('');
  const[birth,setBirth]=useState<Birth>(EMPTY);
  const[chart,setChart]=useState<Chart>();
  const[utr,setUtr]=useState('');
  const[busy,setBusy]=useState(false);
  const[premium,setPremium]=useState<PremiumState>({kind:'checking',message:'Checking premium status…',serverNow:Date.now(),syncedAt:Date.now()});
  const[remoteGoogleId,setRemoteGoogleId]=useState('');
  const[now,setNow]=useState(Date.now());
  const pulse=useRef(new Animated.Value(.55)).current;
  const t=TXT[l];

  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1,duration:1600,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:.55,duration:1600,useNativeDriver:true})
    ])).start();
    load();
  },[]);

  useEffect(()=>{
    if(!boot?.loggedIn)return;
    let dead=false;
    async function sync(){
      try{
        const st=await fetchPremium(boot.deviceId,boot.email);
        if(dead)return;
        setRemoteGoogleId(st.googleWebClientId||'');
        setPremium(st);
      }catch{
        if(!dead)setPremium({kind:'offline',message:'Could not reach premium server. Connect to internet and try again.',serverNow:Date.now(),syncedAt:Date.now()});
      }
    }
    sync();
    const poll=setInterval(sync,PREMIUM_POLL_MS);
    const tick=setInterval(()=>setNow(Date.now()),1000);
    return()=>{dead=true;clearInterval(poll);clearInterval(tick)};
  },[boot?.loggedIn,boot?.deviceId,boot?.email]);

  async function load(){
    try{
      const b=await AstroNative.getBootstrap();
      setBoot(b);
      if(b.birthProfile)setBirth(JSON.parse(b.birthProfile));
    }catch(e:any){Alert.alert('AstroSathi',e?.message||String(e))}
  }

  async function auth(){
    const mail=email.trim();
    if(!mail||!mail.includes('@'))return Alert.alert('AstroSathi','Please enter a valid email address.');
    if(password.length<8)return Alert.alert('AstroSathi','Password must contain at least 8 characters.');
    if(mode==='register'&&name.trim().length<2)return Alert.alert('AstroSathi','Please enter your full name.');
    if(mode==='register'&&password!==confirm)return Alert.alert('AstroSathi','Passwords do not match.');
    setBusy(true);
    try{
      mode==='register'?await AstroNative.register(name.trim(),mail,password):await AstroNative.login(mail,password);
      await load();
    }catch(e:any){Alert.alert('AstroSathi',e?.message||String(e))}
    finally{setBusy(false)}
  }

  async function googleAuth(){
    const clientId=remoteGoogleId||GOOGLE_WEB_CLIENT_ID;
    if(!clientId){
      return Alert.alert('Google Sign-In','Google OAuth client ID is not configured yet. Email login is fully available.');
    }
    try{
      setBusy(true);
      const mod:any=require('@react-native-google-signin/google-signin');
      const GoogleSignin=mod.GoogleSignin;
      GoogleSignin.configure({webClientId:clientId,offlineAccess:false});
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
      const r:any=await GoogleSignin.signIn();
      const u=r?.data?.user||r?.user;
      if(!u?.email)throw new Error('Google did not return an email address.');
      await AstroNative.loginGoogle(u.name||u.givenName||'AstroSathi User',u.email);
      await load();
    }catch(e:any){
      if(e?.code!=='SIGN_IN_CANCELLED')Alert.alert('Google Sign-In',e?.message||String(e));
    }finally{setBusy(false)}
  }

  async function calculate(){
    setBusy(true);
    try{
      await AstroNative.saveBirthProfile(JSON.stringify(birth));
      setChart(calculateChart(birth.date,birth.time,+birth.latitude,+birth.longitude,+birth.tz));
      setScreen('chart');await load();
    }catch(e:any){Alert.alert('AstroSathi',e?.message||String(e))}
    finally{setBusy(false)}
  }

  const premiumActive=isPremiumUsable(premium);

  if(!boot)return <Shell><ActivityIndicator color="#f2d17b" size="large"/></Shell>;

  if(!boot.loggedIn){
    return <Shell>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.authScroll}>
          <View style={s.auth}>
            <BrandMark large/>
            <Text style={s.logoBig}>AstroSathi</Text>
            <View style={s.langCenter}><Lang l={l} setL={setL}/></View>
            <View style={s.formCard}>
              <Text style={s.authTitle}>{mode==='login'?t.login:t.register}</Text>
              {mode==='register'&&<Field label={t.name} value={name} onChangeText={setName}/>} 
              <Field label={t.email} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"/>
              <Field label={t.password} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
              {mode==='register'&&<Field label={t.confirm} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none"/>}
              <Btn onPress={auth}>{busy?'…':t.go}</Btn>
              <View style={s.orLine}><View style={s.line}/><Text style={s.small}>OR</Text><View style={s.line}/></View>
              <Pressable onPress={googleAuth} style={s.googleBtn}>
                <Text style={s.googleG}>G</Text><Text style={s.googleText}>{t.google}</Text>
              </Pressable>
            </View>
            <Pressable onPress={()=>{setMode(mode==='login'?'register':'login');setPassword('');setConfirm('')}}>
              <Text style={s.link}>{mode==='login'?t.register:t.login}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Shell>
  }

  return <Shell>
    <Header l={l} setL={setL} onHome={()=>setScreen('home')}/>
    {screen==='home'&&<ScrollView contentContainerStyle={s.page}>
      <View style={s.hero}>
        <Image source={{uri:RISHI_URL}} style={s.heroArt}/>
        <View style={s.heroShade}/>
        <View style={s.heroContent}>
          <Text style={s.kicker}>{t.hello}{boot.name?`, ${boot.name}`:''}</Text>
          <Text style={s.heroTitle}>Read the sky{`\n`}within you.</Text>
          <Text style={s.mutedLight}>{t.sub}</Text>
        </View>
      </View>
      <Tile icon="☸" title={t.kundli} onPress={()=>setScreen('birth')}/>
      <View style={s.row}>
        <Tile icon="☾" title={t.chart} onPress={()=>setScreen('chart')} small/>
        <Tile icon="✦" title={premiumActive?t.active:t.premium} onPress={()=>setScreen('premium')} small/>
      </View>
      <Tile icon="⚙" title={t.settings} onPress={()=>setScreen('settings')}/>
      <Text style={s.disc}>{t.disc}</Text>
    </ScrollView>}

    {screen==='birth'&&<BirthView birth={birth} setBirth={setBirth} t={t} calc={calculate} busy={busy} back={()=>setScreen('home')}/>} 
    {screen==='chart'&&<ChartView chart={chart} t={t} back={()=>setScreen('home')}/>} 

    {screen==='premium'&&<ScrollView contentContainerStyle={s.page}>
      <Back t={t} go={()=>setScreen('home')}/>
      <Text style={s.title}>{t.premium}</Text>
      <Text style={s.gold}>{t.six}</Text>

      {premiumActive?
        <Card>
          <Text style={s.good}>✓ {t.active}</Text>
          <Text style={s.count}>{formatRemaining(remainingMs(premium))}</Text>
          <Text style={s.small}>{t.remaining}</Text>
          {!!premium.message&&<Text style={s.muted}>{premium.message}</Text>}
        </Card>
      :
        <>
          {(premium.kind==='stopped'||premium.kind==='expired')&&
            <View style={s.stopCard}>
              <Text style={s.stopTitle}>{premium.kind==='stopped'?t.stopped:t.expired}</Text>
              <Text style={s.stopMessage}>{premium.message}</Text>
            </View>
          }
          {premium.kind==='pending'&&<Card><Text style={s.gold}>{t.pending}</Text><Text style={s.muted}>{premium.message}</Text></Card>}
          <Card>
            <Text style={s.price}>₹{PRICE}</Text>
            <Text style={s.muted}>{t.paymentHelp}</Text>
            <View style={s.qrWrap}><QRCode value={UPI_URI} size={230} backgroundColor="#fff" color="#111"/></View>
            <Text style={s.small}>{t.scan}</Text>
            <Btn onPress={()=>Linking.openURL(UPI_URI)}>{t.pay}</Btn>
          </Card>
          <Field label={t.utr} value={utr} onChangeText={setUtr}/>
          <Field label={t.device} value={boot.deviceId} editable={false}/>
          <Btn secondary onPress={()=>Share.share({message:`AstroSathi Premium Approval\nAmount: ₹${PRICE}\nEmail: ${boot.email||''}\nUTR: ${utr}\nDevice ID: ${boot.deviceId}\nTelegram: @${TELEGRAM}`})}>{t.share}</Btn>
        </>
      }
      <Btn secondary onPress={()=>Linking.openURL(`https://t.me/${TELEGRAM}`)}>{t.support} @${TELEGRAM}</Btn>
      <Text style={s.small}>Remote control: {PREMIUM_CONTROL_URL}</Text>
    </ScrollView>}

    {screen==='settings'&&<ScrollView contentContainerStyle={s.page}>
      <Back t={t} go={()=>setScreen('home')}/>
      <Text style={s.title}>{t.settings}</Text>
      <Card><Text style={s.cardTitle}>{boot.name}</Text><Text style={s.muted}>{boot.email}</Text></Card>
      <Card><Text style={s.muted}>{t.privacy}</Text><Text style={s.small}>Device: {boot.deviceId}</Text></Card>
      <Btn secondary onPress={()=>Linking.openURL(`https://t.me/${TELEGRAM}`)}>{t.support} @${TELEGRAM}</Btn>
      <Btn secondary onPress={async()=>{await AstroNative.logout();setChart(undefined);setScreen('home');await load()}}>{t.logout}</Btn>
    </ScrollView>}
  </Shell>
}

function BrandMark({large=false}:{large?:boolean}){
  const size=large?126:34;
  return <View style={[s.brandMark,{width:size,height:size,borderRadius:size/2}]}>
    <View style={[s.brandRing,{width:size*.76,height:size*.76,borderRadius:size*.38}]}>
      <Text style={[s.om,{fontSize:large?55:18}]}>ॐ</Text>
    </View>
  </View>
}

function Header({l,setL,onHome}:{l:L;setL:(x:L)=>void;onHome:()=>void}){
  const insets=useSafeAreaInsets();
  return <View style={[s.head,{paddingTop:Math.max(insets.top,8),height:64+Math.max(insets.top,8)}]}>
    <Pressable onPress={onHome} style={s.brandRow}>
      <BrandMark/><Text style={s.logo}>AstroSathi</Text>
    </Pressable>
    <Lang l={l} setL={setL}/>
  </View>
}

function BirthView({birth,setBirth,t,calc,busy,back}:any){
  const set=(k:string)=>(v:string)=>setBirth({...birth,[k]:v});
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
    <Back t={t} go={back}/><Text style={s.title}>{t.birth}</Text><Text style={s.muted}>{t.help}</Text>
    <Field label={t.date} value={birth.date} onChangeText={set('date')} placeholder="1995-06-15"/>
    <Field label={t.time} value={birth.time} onChangeText={set('time')} placeholder="08:30"/>
    <Field label={t.place} value={birth.place} onChangeText={set('place')}/>
    <View style={s.row}><Field containerStyle={s.flexField} label={t.lat} value={birth.latitude} onChangeText={set('latitude')}/><Field containerStyle={s.flexField} label={t.lon} value={birth.longitude} onChangeText={set('longitude')}/></View>
    <Field label={t.tz} value={birth.tz} onChangeText={set('tz')}/>
    <View style={s.chips}>{cities.map(c=><Pressable key={c[0]} style={s.chip} onPress={()=>setBirth({...birth,place:c[0],latitude:c[1],longitude:c[2],tz:c[3]})}><Text style={s.chipText}>{c[0]}</Text></Pressable>)}</View>
    <Btn onPress={calc}>{busy?'Calculating…':t.calc}</Btn>
  </ScrollView>
}

function ChartView({chart,t,back}:{chart?:Chart;t:any;back:()=>void}){
  if(!chart)return <ScrollView contentContainerStyle={s.page}><Back t={t} go={back}/><Text style={s.title}>{t.no}</Text></ScrollView>;
  return <ScrollView contentContainerStyle={s.page}>
    <Back t={t} go={back}/><Text style={s.kicker}>VEDIC CHART</Text><Text style={s.heroTitle}>{chart.ascendant.rashi} {t.lagna}</Text>
    <View style={s.row}><Metric k={t.lagna} v={`${chart.ascendant.rashi} ${chart.ascendant.degreesInRashi.toFixed(2)}°`} x={`${chart.ascendant.nakshatra} • Pada ${chart.ascendant.pada}`}/><Metric k={t.dasha} v={chart.dasha.currentLord} x={new Date(chart.dasha.currentEndsAt).toLocaleDateString()}/></View>
    <Card><Text style={s.gold}>{t.panchang}</Text><Text style={s.cardTitle}>{chart.panchang.paksha} • {chart.panchang.tithi}</Text><Text style={s.muted}>{chart.panchang.nakshatra} Pada {chart.panchang.pada} · {chart.panchang.yoga} · {chart.panchang.karana}</Text></Card>
    <Card><Text style={s.gold}>{t.planets}</Text>{chart.planets.map(p=><View style={s.planet} key={p.name}><View><Text style={s.white}>{p.name}{p.retrograde?' R':''}</Text><Text style={s.small}>{p.nakshatra} P{p.pada}</Text></View><View style={{alignItems:'flex-end'}}><Text style={s.white}>{p.rashi} {p.degreesInRashi.toFixed(2)}°</Text><Text style={s.small}>H{p.house} · D9 {p.navamsa}</Text></View></View>)}</Card>
    <Card><Text style={s.gold}>CALCULATION STANDARD</Text><Text style={s.muted}>{chart.ephemeris} · Lahiri/IAE true ayanamsha · mean nodes · whole-sign houses.</Text><Text style={s.small}>Ayanamsha {chart.ayanamsaDegrees.toFixed(6)}° · {chart.utc}</Text></Card>
    <Text style={s.disc}>{t.disc}</Text>
  </ScrollView>
}

const Shell=({children}:{children:React.ReactNode})=><SafeAreaView edges={['left','right','bottom']} style={s.safe}><StatusBar barStyle="light-content" backgroundColor="#080511" translucent={false}/>{children}</SafeAreaView>;
const Lang=({l,setL}:{l:L;setL:(x:L)=>void})=><View style={s.lang}>{(['en','hi','or']as L[]).map(x=><Pressable key={x} hitSlop={10} onPress={()=>setL(x)} style={[s.langBtn,l===x&&s.langOn]}><Text style={[s.langText,l===x&&{color:'#251606'}]}>{x==='en'?'EN':x==='hi'?'हिं':'ଓଡ଼ିଆ'}</Text></Pressable>)}</View>;
function Field({label,containerStyle,multiline,...p}:any){return <View style={[s.fieldWrap,containerStyle]}><Text style={s.label}>{label}</Text><TextInput {...p} multiline={multiline} placeholderTextColor="#756b83" selectionColor="#f2d17b" style={[s.input,multiline&&s.inputMulti]}/></View>}
const Btn=({children,onPress,secondary}:any)=><Pressable onPress={onPress} style={({pressed})=>[s.btn,secondary&&s.btn2,pressed&&{opacity:.86}]}><Text style={[s.btnText,secondary&&{color:'#f2d17b'}]}>{children}</Text></Pressable>;
const Tile=({icon,title,onPress,small}:any)=><Pressable onPress={onPress} style={[s.tile,small&&{flex:1,minHeight:110}]}><Text style={s.icon}>{icon}</Text><Text style={s.tileText}>{title}</Text><Text style={s.chev}>›</Text></Pressable>;
const Card=({children}:{children:React.ReactNode})=><View style={s.card}>{children}</View>;
const Back=({t,go}:any)=><Pressable hitSlop={12} onPress={go}><Text style={s.back}>‹ {t.back}</Text></Pressable>;
const Metric=({k,v,x}:any)=><View style={s.metric}><Text style={s.small}>{k}</Text><Text style={s.cardTitle}>{v}</Text><Text style={s.small}>{x}</Text></View>;

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#080511'},
  head:{paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:'#251a34',flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#080511'},
  brandRow:{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1},brandMark:{backgroundColor:'#1a0e2b',borderWidth:1,borderColor:'#77549d',alignItems:'center',justifyContent:'center',shadowColor:'#f2d17b',shadowOpacity:.18,shadowRadius:10,elevation:5},brandRing:{borderWidth:2,borderColor:'#f2d17b',alignItems:'center',justifyContent:'center'},om:{color:'#f2d17b',fontWeight:'900',textAlign:'center'},logo:{color:'#f2d17b',fontWeight:'900',fontSize:18},
  page:{padding:18,paddingBottom:60,gap:13},
  authScroll:{flexGrow:1,justifyContent:'center',paddingHorizontal:22,paddingVertical:30},auth:{width:'100%',maxWidth:520,alignSelf:'center'},logoBig:{color:'#fff8e8',fontSize:42,lineHeight:48,fontWeight:'900',letterSpacing:-1.8,textAlign:'center',marginTop:12},langCenter:{alignItems:'center',marginTop:14},
  formCard:{width:'100%',marginTop:24,borderWidth:1,borderColor:'#342447',backgroundColor:'#100a1a',borderRadius:24,padding:18,gap:14},authTitle:{color:'#fff8e8',fontWeight:'900',fontSize:22},
  hero:{height:310,borderWidth:1,borderColor:'#4a3164',borderRadius:28,overflow:'hidden',backgroundColor:'#120c20'},heroArt:{position:'absolute',width:'100%',height:'100%',resizeMode:'cover'},heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(8,5,17,.52)'},heroContent:{flex:1,justifyContent:'flex-end',padding:22},
  kicker:{color:'#f2d17b',fontWeight:'900',fontSize:11,letterSpacing:1.2},heroTitle:{color:'#fff8e8',fontSize:38,lineHeight:41,fontWeight:'900',letterSpacing:-1.5,marginVertical:8},mutedLight:{color:'#ddd2e7',lineHeight:20},title:{color:'#fff8e8',fontSize:31,fontWeight:'900',letterSpacing:-1},
  row:{flexDirection:'row',gap:11,alignItems:'flex-start'},tile:{borderWidth:1,borderColor:'#36264a',backgroundColor:'#110b1b',borderRadius:20,padding:17,flexDirection:'row',alignItems:'center',gap:12},icon:{fontSize:26,color:'#f2d17b'},tileText:{color:'#fff8e8',fontWeight:'800',flex:1},chev:{fontSize:27,color:'#6f617d'},
  lang:{flexDirection:'row',gap:6,alignItems:'center'},langBtn:{borderWidth:1,borderColor:'#4a315e',paddingHorizontal:10,paddingVertical:7,borderRadius:999,minHeight:36,justifyContent:'center'},langOn:{backgroundColor:'#f2d17b',borderColor:'#f2d17b'},langText:{color:'#c7bbd0',fontSize:11,fontWeight:'900'},
  fieldWrap:{width:'100%',minWidth:0},flexField:{flex:1,width:undefined},label:{color:'#b7a9c3',fontSize:11,fontWeight:'800',marginBottom:7,textTransform:'uppercase'},input:{width:'100%',height:56,borderWidth:1,borderColor:'#48325f',borderRadius:15,backgroundColor:'#0b0712',color:'#fff8e8',paddingHorizontal:15,fontSize:16},inputMulti:{height:100,minHeight:100,paddingTop:14,textAlignVertical:'top'},
  btn:{width:'100%',minHeight:56,borderRadius:16,backgroundColor:'#f2d17b',alignItems:'center',justifyContent:'center',paddingHorizontal:16,paddingVertical:12,marginTop:2},btn2:{backgroundColor:'#161021',borderWidth:1,borderColor:'#57406e'},btnText:{fontWeight:'900',fontSize:16,color:'#241606'},link:{color:'#ceb4e8',textAlign:'center',paddingVertical:17,fontWeight:'800',fontSize:16},
  googleBtn:{height:56,borderRadius:16,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},googleG:{fontWeight:'900',fontSize:20,color:'#4285F4'},googleText:{fontWeight:'800',fontSize:15,color:'#222'},orLine:{flexDirection:'row',alignItems:'center',gap:10},line:{height:1,backgroundColor:'#352640',flex:1},
  card:{borderWidth:1,borderColor:'#36264a',borderRadius:20,backgroundColor:'#110b1b',padding:17,gap:8},cardTitle:{color:'#fff8e8',fontSize:17,fontWeight:'800'},gold:{color:'#f2d17b',fontWeight:'900',fontSize:12,lineHeight:18},white:{color:'#fff8e8',fontWeight:'700'},muted:{color:'#a096ac',lineHeight:20},small:{color:'#786e85',fontSize:11,lineHeight:16},
  planet:{flexDirection:'row',justifyContent:'space-between',paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#21172e'},metric:{flex:1,minHeight:118,borderWidth:1,borderColor:'#302142',backgroundColor:'#110b1b',borderRadius:19,padding:14,gap:6},price:{color:'#f2d17b',fontWeight:'900',fontSize:45},good:{color:'#89e5a7',fontSize:22,fontWeight:'900'},count:{color:'#f2d17b',fontSize:36,fontWeight:'900',letterSpacing:2},
  qrWrap:{alignItems:'center',padding:12,borderRadius:18,backgroundColor:'#fff'},qr:{width:250,height:250,resizeMode:'contain',maxWidth:'100%'},stopCard:{borderWidth:1,borderColor:'#8b2929',backgroundColor:'#1d090c',borderRadius:20,padding:18,gap:8},stopTitle:{color:'#ff655f',fontSize:22,fontWeight:'900'},stopMessage:{color:'#ffd9d6',fontSize:15,lineHeight:22},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{borderWidth:1,borderColor:'#362449',backgroundColor:'#171021',borderRadius:999,paddingHorizontal:11,paddingVertical:8},chipText:{color:'#c9b7dc',fontSize:11,fontWeight:'700'},back:{color:'#c5afdc',fontWeight:'700'},disc:{color:'#665d71',fontSize:10,lineHeight:16,textAlign:'center',marginTop:8}
});

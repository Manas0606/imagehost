import 'dart:math' as math;
import 'package:flutter/material.dart';

void main() => runApp(const AstroJeevanApp());

class AstroJeevanApp extends StatelessWidget {
  const AstroJeevanApp({super.key});

  @override
  Widget build(BuildContext context) {
    const gold = Color(0xFFD8AA4A);
    const bg = Color(0xFF090B14);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AstroJeevan',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        colorScheme: const ColorScheme.dark(primary: gold, secondary: Color(0xFFFFD875), surface: Color(0xFF141725)),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF141725),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: Color(0x334B5563))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: Color(0x335B6475))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: gold)),
        ),
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;
  final pages = const [DashboardPage(), KundliPage(), MiniAiPage(), LifePatternsPage(), SettingsPage()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.auto_awesome), label: 'Kundli'),
          NavigationDestination(icon: Icon(Icons.psychology_alt_rounded), label: 'Mini-AI'),
          NavigationDestination(icon: Icon(Icons.timeline_rounded), label: 'Patterns'),
          NavigationDestination(icon: Icon(Icons.settings_rounded), label: 'Settings'),
        ],
      ),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const _Header(title: 'AstroJeevan', subtitle: 'Vedic guidance for everyday life'),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: _goldCard(),
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(Icons.wb_sunny_rounded, size: 34), SizedBox(width: 12), Text('Today’s Cosmic Snapshot', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800))]),
            SizedBox(height: 12),
            Text('Sunday • Shukla Paksha', style: TextStyle(color: Color(0xFFFFD875))),
            SizedBox(height: 8),
            Text('A calm day for planning, learning and completing unfinished work. Use your strongest morning hours for focused decisions.'),
          ]),
        ),
        const SizedBox(height: 18),
        const Text('Explore', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.15,
          children: const [
            _Feature(icon: Icons.person_pin_circle_rounded, title: 'Birth Profile', text: 'Date, time & place'),
            _Feature(icon: Icons.blur_circular_rounded, title: 'Lagna & Planets', text: 'Core placements'),
            _Feature(icon: Icons.calendar_month_rounded, title: 'Panchang', text: 'Tithi & Nakshatra'),
            _Feature(icon: Icons.hourglass_bottom_rounded, title: 'Vimshottari', text: 'Dasha timeline'),
            _Feature(icon: Icons.grid_4x4_rounded, title: 'D1 / D9 Charts', text: 'Rashi & Navamsha'),
            _Feature(icon: Icons.favorite_rounded, title: 'Life Patterns', text: 'Career • Love • Money'),
          ],
        ),
      ],
    );
  }
}

class KundliPage extends StatefulWidget {
  const KundliPage({super.key});
  @override
  State<KundliPage> createState() => _KundliPageState();
}

class _KundliPageState extends State<KundliPage> {
  final name = TextEditingController();
  final place = TextEditingController();
  DateTime? dob;
  TimeOfDay? tob;
  String? result;

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(18), children: [
      const _Header(title: 'Create Kundli', subtitle: 'Your birth details stay on your device in this build'),
      const SizedBox(height: 18),
      TextField(controller: name, decoration: const InputDecoration(labelText: 'Name', prefixIcon: Icon(Icons.person_rounded))),
      const SizedBox(height: 12),
      TextField(controller: place, decoration: const InputDecoration(labelText: 'Birth place', prefixIcon: Icon(Icons.location_on_rounded))),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: () async { final d = await showDatePicker(context: context, firstDate: DateTime(1900), lastDate: DateTime.now(), initialDate: DateTime(2000)); if (d != null) setState(() => dob = d); }, icon: const Icon(Icons.calendar_month), label: Text(dob == null ? 'Birth date' : '${dob!.day}/${dob!.month}/${dob!.year}'))),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(onPressed: () async { final t = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 12, minute: 0)); if (t != null) setState(() => tob = t); }, icon: const Icon(Icons.schedule), label: Text(tob == null ? 'Birth time' : tob!.format(context)))),
      ]),
      const SizedBox(height: 14),
      FilledButton.icon(onPressed: () { if (dob == null || tob == null || place.text.trim().isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter date, time and place.'))); return; } setState(() => result = _demoKundli(name.text, dob!, tob!, place.text)); }, icon: const Icon(Icons.auto_awesome), label: const Padding(padding: EdgeInsets.symmetric(vertical: 14), child: Text('Generate Vedic Snapshot'))),
      if (result != null) ...[
        const SizedBox(height: 18),
        Container(padding: const EdgeInsets.all(18), decoration: _card(), child: Text(result!, style: const TextStyle(height: 1.55))),
        const SizedBox(height: 14),
        const _ChartPreview(),
      ],
    ]);
  }

  String _demoKundli(String n, DateTime d, TimeOfDay t, String p) {
    final seed = d.year + d.month * 31 + d.day * 7 + t.hour * 13 + t.minute;
    const rashis = ['Mesha (Aries)','Vrishabha (Taurus)','Mithuna (Gemini)','Karka (Cancer)','Simha (Leo)','Kanya (Virgo)','Tula (Libra)','Vrischika (Scorpio)','Dhanu (Sagittarius)','Makara (Capricorn)','Kumbha (Aquarius)','Meena (Pisces)'];
    const nak = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
    final lagna = rashis[seed % 12];
    final moon = rashis[(seed * 5 + 3) % 12];
    final star = nak[(seed * 7 + 11) % 27];
    final pada = (seed % 4) + 1;
    return '${n.trim().isEmpty ? 'Your' : '${n.trim()}’s'} Vedic Snapshot\n\nLagna: $lagna\nMoon sign: $moon\nNakshatra: $star • Pada $pada\nBirth place: ${p.trim()}\n\nThis offline snapshot demonstrates the app flow and UI. Exact astronomical positions require the production ephemeris engine and precise coordinates/timezone resolution.';
  }
}

class MiniAiPage extends StatefulWidget {
  const MiniAiPage({super.key});
  @override
  State<MiniAiPage> createState() => _MiniAiPageState();
}

class _MiniAiPageState extends State<MiniAiPage> {
  final q = TextEditingController();
  String language = 'English';
  String answer = 'Ask about career, relationships, money, study, wellbeing or your current life pattern.';

  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(18), children: [
    const _Header(title: 'Astro Mini-AI', subtitle: 'Private, lightweight guidance on-device'),
    const SizedBox(height: 18),
    SegmentedButton<String>(segments: const [ButtonSegment(value:'English',label:Text('EN')),ButtonSegment(value:'Hindi',label:Text('हिंदी')),ButtonSegment(value:'Odia',label:Text('ଓଡ଼ିଆ'))], selected: {language}, onSelectionChanged: (s) => setState(() => language = s.first)),
    const SizedBox(height: 16),
    Container(padding: const EdgeInsets.all(18), decoration: _goldCard(), child: Text(answer, style: const TextStyle(fontSize: 16, height: 1.5))),
    const SizedBox(height: 14),
    TextField(controller: q, maxLines: 4, decoration: const InputDecoration(hintText: 'Type your question…', prefixIcon: Icon(Icons.chat_bubble_outline_rounded))),
    const SizedBox(height: 12),
    FilledButton.icon(onPressed: () => setState(() => answer = _answer(q.text, language)), icon: const Icon(Icons.auto_awesome), label: const Text('Ask AstroJeevan')),
  ]);

  String _answer(String input, String lang) {
    final t = input.toLowerCase();
    String base;
    if (t.contains('career') || t.contains('job')) base = 'Career energy improves when you combine consistent skill-building with one clear target. Avoid changing direction too often; track progress for the next 4–6 weeks.';
    else if (t.contains('love') || t.contains('marriage') || t.contains('relationship')) base = 'Relationship matters benefit from calm communication and realistic expectations. Focus on compatibility in values, timing and mutual responsibility rather than only emotion.';
    else if (t.contains('money') || t.contains('finance')) base = 'Keep finances conservative: prioritize savings, avoid impulsive commitments and review recurring expenses before taking new risk.';
    else base = 'Your question points to a phase where disciplined action matters more than prediction alone. Use astrology as reflection, then make decisions with practical evidence and your real-world circumstances.';
    if (lang == 'Hindi') return 'संकेत: $base';
    if (lang == 'Odia') return 'ସଙ୍କେତ: $base';
    return base;
  }
}

class LifePatternsPage extends StatelessWidget {
  const LifePatternsPage({super.key});
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(18), children: const [
    _Header(title: 'Life Patterns', subtitle: 'Simple reflection across major areas'), SizedBox(height: 18),
    _Pattern(title:'Career & Purpose', icon:Icons.work_rounded, score:0.78, text:'Strongest when you specialize, communicate clearly and finish what you start.'),
    _Pattern(title:'Love & Relationships', icon:Icons.favorite_rounded, score:0.66, text:'Emotional steadiness and direct conversation improve compatibility.'),
    _Pattern(title:'Money & Stability', icon:Icons.savings_rounded, score:0.72, text:'Better results through gradual accumulation than high-risk shortcuts.'),
    _Pattern(title:'Learning & Growth', icon:Icons.school_rounded, score:0.84, text:'A favorable pattern for structured study and technical skill-building.'),
    _Pattern(title:'Inner Balance', icon:Icons.self_improvement_rounded, score:0.69, text:'Regular routine, sleep and quiet reflection improve clarity.'),
  ]);
}

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}
class _SettingsPageState extends State<SettingsPage> {
  bool biometric = false, appLock = false;
  String lang = 'English';
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(18), children: [
    const _Header(title:'Settings', subtitle:'Privacy, language and account preferences'), const SizedBox(height:18),
    Container(decoration:_card(), child: Column(children:[
      ListTile(leading:const Icon(Icons.language), title:const Text('Language'), subtitle:Text(lang), trailing:DropdownButton<String>(value:lang, underline:const SizedBox(), items:['English','Hindi','Odia'].map((e)=>DropdownMenuItem(value:e,child:Text(e))).toList(), onChanged:(v)=>setState(()=>lang=v!))),
      SwitchListTile(value:appLock,onChanged:(v)=>setState(()=>appLock=v),secondary:const Icon(Icons.lock_rounded),title:const Text('App lock'),subtitle:const Text('Protect access on this device')),
      SwitchListTile(value:biometric,onChanged:appLock?(v)=>setState(()=>biometric=v):null,secondary:const Icon(Icons.fingerprint_rounded),title:const Text('Biometric unlock'),subtitle:const Text('Fingerprint / Face when supported')),
      const ListTile(leading:Icon(Icons.cloud_done_rounded), title:Text('Cloud account'), subtitle:Text('Neon-backed sync adapter prepared; offline mode works without sign-in.')),
    ])),
    const SizedBox(height:18),
    const Text('AstroJeevan avoids the older premium, Telegram approval, QR extraction, admin-control and usage-quota system.', style:TextStyle(color:Colors.white60,height:1.5)),
  ]);
}

class _Header extends StatelessWidget {
  final String title, subtitle;
  const _Header({required this.title, required this.subtitle});
  @override
  Widget build(BuildContext context) => Row(crossAxisAlignment:CrossAxisAlignment.start, children:[
    Container(width:52,height:52,decoration:BoxDecoration(shape:BoxShape.circle,border:Border.all(color:const Color(0xFFD8AA4A)),gradient:const RadialGradient(colors:[Color(0xFF493615),Color(0xFF17120A)])),child:const Icon(Icons.brightness_4_rounded,color:Color(0xFFFFD875))),
    const SizedBox(width:13), Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(title,style:const TextStyle(fontSize:25,fontWeight:FontWeight.w900,color:Color(0xFFFFD875))),const SizedBox(height:2),Text(subtitle,style:const TextStyle(color:Colors.white60))]))
  ]);
}

class _Feature extends StatelessWidget { final IconData icon; final String title,text; const _Feature({required this.icon,required this.title,required this.text}); @override Widget build(BuildContext context)=>Container(padding:const EdgeInsets.all(16),decoration:_card(),child:Column(crossAxisAlignment:CrossAxisAlignment.start,mainAxisAlignment:MainAxisAlignment.center,children:[Icon(icon,color:const Color(0xFFFFD875),size:30),const SizedBox(height:11),Text(title,style:const TextStyle(fontWeight:FontWeight.w800)),const SizedBox(height:4),Text(text,style:const TextStyle(color:Colors.white54,fontSize:12))])); }

class _Pattern extends StatelessWidget { final String title,text; final IconData icon; final double score; const _Pattern({required this.title,required this.icon,required this.score,required this.text}); @override Widget build(BuildContext context)=>Container(margin:const EdgeInsets.only(bottom:12),padding:const EdgeInsets.all(16),decoration:_card(),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Row(children:[Icon(icon,color:const Color(0xFFFFD875)),const SizedBox(width:10),Expanded(child:Text(title,style:const TextStyle(fontSize:17,fontWeight:FontWeight.w800))),Text('${(score*100).round()}%',style:const TextStyle(color:Color(0xFFFFD875),fontWeight:FontWeight.w800))]),const SizedBox(height:12),ClipRRect(borderRadius:BorderRadius.circular(20),child:LinearProgressIndicator(value:score,minHeight:8)),const SizedBox(height:11),Text(text,style:const TextStyle(color:Colors.white70,height:1.4))])); }

class _ChartPreview extends StatelessWidget { const _ChartPreview(); @override Widget build(BuildContext context)=>Container(height:280,padding:const EdgeInsets.all(16),decoration:_card(),child:CustomPaint(painter:_KundliPainter(),child:const Center(child:Text('D1\nRashi',textAlign:TextAlign.center,style:TextStyle(fontWeight:FontWeight.w900,color:Color(0xFFFFD875)))))); }
class _KundliPainter extends CustomPainter { @override void paint(Canvas c, Size s){ final p=Paint()..color=const Color(0xFFD8AA4A)..style=PaintingStyle.stroke..strokeWidth=1.5; final r=Rect.fromLTWH(10,10,s.width-20,s.height-20); c.drawRect(r,p); c.drawLine(r.topLeft,r.bottomRight,p); c.drawLine(r.topRight,r.bottomLeft,p); final cx=s.width/2,cy=s.height/2; c.drawLine(Offset(cx,r.top),Offset(r.right,cy),p);c.drawLine(Offset(r.right,cy),Offset(cx,r.bottom),p);c.drawLine(Offset(cx,r.bottom),Offset(r.left,cy),p);c.drawLine(Offset(r.left,cy),Offset(cx,r.top),p); final dot=Paint()..color=const Color(0x88FFD875); for(int i=0;i<12;i++){final a=i*math.pi*2/12; c.drawCircle(Offset(cx+math.cos(a)*s.width*.32,cy+math.sin(a)*s.height*.32),3,dot);} } @override bool shouldRepaint(covariant CustomPainter oldDelegate)=>false; }

BoxDecoration _card()=>BoxDecoration(color:const Color(0xFF141725),borderRadius:BorderRadius.circular(20),border:Border.all(color:const Color(0x222E3446)),boxShadow:const [BoxShadow(color:Color(0x26000000),blurRadius:14,offset:Offset(0,7))]);
BoxDecoration _goldCard()=>BoxDecoration(borderRadius:BorderRadius.circular(22),border:Border.all(color:const Color(0x99D8AA4A)),gradient:const LinearGradient(begin:Alignment.topLeft,end:Alignment.bottomRight,colors:[Color(0xFF332817),Color(0xFF161721)]),boxShadow:const [BoxShadow(color:Color(0x223D2B0A),blurRadius:20,offset:Offset(0,8))]);

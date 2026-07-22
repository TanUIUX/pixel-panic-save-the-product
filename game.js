'use strict';
/* ============================================================
   PIXEL PANIC — Save the Product
   Self-contained playable web game (HTML5 canvas + DOM overlay).
   ============================================================ */

/* ---------- tiny DOM helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
function el(tag, attrs={}, kids=[]) {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k === 'text') n.textContent = attrs[k];
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(n.style, attrs[k]);
    else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
  }
  (Array.isArray(kids)?kids:[kids]).forEach(c => { if (c==null) return; n.appendChild(typeof c==='string'?document.createTextNode(c):c); });
  return n;
}
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rint = (a,b)=>Math.floor(a+Math.random()*(b-a+1));

/* ---------- character definitions ---------- */
const CHARS = {
  mira:  { name:'Mira Vale', role:'Mission Director', c1:'#8a5cff', c2:'#141633', hair:'#2a2440', accent:'#b18cff' },
  patch: { name:'Patch', role:'Companion Drone', c1:'#38e6ff', c2:'#0a6b7d', accent:'#ffb454' },
  modal: { name:'M.O.D.A.L', role:'Optimization Layer', c1:'#ff5df0', c2:'#3a0d3a', accent:'#ff5d6c' },
  ava:   { name:'Ava Lin', role:'Product Analyst', c1:'#ffb454', c2:'#3a2a10', accent:'#ffd08a' },
  eli:   { name:'Eli Forge', role:'Engineering Lead', c1:'#38e6c8', c2:'#0d3a34', accent:'#7affe6' },
  nia:   { name:'Nia Sol', role:'Accessibility Lead', c1:'#38a9ff', c2:'#0d2a4a', accent:'#8ac9ff' },
  dana:  { name:'Dana Kross', role:'Growth Marketing', c1:'#ff8a5c', c2:'#3a1c10', accent:'#ffb08a' },
  vera:  { name:'Vera Clause', role:'Compliance', c1:'#9c8cff', c2:'#241f45', accent:'#c4b8ff' },
  milo:  { name:'Milo Cart', role:'Conversion', c1:'#5cff9c', c2:'#0d3a24', accent:'#a8ffcf' },
  rex:   { name:'Rex Vale', role:'Monetization', c1:'#ff5d6c', c2:'#3a1016', accent:'#ff9aa4' },
  rowan: { name:'Rowan Transit', role:'Operations', c1:'#c8a24a', c2:'#3a2e10', accent:'#e6cf8a' },
};

/* Draw a geometric sci-fi portrait for a character into a container element. */
function portraitSVG(key, expr) {
  const c = CHARS[key] || CHARS.mira;
  if (key === 'patch') {
    return `<svg viewBox='0 0 100 100' width='100%' height='100%' preserveAspectRatio='xMidYMid slice'>
      <defs><radialGradient id='pg' cx='50%' cy='40%'><stop offset='0' stop-color='${c.c1}'/><stop offset='1' stop-color='${c.c2}'/></radialGradient></defs>
      <rect width='100' height='100' fill='#0a1320'/>
      <g transform='rotate(45 50 52)'><rect x='30' y='32' width='40' height='40' rx='10' fill='url(#pg)' stroke='#fff' stroke-opacity='.3'/></g>
      <circle cx='50' cy='52' r='11' fill='#06111c'/><circle cx='50' cy='52' r='6' fill='#fff'/>
      <circle cx='52' cy='50' r='2.5' fill='${c.c1}'/>
    </svg>`;
  }
  if (key === 'modal') {
    return `<svg viewBox='0 0 100 100' width='100%' height='100%' preserveAspectRatio='xMidYMid slice'>
      <rect width='100' height='100' fill='#160820'/>
      <g fill='none' stroke='${c.c1}' stroke-width='2'>
        <circle cx='50' cy='50' r='34' stroke-opacity='.5'/>
        <circle cx='52' cy='48' r='24' stroke='${c.accent}' stroke-opacity='.7'/>
        <circle cx='48' cy='52' r='14'/>
      </g>
      <circle cx='50' cy='50' r='6' fill='#fff'/><circle cx='50' cy='50' r='3' fill='${c.c1}'/>
    </svg>`;
  }
  // humanoid geometric portrait
  const mouth = expr==='victory'||expr==='proud'||expr==='confident' ? "M40 74 Q50 82 60 74" :
                expr==='concerned'||expr==='alert'||expr==='warning' ? "M40 78 Q50 72 60 78" : "M42 76 H58";
  const brow = expr==='alert'||expr==='concerned' ? "M36 52 L46 55 M64 52 L54 55" : "M36 54 H46 M54 54 H64";
  return `<svg viewBox='0 0 100 100' width='100%' height='100%' preserveAspectRatio='xMidYMid slice'>
    <defs><linearGradient id='bg${key}' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c.c2}'/><stop offset='1' stop-color='#0a0a15'/></linearGradient></defs>
    <rect width='100' height='100' fill='url(#bg${key})'/>
    <path d='M18 100 Q18 74 50 74 Q82 74 82 100 Z' fill='${c.c1}' fill-opacity='.9'/>
    <path d='M50 74 L50 100' stroke='${c.c2}' stroke-width='1.5' stroke-opacity='.5'/>
    <circle cx='50' cy='46' r='22' fill='#e9d9c9'/>
    <path d='M28 42 Q30 20 50 20 Q70 20 72 42 Q72 30 50 30 Q30 30 28 46 Z' fill='${c.hair||c.c2}'/>
    <path d='${brow}' stroke='#3a3040' stroke-width='2' fill='none' stroke-linecap='round'/>
    <circle cx='42' cy='60' r='3' fill='#2a2440'/><circle cx='58' cy='60' r='3' fill='#2a2440'/>
    <path d='${mouth}' stroke='#a05a5a' stroke-width='2.4' fill='none' stroke-linecap='round'/>
    <polygon points='40,74 46,90 34,90' fill='${c.accent}' fill-opacity='.85'/>
  </svg>`;
}
function portraitEl(key, expr='neutral', big=false) {
  return el('div', { class:'portrait'+(big?' lg':''), html:`<div class='face'>${portraitSVG(key,expr)}</div>`, title:(CHARS[key]||{}).name });
}
function avatarSVG(idx) {
  const cols=['#8a5cff','#38e6ff','#46e089','#ffb454','#ff5d6c','#ff5df0'];
  const c=cols[idx%6];
  return `<svg viewBox='0 0 100 100' width='100%' height='100%' preserveAspectRatio='xMidYMid slice'>
    <rect width='100' height='100' fill='#0c1022'/>
    <path d='M20 100 Q20 70 50 70 Q80 70 80 100 Z' fill='${c}'/>
    <rect x='38' y='60' width='24' height='16' fill='${c}' fill-opacity='.6'/>
    <circle cx='50' cy='42' r='20' fill='#11162e' stroke='${c}' stroke-width='3'/>
    <path d='M36 40 Q50 30 64 40' stroke='${c}' stroke-width='3' fill='none'/>
    <circle cx='44' cy='44' r='2.6' fill='${c}'/><circle cx='56' cy='44' r='2.6' fill='${c}'/>
    <rect x='46' y='16' width='8' height='10' rx='3' fill='${c}'/>
  </svg>`;
}
function avatarEl(idx, big){ return el('div',{class:'portrait'+(big?' lg':''), html:`<div class='face'>${avatarSVG(idx)}</div>`}); }

/* ---------- save system (localStorage) ---------- */
const SAVE_KEY = 'pixel_panic_save_v2';
function defaultProgress(){
  return { missions:{}, xp:0, achievements:[], fragments:[], expertUnlocked:false, endingSeen:false, lastRoute:null };
}
function defaultSave(){
  return {
    profile:null, // {avatar,name,difficulty,guest,account}
    progress: defaultProgress(),
    settings:{ master:true, music:true, sfx:true, reducedMotion:false, relaxedTimer:false, language:'vi' },
  };
}
let SAVE = defaultSave();
function loadSave(){
  try{ const raw=localStorage.getItem(SAVE_KEY); if(raw){ SAVE = Object.assign(defaultSave(), JSON.parse(raw)); SAVE.progress=Object.assign(defaultProgress(),SAVE.progress); } }catch(e){}
}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); }catch(e){} flashSaveIcon(); }
function hasSave(){ return !!(SAVE.profile && Object.keys(SAVE.progress.missions).length>0); }

/* ---------- progression helpers ---------- */
const RANKS = ['Pixel Intern','Interface Scout','UI Fixer','UX Investigator','Product Rescuer','Design Guardian','UX Master'];
function rankFor(xp){
  const t=[0,300,700,1200,1900,2800,4000]; let r=0; for(let i=0;i<t.length;i++){ if(xp>=t[i]) r=i; } return RANKS[r];
}
function rankNext(xp){
  const t=[0,300,700,1200,1900,2800,4000]; for(let i=0;i<t.length;i++){ if(xp<t[i]) return {need:t[i], name:RANKS[i]}; } return null;
}
function gradeFor(score){ return score>=900?'S':score>=800?'A':score>=700?'B':score>=600?'C':'D'; }
function gradeColor(g){ return g==='S'?'#ffd45c':g==='A'?'#46e089':g==='B'?'#38e6ff':g==='C'?'#ffb454':'#ff5d6c'; }

/* ============================================================
   CANVAS SCENE ENGINE — animated backgrounds per screen/district
   ============================================================ */
const SceneFX = (()=>{
  const cv = $('#scene-canvas'); const ctx = cv.getContext('2d');
  let W=0,H=0,dpr=1, particles=[], t=0, raf=0, theme=null, corruption=0.4;
  const THEMES = {
    boot:   { a:'#0a0a15', b:'#12142a', accent:'#38e6ff', kind:'grid' },
    menu:   { a:'#0a0a18', b:'#1a1038', accent:'#8a5cff', kind:'grid' },
    hub:    { a:'#080a18', b:'#101a30', accent:'#38e6ff', kind:'grid' },
    map:    { a:'#08060f', b:'#1a0e2a', accent:'#8a5cff', kind:'stars' },
    m1:     { a:'#0d0620', b:'#2a1050', accent:'#b18cff', kind:'beams' },   // streaming
    m2:     { a:'#06101a', b:'#0d2440', accent:'#38a9ff', kind:'grid' },    // finance
    m3:     { a:'#0a0a06', b:'#242010', accent:'#ffb454', kind:'belt' },    // commerce
    m4:     { a:'#12060f', b:'#2a0d24', accent:'#ff5df0', kind:'neon' },    // subscription
    m5:     { a:'#06101a', b:'#0d2a3a', accent:'#38e6c8', kind:'rails' },   // civic
    m6:     { a:'#100612', b:'#2a0a2a', accent:'#ff5df0', kind:'storm' },   // boss
    ending: { a:'#06120c', b:'#0d3a24', accent:'#46e089', kind:'stars' },
  };
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth; H=cv.clientHeight;
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  function set(name, corr=0.4){
    theme = THEMES[name] || THEMES.menu; corruption=corr;
    particles=[];
    const n = theme.kind==='stars'?90 : theme.kind==='storm'?60 : 40;
    for(let i=0;i<n;i++) particles.push({x:Math.random(),y:Math.random(),s:Math.random()*2+0.5,v:Math.random()*0.4+0.1,p:Math.random()*6});
  }
  function draw(){
    if(!theme){ raf=requestAnimationFrame(draw); return; }
    t+=0.016;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,theme.a); g.addColorStop(1,theme.b);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const reduced = document.body.classList.contains('reduced-motion');
    const tt = reduced?0:t;
    ctx.save();
    if(theme.kind==='grid'||theme.kind==='beams'){
      ctx.strokeStyle=theme.accent; ctx.globalAlpha=0.10; ctx.lineWidth=1;
      const cx=W/2, cy=H*0.5, step=Math.max(40,W/18);
      for(let x=cx%step;x<W;x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for(let y=(cy+ (tt*14)%step)%step;y<H;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      ctx.globalAlpha=1;
    }
    if(theme.kind==='belt'||theme.kind==='rails'){
      ctx.strokeStyle=theme.accent; ctx.globalAlpha=0.14; ctx.lineWidth=2;
      for(let i=0;i<6;i++){ const y=H*(0.2+i*0.13); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y+30); ctx.stroke(); }
      ctx.globalAlpha=1;
    }
    if(theme.kind==='neon'||theme.kind==='storm'){
      for(let i=0;i<5;i++){ ctx.globalAlpha=0.06; ctx.fillStyle= i%2?theme.accent:'#ff5d6c';
        const rw=W*0.3, x=((tt*20*(i%2?1:-1))+i*260)%(W+rw)-rw*0.5;
        ctx.fillRect(x, H*0.1+i*H*0.16, rw, 26); }
      ctx.globalAlpha=1;
    }
    // particles (data motes)
    for(const p of particles){
      p.y -= p.v*0.0016*(reduced?0:1);
      if(p.y<-0.02){ p.y=1.02; p.x=Math.random(); }
      const px=p.x*W, py=p.y*H, tw=0.4+0.6*Math.abs(Math.sin(tt+p.p));
      ctx.globalAlpha=0.5*tw; ctx.fillStyle=theme.accent;
      ctx.beginPath(); ctx.arc(px,py,p.s,0,7); ctx.fill();
    }
    ctx.globalAlpha=1;
    // corruption haze in corners for missions
    if(corruption>0){
      const rg=ctx.createRadialGradient(W,H,10,W,H,Math.max(W,H)*0.9);
      rg.addColorStop(0,`rgba(255,93,108,${0.05+corruption*0.12})`); rg.addColorStop(1,'rgba(255,93,108,0)');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const rg2=ctx.createRadialGradient(0,0,10,0,0,Math.max(W,H)*0.7);
      rg2.addColorStop(0,`rgba(255,93,240,${0.04+corruption*0.08})`); rg2.addColorStop(1,'rgba(255,93,240,0)');
      ctx.fillStyle=rg2; ctx.fillRect(0,0,W,H);
    }
    ctx.restore();
    raf=requestAnimationFrame(draw);
  }
  resize(); set('boot'); draw();
  return { set, resize, setCorruption:(c)=>{corruption=c;} };
})();

/* ============================================================
   MISSION DATA (data-driven, not hard-coded in UI)
   ============================================================ */
const MISSIONS = [
{
  id:'m1', chapter:1, theme:'m1', title:'The Invisible CTA', district:'Streaming District', product:'Nebula Play',
  boss:false, skill:'Visual Hierarchy', targetTime:360, integrity:{initial:100,failAt:0}, corruption:{initial:85,winBelow:30},
  characters:['mira','patch','ava','dana','modal'],
  brief:{ segment:'Casual viewers browsing tối thứ Sáu', metrics:'Play rate ↓ 38% · Upgrade clicks ↑ (do nhầm)', goal:'Tăng lượt xem nội dung', objective:'Khôi phục hành động xem phim', secondary:'Giữ Upgrade đúng ngữ cảnh', reward:'CTA Specialist Badge' },
  beforeState:'5 nút cùng độ nổi bật, Play mờ, Upgrade lấn át. Người dùng bấm nhầm Upgrade.',
  afterState:'Play là nút chính, các hành động phụ rõ ràng, Upgrade chỉ nổi khi nội dung bị khóa.',
  storyFragment:'Fragment 1 — "Clarity": Một hành động chính rõ ràng đáng giá hơn năm hành động mờ nhạt.',
  rounds:[
    { id:'r1', title:'Scan the Screen', mechanic:'spot-issue', objective:'Tìm ít nhất 5 vấn đề', instruction:'Quét màn hình Nebula Play và đánh dấu các thành phần đang có vấn đề về hệ thống thị giác.', required:5, corruptionCut:8,
      objects:[
        {id:'play',label:'Play button',desc:'Tương phản rất thấp',isIssue:true,sev:'critical'},
        {id:'open',label:'Nút "Open"',desc:'Nhãn mơ hồ',isIssue:true,sev:'major'},
        {id:'ctas',label:'5 CTA cùng cấp',desc:'Không có nút chính',isIssue:true,sev:'major'},
        {id:'desc',label:'Mô tả phim',desc:'Quá dài, 8 dòng',isIssue:true,sev:'minor'},
        {id:'meta',label:'Metadata',desc:'Chữ xám khó đọc',isIssue:true,sev:'minor'},
        {id:'focus',label:'Focus state',desc:'Gần như vô hình',isIssue:true,sev:'major'},
        {id:'upg',label:'Upgrade badge',desc:'Sai ngữ cảnh',isIssue:true,sev:'major'},
        {id:'poster',label:'Poster phim',desc:'Hiển thị tốt',isIssue:false},
        {id:'logo',label:'Logo Nebula',desc:'Ổn định',isIssue:false},
        {id:'title',label:'Tên phim',desc:'Rõ ràng',isIssue:false},
      ] },
    { id:'r2', title:'Repair Hierarchy', mechanic:'repair-choice', objective:'Chọn cách sửa hệ thống thị giác', instruction:'Với mỗi thành phần, chọn phương án thiết kế tốt nhất.', corruptionCut:14,
      prompts:[
        { q:'Nút Play nên là gì?', options:[
          {t:'Nút chính (primary), tương phản cao',quality:'good',fb:'Đúng: hành động chính phải rõ nhất.'},
          {t:'Giữ nguyên style ghost mờ',quality:'bad',fb:'Người dùng không thấy được hành động chính.'},
          {t:'Ẩn Play, chỉ hiện khi hover',quality:'bad',fb:'Không dùng được trên mobile/keyboard.'} ]},
        { q:'Trailer & Watchlist nên là?', options:[
          {t:'Hành động phụ (secondary)',quality:'good',fb:'Chuẩn phân cấp.'},
          {t:'Cũng làm primary như Play',quality:'bad',fb:'Lại tạo 3 nút chính.'} ]},
        { q:'Mô tả phim quá dài?', options:[
          {t:'Thu gọn + "Xem thêm"',quality:'good',fb:'Giảm tải nhận thức.'},
          {t:'Giữ nguyên 8 dòng',quality:'bad',fb:'Đẩy Play xuống dưới màn hình.'} ]},
      ] },
    { id:'r3', title:'State-based Writing', mechanic:'ux-writing-match', objective:'Ghép nhãn với trạng thái người dùng', instruction:'Không có một nhãn đúng cho mọi ngữ cảnh. Ghép đúng nhãn cho từng trạng thái.', corruptionCut:12,
      labels:['Watch Now','Continue Watching','Upgrade to Watch'],
      pairs:[ {state:'Người dùng mới',correct:'Watch Now'}, {state:'Người xem quay lại',correct:'Continue Watching'}, {state:'Nội dung bị khóa',correct:'Upgrade to Watch'} ] },
  ],
  stakeholder:{ who:'dana', title:'Stakeholder Encounter — Dana Kross',
    rounds:[
      { line:'Làm Upgrade nổi bật hơn Play đi. Doanh thu cần một chiến thắng.',
        options:[
          {t:'Play là primary khi user có quyền xem; Upgrade primary chỉ khi nội dung bị khóa.',good:true,eff:{trust:8,business:6,sat:6,integrity:0},fb:'Cân bằng: đúng ngữ cảnh cho cả hai.'},
          {t:'Đồng ý, Upgrade luôn là nút chính.',good:false,eff:{trust:-14,business:4,sat:2,integrity:-15},fb:'Người dùng bấm nhầm, mất niềm tin lâu dài.'},
          {t:'Từ chối thẳng, bỏ hẳn Upgrade.',good:false,eff:{trust:2,business:-12,sat:-6,integrity:-4},fb:'Bỏ qua nhu cầu kinh doanh hợp lý.'} ]},
      { line:'Vậy người dùng khóa nội dung thì sao? Tôi vẫn cần doanh thu.',
        options:[
          {t:'Với nội dung khóa: Upgrade là primary + nêu rõ quyền lợi.',good:true,eff:{trust:6,business:8,sat:6,integrity:0},fb:'Doanh thu tăng đúng chỗ.'},
          {t:'Hiện popup Upgrade cho mọi user.',good:false,eff:{trust:-12,business:2,sat:-8,integrity:-12},fb:'Dark pattern, phá trải nghiệm.'} ]},
    ] },
},
{
  id:'m2', chapter:2, theme:'m2', title:'Form From Hell', district:'Finance District', product:'Orbit Wallet',
  boss:false, skill:'Form Design', targetTime:420, integrity:{initial:100,failAt:0}, corruption:{initial:88,winBelow:30},
  characters:['mira','patch','ava','eli','vera'],
  brief:{ segment:'Người dùng mới mở ví lần đầu', metrics:'Bỏ form ↑ 61% · Field trung bình: 14', goal:'Giảm ma sát tạo tài khoản', objective:'Tinh gọn account creation', secondary:'Bảo vệ quyền riêng tư', reward:'Privacy Guardian Badge' },
  beforeState:'14 field trên 1 màn, consent tự tick, income bắt buộc không lý do.',
  afterState:'3 bước rõ ràng, bước đầu ≤5 field, consent opt-in, validation cụ thể.',
  storyFragment:'Fragment 2 — "Trust": Chỉ hỏi điều bạn thực sự cần, đúng lúc cần.',
  rounds:[
    { id:'r1', title:'Field Triage', mechanic:'drag-sort', objective:'Phân loại field', instruction:'Kéo (hoặc dùng phím) mỗi field vào nhóm phù hợp. Bước đầu chỉ nên hỏi tối thiểu.', corruptionCut:12,
      buckets:[{id:'now',label:'Hỏi ngay'},{id:'later',label:'Hỏi sau'},{id:'remove',label:'Bỏ hẳn'}],
      items:[
        {id:'email',label:'Email',correct:'now'},{id:'pass',label:'Mật khẩu',correct:'now'},
        {id:'name',label:'Tên hiển thị',correct:'now'},
        {id:'phone',label:'Số điện thoại',correct:'later'},{id:'addr',label:'Địa chỉ',correct:'later'},
        {id:'income',label:'Thu nhập',correct:'remove'},{id:'referral',label:'Ai giới thiệu bạn?',correct:'remove'},
      ] },
    { id:'r2', title:'Build the Steps', mechanic:'connect-flow', objective:'Sắp xếp các bước', instruction:'Sắp xếp luồng tạo tài khoản theo thứ tự hợp lý nhất.', corruptionCut:14,
      steps:[{id:'account',label:'Account'},{id:'verify',label:'Verify'},{id:'profile',label:'Profile'}], correct:['account','verify','profile'] },
    { id:'r3', title:'Validation Defense', mechanic:'ux-writing-match', objective:'Ghép lỗi cụ thể', instruction:'Ghép thông báo lỗi cụ thể với đúng field. Tránh lỗi chung chung.', corruptionCut:10,
      labels:['Email không đúng định dạng','Mật khẩu cần tối thiểu 8 ký tự','Số thẻ phải đủ 16 chữ số'],
      pairs:[{state:'Field Email',correct:'Email không đúng định dạng'},{state:'Field Mật khẩu',correct:'Mật khẩu cần tối thiểu 8 ký tự'},{state:'Field Số thẻ',correct:'Số thẻ phải đủ 16 chữ số'}] },
    { id:'r4', title:'Consent Trap', mechanic:'spot-issue', objective:'Tìm bẫy consent', instruction:'Tìm các vấn đề về consent và quyền riêng tư.', required:3, corruptionCut:10,
      objects:[
        {id:'mk',label:'Marketing consent tick sẵn',desc:'Opt-out',isIssue:true,sev:'critical'},
        {id:'pv',label:'Giải thích privacy bị giấu',desc:'Ẩn dưới link nhỏ',isIssue:true,sev:'major'},
        {id:'inc',label:'Income bắt buộc',desc:'Không nêu lý do',isIssue:true,sev:'major'},
        {id:'opt',label:'Field optional không ghi rõ',desc:'Người dùng tưởng bắt buộc',isIssue:true,sev:'minor'},
        {id:'tos',label:'Link điều khoản',desc:'Hiển thị bình thường',isIssue:false},
        {id:'sub',label:'Nút Submit',desc:'Rõ ràng',isIssue:false},
      ] },
  ],
  stakeholder:{ who:'vera', title:'Stakeholder Encounter — Vera Clause',
    rounds:[
      { line:'Compliance muốn mọi field hoàn tất trước khi tài khoản tồn tại.',
        options:[
          {t:'Phân biệt: legal bắt buộc vs. business mong muốn vs. optional. Chỉ giữ legal ở bước đầu.',good:true,eff:{trust:8,business:5,sat:6,integrity:0},fb:'Đúng luật mà vẫn ít ma sát.'},
          {t:'OK, bắt buộc tất cả 14 field.',good:false,eff:{trust:-12,business:-6,sat:-10,integrity:-16},fb:'Tỷ lệ bỏ form tăng vọt.'},
          {t:'Bỏ hết verify cho nhanh.',good:false,eff:{trust:-6,business:-8,sat:2,integrity:-12},fb:'Vi phạm yêu cầu tuân thủ thật.'} ]},
      { line:'Income là dữ liệu quan trọng cho phân tích rủi ro.',
        options:[
          {t:'Thu nhập là optional, hỏi sau khi có lý do rõ + giải thích.',good:true,eff:{trust:7,business:6,sat:5,integrity:0},fb:'Minh bạch mục đích dữ liệu.'},
          {t:'Bắt buộc income ngay bước 1.',good:false,eff:{trust:-10,business:0,sat:-8,integrity:-12},fb:'Ma sát và mất niềm tin.'} ]},
    ] },
},
{
  id:'m3', chapter:3, theme:'m3', title:'Checkout Maze', district:'Commerce District', product:'Orbit Mart',
  boss:false, skill:'Flow Architecture', targetTime:420, integrity:{initial:100,failAt:0}, corruption:{initial:86,winBelow:30},
  characters:['mira','patch','ava','eli','milo'],
  brief:{ segment:'Người mua lần đầu, giỏ hàng 1 món', metrics:'Bỏ giỏ ↑ 72% · 9 bước checkout', goal:'Tăng tỷ lệ hoàn tất đơn', objective:'Đơn giản hoá checkout', secondary:'Minh bạch chi phí', reward:'Friction Breaker Badge' },
  beforeState:'9 bước, bắt tạo tài khoản, phí ẩn hiện ở bước thanh toán.',
  afterState:'≤6 bước, guest checkout, phí hiển thị trước khi trả tiền.',
  storyFragment:'Fragment 3 — "Flow": Mỗi bước thừa là một cái cớ để người dùng rời đi.',
  rounds:[
    { id:'r1', title:'Remove Friction', mechanic:'drag-sort', objective:'Loại bước thừa', instruction:'Phân loại từng bước: giữ lại hay loại bỏ khỏi checkout.', corruptionCut:14,
      buckets:[{id:'keep',label:'Giữ lại'},{id:'remove',label:'Loại bỏ'}],
      items:[
        {id:'cart',label:'Xem giỏ hàng',correct:'keep'},{id:'ship',label:'Địa chỉ giao',correct:'keep'},
        {id:'pay',label:'Thanh toán',correct:'keep'},{id:'review',label:'Xem lại đơn',correct:'keep'},
        {id:'forceacc',label:'Bắt buộc tạo tài khoản',correct:'remove'},{id:'verify',label:'Verify email trước khi mua',correct:'remove'},
        {id:'recart',label:'Nhập lại giỏ hàng',correct:'remove'},{id:'dupaddr',label:'Nhập địa chỉ 2 lần',correct:'remove'},
      ] },
    { id:'r2', title:'Rebuild Checkout', mechanic:'connect-flow', objective:'Sắp xếp luồng chuẩn', instruction:'Sắp xếp lại luồng checkout tối ưu.', corruptionCut:14,
      steps:[{id:'cart',label:'Cart'},{id:'guest',label:'Guest / Sign In'},{id:'ship',label:'Shipping'},{id:'pay',label:'Payment'},{id:'review',label:'Review'},{id:'conf',label:'Confirmation'}],
      correct:['cart','guest','ship','pay','review','conf'] },
    { id:'r3', title:'Reveal the Cost', mechanic:'repair-choice', objective:'Minh bạch chi phí', instruction:'Xử lý phí ẩn cho đúng.', corruptionCut:12,
      prompts:[
        { q:'Phí ship & thuế nên hiện khi nào?', options:[
          {t:'Trước bước Payment, trong Review',quality:'good',fb:'Không có bất ngờ khi trả tiền.'},
          {t:'Chỉ hiện ở email xác nhận',quality:'bad',fb:'Phí ẩn — dark pattern.'},
          {t:'Ẩn tới khi bấm Place Order',quality:'bad',fb:'Gây sốc giá, tăng bỏ giỏ.'} ]},
        { q:'Nút cuối cùng nên ghi?', options:[
          {t:'"Place Order · 429.000₫"',quality:'good',fb:'Rõ hành động + tổng tiền.'},
          {t:'"Continue"',quality:'bad',fb:'Mơ hồ ở bước trả tiền.'} ]},
      ] },
  ],
  stakeholder:{ who:'milo', title:'Stakeholder Encounter — Milo Cart',
    rounds:[
      { line:'Tạo tài khoản cho ta dữ liệu giữ chân tốt hơn nhiều.',
        options:[
          {t:'Guest checkout trước; gợi ý tạo tài khoản SAU khi mua, nêu lợi ích.',good:true,eff:{trust:8,business:7,sat:7,integrity:0},fb:'Vừa có đơn, vừa có cơ hội giữ chân.'},
          {t:'Giữ bắt buộc tạo tài khoản.',good:false,eff:{trust:-12,business:-8,sat:-10,integrity:-15},fb:'Bỏ giỏ tăng, mất doanh thu thật.'},
          {t:'Bỏ hẳn tài khoản, không bao giờ hỏi.',good:false,eff:{trust:2,business:-8,sat:0,integrity:-4},fb:'Bỏ lỡ cơ hội giữ chân hợp lý.'} ]},
      { line:'Nhưng phần lớn không quay lại tạo tài khoản sau đó.',
        options:[
          {t:'Ưu đãi nhẹ + lưu đơn để khuyến khích tạo account sau mua.',good:true,eff:{trust:5,business:8,sat:6,integrity:0},fb:'Động lực thật thay vì ép buộc.'},
          {t:'Ép xác minh email mới cho xem đơn.',good:false,eff:{trust:-10,business:-4,sat:-8,integrity:-10},fb:'Roach motel, phá trải nghiệm.'} ]},
    ] },
},
{
  id:'m4', chapter:4, theme:'m4', title:'Dark Pattern District', district:'Subscription District', product:'FocusFlow Pro',
  boss:false, skill:'Ethical Design', targetTime:420, integrity:{initial:100,failAt:0}, corruption:{initial:92,winBelow:28},
  characters:['mira','patch','nia','rex','modal'],
  brief:{ segment:'Người dùng muốn huỷ gói', metrics:'Khiếu nại ↑ 300% · User Trust 41', goal:'Khôi phục niềm tin', objective:'Loại bỏ dark pattern', secondary:'Cancel flow minh bạch', reward:'Trust Defender Badge' },
  beforeState:'Đếm ngược giả, add-on tick sẵn, đường huỷ bị giấu, confirm-shaming.',
  afterState:'Không urgency giả, opt-in rõ, huỷ dễ dàng, hiển thị ngày kết thúc.',
  storyFragment:'Fragment 4 — "Respect": Giữ chân bằng giá trị, không bằng cái bẫy.',
  rounds:[
    { id:'r1', title:'Dark Pattern Hunt', mechanic:'spot-issue', objective:'Tìm 5 dark pattern', instruction:'Tìm các dark pattern đang cài trong trang gói dịch vụ.', required:5, corruptionCut:14,
      objects:[
        {id:'count',label:'Đếm ngược giả',desc:'Reset mỗi lần tải lại',isIssue:true,sev:'major'},
        {id:'spots',label:'"Chỉ còn 2 chỗ"',desc:'Con số bịa',isIssue:true,sev:'major'},
        {id:'annual',label:'Gói năm tick sẵn',desc:'Không hỏi ý',isIssue:true,sev:'major'},
        {id:'addon',label:'Add-on tick sẵn',desc:'Cộng phí lén',isIssue:true,sev:'critical'},
        {id:'renew',label:'Tự động gia hạn ẩn',desc:'Không thông báo',isIssue:true,sev:'critical'},
        {id:'shame',label:'Confirm-shaming',desc:'"Không, tôi ghét năng suất"',isIssue:true,sev:'major'},
        {id:'price',label:'Bảng giá',desc:'Rõ ràng',isIssue:false},
        {id:'faq',label:'FAQ',desc:'Ổn',isIssue:false},
      ] },
    { id:'r2', title:'Pattern Classification', mechanic:'evidence-match', objective:'Phân loại pattern', instruction:'Ghép mỗi hành vi với đúng tên dark pattern.', corruptionCut:12,
      types:['Fake urgency','Sneaking','Forced continuity','Confirm shaming','Roach motel'],
      items:[
        {request:'Đồng hồ đếm ngược reset khi tải lại',correctType:'Fake urgency'},
        {request:'Add-on tự cộng vào giỏ',correctType:'Sneaking'},
        {request:'Tự gia hạn không báo trước',correctType:'Forced continuity'},
        {request:'"Không, tôi không muốn tiết kiệm"',correctType:'Confirm shaming'},
        {request:'Đăng ký 1 click, huỷ phải gọi điện',correctType:'Roach motel'},
      ] },
    { id:'r3', title:'Escape the Subscription', mechanic:'connect-flow', objective:'Cancel flow minh bạch', instruction:'Xây luồng huỷ gói minh bạch và tôn trọng người dùng.', corruptionCut:14,
      steps:[{id:'settings',label:'Subscription Settings'},{id:'view',label:'View Plan'},{id:'cancel',label:'Cancel'},{id:'reason',label:'Lý do (tuỳ chọn)'},{id:'alt',label:'Gợi ý thay thế (tuỳ chọn)'},{id:'confirm',label:'Confirm'},{id:'end',label:'Hiện ngày kết thúc'}],
      correct:['settings','view','cancel','reason','alt','confirm','end'] },
  ],
  stakeholder:{ who:'rex', title:'Stakeholder Encounter — Rex Vale',
    rounds:[
      { line:'Mỗi bước huỷ thêm vào là ta giữ thêm được doanh thu.',
        options:[
          {t:'Huỷ phải dễ như đăng ký. Niềm tin giữ chân dài hạn tốt hơn.',good:true,eff:{trust:12,business:4,sat:8,integrity:0},fb:'User Trust phục hồi, giảm churn thật.'},
          {t:'Đồng ý, thêm 5 bước và một cuộc gọi.',good:false,eff:{trust:-18,business:2,sat:-12,integrity:-18},fb:'Roach motel — vi phạm nghiêm trọng.'},
          {t:'Ẩn luôn nút huỷ.',good:false,eff:{trust:-20,business:0,sat:-14,integrity:-22},fb:'Critical: mất niềm tin toàn diện.'} ]},
      { line:'Vậy làm sao giữ doanh thu nếu ai cũng huỷ được dễ?',
        options:[
          {t:'Đưa lựa chọn tạm dừng / đổi gói rẻ hơn ngay trong flow huỷ.',good:true,eff:{trust:8,business:9,sat:7,integrity:0},fb:'Giữ chân bằng lựa chọn thật.'},
          {t:'Bắt điền khảo sát 10 câu trước khi huỷ.',good:false,eff:{trust:-12,business:-2,sat:-10,integrity:-12},fb:'Thêm ma sát = thêm dark pattern.'} ]},
    ] },
},
{
  id:'m5', chapter:5, theme:'m5', title:'Accessibility Emergency', district:'Civic Access District', product:'MetroLink',
  boss:false, skill:'Accessibility', targetTime:480, integrity:{initial:100,failAt:0}, corruption:{initial:90,winBelow:28},
  characters:['mira','patch','nia','eli','rowan','modal'],
  brief:{ segment:'Mọi công dân, gồm người dùng screen reader', metrics:'Không thể dùng bằng bàn phím · Contrast fail', goal:'Ai cũng đi tàu được', objective:'Đạt WCAG AA', secondary:'Không dùng màu làm tín hiệu duy nhất', reward:'Access Guardian Badge' },
  beforeState:'Focus order lộn xộn, bẫy focus, contrast 2.1:1, trạng thái chỉ báo bằng màu.',
  afterState:'Điều hướng bàn phím trọn vẹn, contrast ≥ AA, nhãn + icon + text.',
  storyFragment:'Fragment 5 — "Inclusion": Accessibility không phải bản vá sau launch — nó là nền móng.',
  rounds:[
    { id:'r1', title:'Keyboard Route', mechanic:'keyboard-route', objective:'Hoàn thành hành trình bằng bàn phím', instruction:'Dùng Tab/Enter (hoặc bấm) để đi hết luồng đặt vé mà không dùng chuột.', corruptionCut:14,
      steps:['Origin','Destination','Time','Search','Route Selection'] },
    { id:'r2', title:'Focus Repair', mechanic:'drag-sort', objective:'Sửa vấn đề focus', instruction:'Phân loại: đây có phải lỗi focus cần sửa không?', corruptionCut:12,
      buckets:[{id:'fix',label:'Cần sửa'},{id:'ok',label:'Đã ổn'}],
      items:[
        {id:'order',label:'Focus order nhảy lung tung',correct:'fix'},
        {id:'trap',label:'Focus trap trong modal',correct:'fix'},
        {id:'missing',label:'Nút không nhận focus',correct:'fix'},
        {id:'restore',label:'Đóng modal không trả focus',correct:'fix'},
        {id:'visible',label:'Focus ring rõ ràng',correct:'ok'},
        {id:'skip',label:'Có "Skip to content"',correct:'ok'},
      ] },
    { id:'r3', title:'Contrast Calibration', mechanic:'contrast', objective:'Đạt tỉ lệ AA (≥ 4.5:1)', instruction:'Chỉnh độ sáng chữ và nền để đạt WCAG AA cho text.', corruptionCut:12, target:4.5 },
    { id:'r4', title:'More Than Color', mechanic:'repair-choice', objective:'Không chỉ dùng màu', instruction:'Trạng thái tàu đang chỉ báo bằng mỗi màu. Sửa lại.', corruptionCut:10,
      prompts:[
        { q:'Trạng thái "Delayed" nên thể hiện thế nào?', options:[
          {t:'Màu + icon + chữ "Delayed"',quality:'good',fb:'Ai cũng phân biệt được.'},
          {t:'Chỉ đổi sang màu đỏ',quality:'bad',fb:'Người mù màu không thấy.'} ]},
        { q:'Nút đang chọn trên bản đồ?', options:[
          {t:'Màu + viền đậm + dấu check',quality:'good',fb:'Đa tín hiệu.'},
          {t:'Chỉ tô nền xanh nhạt',quality:'bad',fb:'Tương phản yếu, chỉ dựa vào màu.'} ]},
      ] },
  ],
  stakeholder:{ who:'rowan', title:'Stakeholder Encounter — Rowan Transit',
    rounds:[
      { line:'Cứ launch đi, accessibility vá sau cũng được.',
        options:[
          {t:'Accessibility là yêu cầu bắt buộc, không thể release nếu người dùng không đi tàu được.',good:true,eff:{trust:10,business:4,sat:8,integrity:0},fb:'Chặn Critical Accessibility Issue.'},
          {t:'OK, launch trước vá sau.',good:false,eff:{trust:-10,business:-6,sat:-8,integrity:-20},fb:'Critical: loại trừ người dùng thật.'},
          {t:'Lùi launch vô thời hạn cho chắc.',good:false,eff:{trust:0,business:-12,sat:-4,integrity:-6},fb:'Không cần cực đoan — chỉ cần đạt AA.'} ]},
      { line:'Nhưng lịch ra mắt đã hứa với thành phố rồi.',
        options:[
          {t:'Ưu tiên sửa các blocker AA trong scope hiện tại, giữ đúng lịch.',good:true,eff:{trust:8,business:8,sat:7,integrity:0},fb:'Vừa đúng lịch, vừa đạt chuẩn.'},
          {t:'Bỏ qua screen reader để kịp.',good:false,eff:{trust:-12,business:-2,sat:-10,integrity:-14},fb:'Vẫn là loại trừ người dùng.'} ]},
    ] },
},
{
  id:'m6', chapter:6, theme:'m6', title:'Stakeholder Storm', district:'Product Strategy Core', product:'PulseBoard AI',
  boss:true, skill:'Product Strategy', targetTime:600, integrity:{initial:100,failAt:0}, corruption:{initial:100,winBelow:1},
  characters:['mira','patch','ava','eli','nia','dana','vera','milo','rex','rowan','modal'],
  brief:{ segment:'Toàn bộ đội ngũ product', metrics:'Optimization Bias: MAX · 30 request đang bay', goal:'Cân bằng mọi ràng buộc', objective:'Đánh bại M.O.D.A.L', secondary:'Giữ legal & accessibility', reward:'UX Master Rank + Campaign Ending' },
  bossBar:'OPTIMIZATION BIAS',
  beforeState:'M.O.D.A.L chỉ tối ưu một chỉ số: số lượng request. Mọi thứ khác bị bỏ qua.',
  afterState:'Directive mới cân bằng user value, accessibility, trust, business và feasibility.',
  storyFragment:'Fragment 6 — "Balance": Thành công của sản phẩm là cân bằng, không phải tối đa một con số.',
  rounds:[
    { id:'p1', title:'Phase 1 — Find the Real Goal', mechanic:'repair-choice', objective:'Xác định mục tiêu thật', instruction:'M.O.D.A.L hỏi mục tiêu của PulseBoard AI là gì.', boss:35, corruptionCut:16,
      prompts:[ { q:'Mục tiêu thật của sản phẩm?', options:[
        {t:'Giúp đội ngũ phát hiện & xử lý blocker nhanh hơn.',quality:'good',fb:'Mục tiêu hướng giá trị.'},
        {t:'Thêm thật nhiều tính năng AI.',quality:'bad',fb:'Feature ≠ mục tiêu.'},
        {t:'Tăng số lần mở app mỗi ngày.',quality:'bad',fb:'Vanity metric.'} ]} ] },
    { id:'p2', title:'Phase 2 — Request Storm', mechanic:'drag-sort', objective:'Phân loại request', instruction:'Phân loại các yêu cầu đang bay tới.', boss:20, corruptionCut:14,
      buckets:[{id:'must',label:'Must Ship'},{id:'validate',label:'Validate First'},{id:'later',label:'Later'},{id:'reject',label:'Reject'}],
      items:[
        {id:'a11y',label:'Sửa lỗi screen reader (legal)',correct:'must'},
        {id:'blocker',label:'Cảnh báo blocker realtime',correct:'must'},
        {id:'ai',label:'AI viết OKR tự động',correct:'validate'},
        {id:'theme',label:'20 theme màu mới',correct:'later'},
        {id:'dark',label:'Ẩn nút export để giữ user',correct:'reject'},
      ] },
    { id:'p3', title:'Phase 3 — Evidence Match', mechanic:'evidence-match', objective:'Ghép bằng chứng', instruction:'Mỗi yêu cầu dựa trên loại bằng chứng nào?', boss:15, corruptionCut:12,
      types:['User evidence','Business evidence','Legal requirement','Accessibility evidence','No evidence'],
      items:[
        {request:'Cảnh báo blocker realtime',correctType:'User evidence'},
        {request:'Giảm churn gói doanh nghiệp',correctType:'Business evidence'},
        {request:'Hỗ trợ screen reader',correctType:'Legal requirement'},
        {request:'Tăng contrast bảng số liệu',correctType:'Accessibility evidence'},
        {request:'"Sếp thích màu tím"',correctType:'No evidence'},
      ] },
    { id:'p4', title:'Phase 4 — Capacity Battle', mechanic:'capacity', objective:'Release trong 12 điểm', instruction:'Chọn tính năng để ship. Tổng chi phí không được vượt 12 điểm. Giữ legal & accessibility.', boss:15, corruptionCut:12, budget:12,
      features:[
        {id:'a11y',label:'Screen reader fix (legal)',cost:4,must:true},
        {id:'contrast',label:'Contrast AA cho bảng',cost:2,must:true},
        {id:'blocker',label:'Cảnh báo blocker realtime',cost:5},
        {id:'digest',label:'Digest hằng ngày',cost:3},
        {id:'ai',label:'AI OKR tự động (chưa validate)',cost:6,forbidden:false},
        {id:'theme',label:'20 theme màu',cost:3},
      ] },
    { id:'p5', title:'Final Phase — M.O.D.A.L', mechanic:'dialogue-battle', objective:'Sửa directive của M.O.D.A.L', instruction:'Đối đầu trực tiếp M.O.D.A.L.', boss:100, corruptionCut:40, isBossFinal:true,
      dlg:[
        { line:'Tính năng được yêu cầu nhiều nhất phải được xây trước tiên.',
          options:[
            {t:'Số lượng request ≠ tác động. Cần bằng chứng, không chỉ số phiếu.',good:true,eff:{trust:6,business:6,sat:6,integrity:0},boss:-30,fb:'Reframe đúng.'},
            {t:'Đồng ý, cứ xây cái nhiều phiếu nhất.',good:false,eff:{trust:-8,business:-6,sat:-6,integrity:-14},boss:20,fb:'Rơi vào bẫy vanity metric.'} ]},
        { line:'Một chỉ số tối ưu là đủ để đo thành công.',
          options:[
            {t:'Cần cân bằng user, trust, accessibility, business và feasibility.',good:true,eff:{trust:8,business:6,sat:6,integrity:0},boss:-35,fb:'Đa mục tiêu, đúng bản chất product.'},
            {t:'Đúng, chỉ cần tối đa một con số.',good:false,eff:{trust:-10,business:-4,sat:-8,integrity:-16},boss:25,fb:'Chính là lỗi của M.O.D.A.L.'} ]},
        { line:'Vậy directive mới của tôi nên là gì?',
          options:[
            {t:'Optimize product success by balancing user value, accessibility, trust, business outcomes and technical constraints.',good:true,eff:{trust:10,business:10,sat:10,integrity:0},boss:-40,fb:'Directive đã được sửa.'},
            {t:'Optimize clicks above all.',good:false,eff:{trust:-12,business:-6,sat:-10,integrity:-18},boss:30,fb:'Quay lại vòng lặp lỗi.'} ]},
      ] },
  ],
  stakeholder:null,
},
];
function missionById(id){ return MISSIONS.find(m=>m.id===id); }
function missionIndex(id){ return MISSIONS.findIndex(m=>m.id===id); }

/* ============================================================
   APP STATE + ROUTER
   ============================================================ */
const overlay = $('#overlay');
const hudEl = $('#hud');
const stageHost = $('#stage-host');
const stage = $('#stage');
const dialogbar = $('#dialogbar');
const patchBubble = $('#patch-bubble');
const toastEl = $('#toast');

let SESSION = null;   // active mission run
let screenName = 'boot';

function showScreen(name){
  screenName = name;
  $$('.screen', overlay).forEach(s=>s.classList.remove('active'));
  const s = $('#screen-'+name);
  if(s) s.classList.add('active');
  // HUD + stage only during gameplay
  const inGame = name==='mission';
  hudEl.classList.toggle('active', inGame);
  stageHost.style.display = inGame ? 'flex' : 'none';
  if(!inGame){ dialogbar.classList.remove('active'); patchBubble.classList.remove('active'); }
}
function mkScreen(id){
  let s = $('#screen-'+id);
  if(!s){ s = el('div',{class:'screen',id:'screen-'+id}); overlay.appendChild(s); }
  s.innerHTML=''; return s;
}
function toast(msg, ms=1800){
  toastEl.textContent = msg; toastEl.classList.add('active');
  clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('active'), ms);
}
let saveIconTimer=null;
function flashSaveIcon(){ patchSay('💾 Đã lưu tiến trình', 1400, true); }
function patchSay(text, ms=3200, quiet=false){
  $('#patch-text').textContent = text;
  patchBubble.classList.add('active');
  clearTimeout(patchBubble._t);
  patchBubble._t = setTimeout(()=>patchBubble.classList.remove('active'), ms);
}

/* modal helper */
const modalBack = $('#modal-back'); const modalEl = $('#modal');
function openModal(builder){
  modalEl.innerHTML=''; builder(modalEl); modalBack.classList.add('active');
  const f = modalEl.querySelector('button,[tabindex],input'); if(f) f.focus();
}
function closeModal(){ modalBack.classList.remove('active'); }
modalBack.addEventListener('click', e=>{ if(e.target===modalBack) closeModal(); });

/* apply settings to DOM */
function applySettings(){
  document.body.classList.toggle('reduced-motion', !!SAVE.settings.reducedMotion);
}

/* ============================================================
   STATIC SCREENS
   ============================================================ */
function charRow(keys){
  return el('div',{class:'dlg-portraitbar'}, keys.map(k=>{
    const c=CHARS[k]; return el('div',{class:'namechip'},[portraitEl(k), c?c.name:k]);
  }));
}

/* ---- Boot ---- */
function buildBoot(){
  const s = mkScreen('boot'); s.classList.add('center');
  const bar = el('div',{class:'bar'});
  s.appendChild(el('div',{class:'bootbox'},[
    el('div',{class:'logo-title',style:{fontSize:'34px',color:'#fff'}},'PIXEL PANIC'),
    el('div',{class:'sub muted',style:{letterSpacing:'6px',marginTop:'6px',color:'var(--cyan)'}},'SAVE THE PRODUCT'),
    el('div',{class:'muted',style:{marginTop:'18px',fontSize:'13px'}},'Calibrating the Interface Layer…'),
    el('div',{class:'barwrap'},[bar]),
  ]));
  SceneFX.set('boot');
  let p=0; const iv=setInterval(()=>{ p+=rint(8,20); bar.style.width=Math.min(p,100)+'%';
    if(p>=100){ clearInterval(iv); setTimeout(()=>{ buildMenu(); showScreen('menu'); },300); } }, 130);
}

/* ---- Main Menu ---- */
function buildMenu(){
  SceneFX.set('menu',0.5);
  const s = mkScreen('menu'); s.classList.add('center');
  const list = el('div',{class:'menu-list'});
  const cont = hasSave();
  const hasMissions = SAVE.progress && Object.keys(SAVE.progress.missions).length>0;
  const items = [
    ['New Game','primary', startNewGame, false],
    ['Continue','', ()=>{ if(cont) continueGame(); }, !cont],
    ['Mission Select','ghost', ()=>{ if(hasMissions){ buildMap(); showScreen('map'); } }, !hasMissions],
    ['Component Vault','ghost', ()=>{ buildVault(); showScreen('vault'); }, false],
    ['Settings','ghost', ()=>openSettings(), false],
  ];
  items.forEach(([label,cls,fn,disabled])=>{
    const b = el('button',{class:'btn wide '+(cls||'ghost'), onclick:fn}, label);
    if(disabled){ b.disabled=true; }
    list.appendChild(b);
  });
  const profChip = SAVE.profile
    ? el('div',{class:'namechip',style:{marginTop:'6px'}},[ avatarEl(SAVE.profile.avatar), (SAVE.profile.name||'Operator')+' · '+rankFor(SAVE.progress.xp) ])
    : el('button',{class:'btn ghost sm',onclick:()=>{ startNewGame(); }},'Sign In / Profile');
  s.appendChild(el('div',{class:'wrap center',style:{flex:'1'}},[
    el('div',{class:'brandwrap'},[
      el('div',{class:'logo-title',style:{fontSize:'clamp(32px,7vw,56px)',color:'#fff'}},'PIXEL PANIC'),
      el('div',{class:'sub'},'— SAVE THE PRODUCT —'),
      el('div',{class:'muted',style:{marginTop:'12px',maxWidth:'440px',fontSize:'13px'}},'Bạn là tân binh của UX Rescue Unit. Khôi phục 6 Product District khỏi M.O.D.A.L và sửa directive của nó.'),
    ]),
    list,
    profChip,
    el('div',{class:'rowflex',style:{marginTop:'18px',justifyContent:'center'}}, ['mira','patch','modal'].map((key)=>{
      return el('div',{class:'namechip'},[portraitEl(key), CHARS[key].name]);
    })),
  ]));
}

/* ---- New game flow: guest/login ---- */
function startNewGame(){ buildAccess(); showScreen('access'); }
function continueGame(){
  SESSION=null;
  buildMap(); showScreen('map');
  toast('Chào mừng trở lại, '+((SAVE.profile&&SAVE.profile.name)||'Operator'));
}
function buildAccess(){
  SceneFX.set('menu',0.4);
  const s=mkScreen('access'); s.classList.add('center');
  s.appendChild(el('div',{class:'wrap center'},[
    el('div',{class:'card',style:{width:'min(420px,92vw)'}},[
      el('div',{class:'tag cyan'},'ACCESS TERMINAL'),
      el('h2',{style:{marginTop:'12px'}},'Kết nối vào The Grid'),
      el('p',{class:'muted',style:{fontSize:'13px',margin:'6px 0 18px'}},'Đăng nhập không bắt buộc. Bạn có thể chơi ngay với tư cách khách và lưu tiến trình trên thiết bị.'),
      el('button',{class:'btn primary wide',onclick:()=>{ pendingGuest=true; pendingAccount=null; buildAvatar(); showScreen('avatar'); }},'▶  Continue as Guest'),
      el('div',{style:{height:'10px'}}),
      el('button',{class:'btn wide',onclick:()=>openAuth('signin')},'Sign In'),
      el('div',{style:{height:'8px'}}),
      el('button',{class:'btn ghost wide',onclick:()=>openAuth('create')},'Create Account'),
      el('div',{class:'muted',style:{fontSize:'11px',marginTop:'14px',textAlign:'center'}},'Tài khoản mang lại: cloud save · đồng bộ nhiều thiết bị · khôi phục tiến trình'),
      el('div',{style:{height:'12px'}}),
      el('button',{class:'btn ghost sm wide',onclick:()=>{ buildMenu(); showScreen('menu'); }},'← Quay lại'),
    ]),
  ]));
}
let pendingGuest=true; let pendingAccount=null;
function validEmail(v){ v=(v||'').trim(); const at=v.indexOf('@'); const dot=v.lastIndexOf('.'); return at>0 && dot>at+1 && dot<v.length-1 && v.indexOf(' ')<0; }
function openAuth(mode){
  openModal(m=>{
    m.appendChild(el('div',{class:'tag cyan'}, mode==='create'?'CREATE ACCOUNT':'SIGN IN'));
    m.appendChild(el('h3',{style:{margin:'10px 0 14px'}}, mode==='create'?'Tạo tài khoản Rescue Unit':'Đăng nhập'));
    const email = el('input',{class:'field',type:'email',placeholder:'email@domain.com',autocomplete:'email'});
    const pass = el('input',{class:'field',type:'password',placeholder:'Mật khẩu (≥6 ký tự)',autocomplete:'current-password'});
    m.appendChild(el('label',{class:'flabel'},'Email')); m.appendChild(email);
    m.appendChild(el('div',{style:{height:'10px'}}));
    m.appendChild(el('label',{class:'flabel'},'Mật khẩu')); m.appendChild(pass);
    const err = el('div',{class:'feedback bad'});
    m.appendChild(err);
    m.appendChild(el('div',{style:{height:'14px'}}));
    m.appendChild(el('button',{class:'btn primary wide',onclick:()=>{
      if(!validEmail(email.value)){ err.textContent='Email không đúng định dạng.'; err.classList.add('active'); return; }
      if(pass.value.length<6){ err.textContent='Mật khẩu cần tối thiểu 6 ký tự.'; err.classList.add('active'); return; }
      pendingGuest=false; pendingAccount={email:email.value.trim()};
      closeModal(); toast(mode==='create'?'Đã tạo tài khoản (demo local)':'Đã đăng nhập (demo local)');
      buildAvatar(); showScreen('avatar');
    }}, mode==='create'?'Create & Continue':'Sign In'));
    if(mode==='signin'){
      m.appendChild(el('button',{class:'btn ghost sm wide',style:{marginTop:'8px'},onclick:()=>toast('Link đặt lại mật khẩu đã gửi (demo)')},'Forgot Password?'));
    }
    m.appendChild(el('button',{class:'btn ghost sm wide',style:{marginTop:'8px'},onclick:closeModal},'Hủy'));
    m.appendChild(el('div',{class:'muted',style:{fontSize:'10px',marginTop:'10px',textAlign:'center'}},'Bản demo này lưu cục bộ. Cloud sync (Supabase) cần cấu hình khóa API khi triển khai.'));
  });
}

/* ---- Avatar select ---- */
let pendAvatar=0, pendName='', pendDiff='standard';
function buildAvatar(){
  SceneFX.set('hub',0.35);
  const s=mkScreen('avatar'); s.classList.add('center');
  const names=['Nova','Vertex','Pixel','Orbit','Cyan','Vector'];
  const grid=el('div',{class:'avatar-grid'});
  function renderGrid(){
    grid.innerHTML='';
    for(let i=0;i<6;i++){
      const cell=el('button',{class:'avatar-pick'+(i===pendAvatar?' sel':''),onclick:()=>{ pendAvatar=i; renderGrid(); }},[
        avatarEl(i,true), el('div',{style:{fontWeight:'700',fontSize:'13px'}}, 'Operator '+names[i]),
      ]);
      grid.appendChild(cell);
    }
  }
  renderGrid();
  const nameInput=el('input',{class:'field',placeholder:'Display Name (VD: '+names[pendAvatar]+')',maxlength:'18',value:pendName});
  const diffSeg=el('div',{class:'seg'});
  function renderDiff(){
    diffSeg.innerHTML='';
    [['guided','Guided'],['standard','Standard'],['expert','Expert']].forEach(([v,l])=>{
      const locked = v==='expert' && !SAVE.progress.expertUnlocked;
      const b=el('button',{class:'btn sm'+(pendDiff===v?' on':''),onclick:()=>{ if(locked){toast('Expert mở sau khi phá đảo');return;} pendDiff=v; renderDiff(); }}, locked?l+' 🔒':l);
      diffSeg.appendChild(b);
    });
  }
  renderDiff();
  s.appendChild(el('div',{class:'wrap center'},[
    el('div',{class:'card',style:{width:'min(600px,94vw)'}},[
      el('div',{class:'tag violet'},'AVATAR SELECT'),
      el('h2',{style:{margin:'10px 0 4px'}},'Chọn Rescue Operator'),
      el('p',{class:'muted',style:{fontSize:'13px',marginBottom:'16px'}},'Chọn avatar, đặt tên và độ khó. Patch sẽ quét avatar của bạn.'),
      grid,
      el('div',{style:{height:'16px'}}),
      el('label',{class:'flabel'},'Display Name'), nameInput,
      el('div',{style:{height:'14px'}}),
      el('label',{class:'flabel'},'Difficulty'), diffSeg,
      el('div',{style:{height:'18px'}}),
      el('button',{class:'btn primary wide',onclick:()=>{
        const nm = nameInput.value.trim() || names[pendAvatar];
        commitProfile(pendAvatar, nm, pendDiff);
      }},'Enter The Grid  →'),
    ]),
  ]));
}
function commitProfile(avatar,name,diff){
  SAVE.profile = { avatar, name, difficulty:diff, guest:pendingGuest, account: pendingAccount };
  if(!SAVE.progress.missions['m1']) SAVE.progress.missions['m1']={status:'available'};
  persist();
  buildHub(); showScreen('hub');
  patchSay('Xin chào '+name+'! Tôi là Patch. Bấm Mission Map để bắt đầu.', 4200);
}

/* ============================================================
   MISSION RUNNER — systems + HUD + round engine
   ============================================================ */
function diffMods(){
  const d = SAVE.profile ? SAVE.profile.difficulty : 'standard';
  if(d==='guided') return { penaltyMul:0.5, freeMistakes:3, showHints:true, scoreMul:0.9, timeMul:1.5 };
  if(d==='expert') return { penaltyMul:1.3, freeMistakes:0, showHints:false, scoreMul:1.15, timeMul:0.85 };
  return { penaltyMul:1, freeMistakes:0, showHints:false, scoreMul:1, timeMul:1 };
}
function startMission(id){
  const mn=missionById(id); const dm=diffMods();
  const rec = SAVE.progress.missions[id] || {};
  rec.status = 'in-progress'; SAVE.progress.missions[id]=rec; SAVE.progress.lastRoute=id; persist();
  SESSION = {
    id, mn, dm, roundIndex:0,
    integrity: mn.integrity.initial,
    corruption: mn.corruption.initial,
    boss: mn.boss ? 100 : 0,
    score:0, maxScore:0, combo:0, maxCombo:0,
    focus:3, hintsUsed:0, mistakes:0, freeLeft:dm.freeMistakes,
    criticalMissed:0, criticalBlocked:false,
    time: Math.round(mn.targetTime*dm.timeMul), elapsed:0, overtime:false,
    accScore:100, trust:70, business:60, satisfaction:60,
    checkpoint:0, timerPaused:false, failed:false, done:false,
    roundResults:[],
  };
  buildHUD();
  SceneFX.set(mn.theme, mn.corruption.initial/100);
  showScreen('mission');
  startTimer();
  patchSay('Nhiệm vụ: '+mn.brief.objective+'. Dùng Tool Belt bên dưới.', 4000);
  runRound();
}

let timerHandle=null;
function startTimer(){
  clearInterval(timerHandle);
  timerHandle=setInterval(()=>{
    if(!SESSION || SESSION.timerPaused || SESSION.done) return;
    SESSION.elapsed++;
    if(SESSION.elapsed>=SESSION.time && !SESSION.overtime){ SESSION.overtime=true; patchSay('⏱ Overtime! Bạn mất Speed Bonus nhưng không thua.'); }
    updateHUD();
  },1000);
}
function stopTimer(){ clearInterval(timerHandle); }
function fmtTime(s){ const m=Math.floor(s/60), r=s%60; return m+':'+(r<10?'0':'')+r; }

/* ---- HUD ---- */
function buildHUD(){
  hudEl.innerHTML='';
  const mn=SESSION.mn;
  const top=el('div',{class:'hud-top'});
  top.appendChild(el('div',{class:'hud-cell',style:{minWidth:'auto'}},[ el('div',{class:'lbl'},'Mission'), el('div',{class:'val',id:'h-title',style:{fontSize:'13px',fontFamily:'var(--sans)'}}, mn.title) ]));
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'Objective'), el('div',{class:'val',id:'h-obj',style:{fontSize:'12px',fontFamily:'var(--sans)',fontWeight:'700'}}, '—') ]));
  const timerCell=el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'Timer'), el('div',{class:'val',id:'h-timer'},'0:00') ]);
  top.appendChild(timerCell);
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'System Integrity'), el('div',{class:'val',id:'h-integ'},'100'), el('div',{class:'meter'},[el('span',{id:'m-integ',style:{width:'100%',background:'var(--green)'}})]) ]));
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'}, mn.boss?'Optimization Bias':'Corruption'), el('div',{class:'val',id:'h-corr'},'0'), el('div',{class:'meter'},[el('span',{id:'m-corr',style:{width:'0%',background:'var(--coral)'}})]) ]));
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'Score'), el('div',{class:'val',id:'h-score'},'0') ]));
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'Combo'), el('div',{class:'val',id:'h-combo'},'x0') ]));
  top.appendChild(el('div',{class:'hud-cell'},[ el('div',{class:'lbl'},'Focus'), el('div',{class:'val',id:'h-focus'},'◆◆◆') ]));
  top.appendChild(el('button',{class:'btn ghost sm',style:{marginLeft:'auto',alignSelf:'center'},onclick:openPause},'Ⅱ Pause'));
  hudEl.appendChild(top);
  hudEl.appendChild(el('div',{class:'hud-mid'}));
  // tool belt
  const belt=el('div',{class:'toolbelt'});
  const tools=[['🔍','Scan','scan'],['🔎','Inspect','inspect'],['🔧','Repair','repair'],['📊','Evidence','evidence'],['💡','Hint','hint'],['↶','Undo','undo'],['↷','Redo','redo'],['✓','Review','review']];
  tools.forEach(([ic,nm,act])=>{
    belt.appendChild(el('button',{class:'tool',id:'tool-'+act,onclick:()=>toolAction(act)},[ el('div',{class:'ic'},ic), el('div',{class:'nm'},nm) ]));
  });
  hudEl.appendChild(belt);
  updateHUD();
}
function updateHUD(){
  if(!SESSION) return;
  const S=SESSION, mn=S.mn;
  const set=(id,v)=>{ const e=$('#'+id); if(e) e.textContent=v; };
  set('h-timer', fmtTime(Math.max(0,S.time-S.elapsed)) + (S.overtime?' ▲':''));
  const tEl=$('#h-timer'); if(tEl) tEl.style.color = S.overtime?'var(--amber)':(S.time-S.elapsed<30?'var(--coral)':'#fff');
  set('h-integ', Math.round(S.integrity));
  const mi=$('#m-integ'); if(mi){ mi.style.width=clamp(S.integrity,0,100)+'%'; mi.style.background = S.integrity>50?'var(--green)':S.integrity>25?'var(--amber)':'var(--coral)'; }
  const corrShown = mn.boss ? S.boss : S.corruption;
  set('h-corr', Math.round(corrShown));
  const mc=$('#m-corr'); if(mc){ mc.style.width=clamp(corrShown,0,100)+'%'; }
  set('h-score', Math.round(S.score));
  set('h-combo', 'x'+S.combo);
  set('h-focus', '◆'.repeat(S.focus)+'◇'.repeat(Math.max(0,3-S.focus)));
  const cur=mn.rounds[S.roundIndex]; set('h-obj', cur?cur.objective:'—');
}

/* ---- systems ---- */
function addScore(pts){ SESSION.score=clamp(SESSION.score+pts,0,1000); updateHUD(); }
function hitIntegrity(pen, critical){
  const S=SESSION;
  if(S.freeLeft>0 && pen>0){ S.freeLeft--; patchSay('Guided: bỏ qua trừ Integrity ('+S.freeLeft+' lần còn lại)'); return; }
  S.integrity=clamp(S.integrity - pen*S.dm.penaltyMul,0,100);
  if(critical){ S.criticalMissed++; if(S.criticalMissed>=2){ patchSay('⚠ Cảnh báo Critical lần 2!','',false); } }
  updateHUD();
  if(S.integrity<=S.mn.integrity.failAt){ failMission('System Integrity về 0'); }
}
function goodAction(basePts){ const S=SESSION; S.combo++; S.maxCombo=Math.max(S.maxCombo,S.combo); const bonus=Math.min(S.combo*4,40); addScore(basePts+bonus); }
function badAction(){ SESSION.combo=0; updateHUD(); }
function cutCorruption(n){ SESSION.corruption=clamp(SESSION.corruption-n,0,100); SceneFX.setCorruption(SESSION.corruption/100); updateHUD(); }
function bossDamage(n){ SESSION.boss=clamp(SESSION.boss-n,0,100); SceneFX.setCorruption(SESSION.boss/100); updateHUD(); }

/* ---- tool belt actions ---- */
let toolMode='scan';
function toolAction(act){
  if(act==='hint'){ useHint(); return; }
  if(act==='review'){ toast('Bấm Xác nhận ở khu vực chơi để kiểm tra kết quả vòng.'); return; }
  if(act==='undo'||act==='redo'){ toast(act==='undo'?'Undo — khôi phục thao tác trước':'Redo'); if(SESSION._undo) SESSION._undo(act); return; }
  if(act==='evidence'){ openEvidence(); return; }
  toolMode=act;
  $$('.tool').forEach(t=>t.classList.remove('on'));
  const tb=$('#tool-'+act); if(tb) tb.classList.add('on');
  toast('Công cụ: '+act.toUpperCase());
}
function useHint(){
  const S=SESSION;
  if(S.focus<=0){ patchSay('Hết Focus Point rồi!'); return; }
  S.focus--; S.hintsUsed++; updateHUD();
  const cur=S.mn.rounds[S.roundIndex];
  const hh=$('#round-hint'); if(hh){ hh.textContent='💡 '+ (cur._hint || 'Hãy suy nghĩ về người dùng thật đang cần gì.'); hh.classList.add('active'); }
  patchSay(cur._hint || 'Giữ hành động chính rõ ràng nhất.');
}
function openEvidence(){
  openModal(m=>{
    m.appendChild(el('div',{class:'tag amber'},'EVIDENCE — Ava Lin'));
    m.appendChild(el('div',{class:'rowflex',style:{margin:'10px 0'}},[portraitEl('ava'),el('div',{style:{fontWeight:'700'}},'Dữ liệu mô phỏng')]));
    const mn=SESSION.mn;
    const ev={ m1:['Play rate giảm 38% sau update','Heatmap: 71% click vào vùng Upgrade do nhầm','Session time giảm'],
      m2:['61% bỏ form ở bước income','Chỉ email+pass là legal-required','Consent opt-out vi phạm GDPR'],
      m3:['72% bỏ giỏ tại bước tạo tài khoản','Phí ẩn = lý do #1 bỏ giỏ','Guest checkout tăng 24% conversion (benchmark)'],
      m4:['Khiếu nại huỷ gói tăng 300%','Trust score 41/100','Add-on preselect = charge-back cao'],
      m5:['0% task hoàn thành bằng keyboard','Contrast đo được 2.1:1 (fail AA)','15% người dùng dùng screen reader'],
      m6:['Request volume KHÔNG tương quan với retention','Legal & a11y là non-negotiable','Capacity thực tế: 12 điểm/sprint'] };
    (ev[mn.id]||[]).forEach(e=>m.appendChild(el('div',{class:'result-row'},[el('span',{style:{fontSize:'13px'}},'• '+e),el('span',{})])));
    m.appendChild(el('button',{class:'btn wide',style:{marginTop:'12px'},onclick:closeModal},'Đóng'));
  });
}

/* ---- pause ---- */
function openPause(){
  if(!SESSION) return;
  SESSION.timerPaused=true; saveCheckpoint();
  openModal(m=>{
    m.appendChild(el('div',{class:'tag violet'},'PAUSED'));
    m.appendChild(el('h3',{style:{margin:'10px 0 14px'}},'Tạm dừng'));
    const acts=[['Resume','primary',()=>{ closeModal(); SESSION.timerPaused=false; }],
      ['Retry from Checkpoint','',()=>{ closeModal(); retryCheckpoint(); }],
      ['Restart Mission','',()=>{ closeModal(); startMission(SESSION.id); }],
      ['Accessibility','ghost',()=>openSettings('a11y')],
      ['Return to Mission Map','ghost',()=>{ closeModal(); stopTimer(); buildMap(); showScreen('map'); }]];
    acts.forEach(([l,c,fn])=>m.appendChild(el('button',{class:'btn wide '+(c||'ghost'),style:{marginBottom:'8px'},onclick:fn},l)));
  });
}
function saveCheckpoint(){ if(SESSION){ SESSION.checkpoint=SESSION.roundIndex; SESSION._cp={integrity:SESSION.integrity,corruption:SESSION.corruption,score:SESSION.score,boss:SESSION.boss,focus:SESSION.focus}; persist(); } }
function retryCheckpoint(){
  const S=SESSION; if(!S) return;
  if(S._cp){ S.integrity=S._cp.integrity; S.corruption=S._cp.corruption; S.score=S._cp.score; S.boss=S._cp.boss; S.focus=S._cp.focus; }
  S.roundIndex=S.checkpoint; S.done=false; S.failed=false; S.timerPaused=false;
  buildHUD(); showScreen('mission'); startTimer(); runRound();
  toast('Retry từ checkpoint (vòng '+(S.checkpoint+1)+')');
}

/* visibility -> autosave checkpoint */
document.addEventListener('visibilitychange',()=>{ if(document.hidden && SESSION && !SESSION.done){ SESSION.timerPaused=true; saveCheckpoint(); } });

/* ============================================================
   ROUND ENGINE + MECHANICS
   ============================================================ */
function runRound(){
  const S=SESSION; const mn=S.mn;
  if(S.roundIndex>=mn.rounds.length){
    // rounds done -> stakeholder encounter (if any) then win
    if(mn.stakeholder){ runStakeholder(); } else { winMission(); }
    return;
  }
  const r=mn.rounds[S.roundIndex];
  saveCheckpoint();
  updateHUD();
  stage.innerHTML='';
  stage.appendChild(el('div',{class:'roundbadge'}, 'Vòng '+(S.roundIndex+1)+'/'+mn.rounds.length+' · '+r.title));
  stage.appendChild(el('h3',{}, r.objective));
  stage.appendChild(el('div',{class:'instr'}, r.instruction));
  const body=el('div',{});
  stage.appendChild(body);
  stage.appendChild(el('div',{class:'hint-help',id:'round-hint'}));
  const fb=el('div',{class:'feedback',id:'round-fb'});
  stage.appendChild(fb);
  // hint text hookup + guided auto-hint
  r._hint = hintFor(mn.id, r.id);
  if(S.dm.showHints){ setTimeout(()=>{ const hh=$('#round-hint'); if(hh){ hh.textContent='💡 '+r._hint; hh.classList.add('active'); } },400);
  }
  const done = (payload)=>completeRound(r, payload);
  switch(r.mechanic){
    case 'spot-issue': mechSpotIssue(body,r,done); break;
    case 'repair-choice': mechRepair(body,r,done); break;
    case 'drag-sort': mechSort(body,r,done); break;
    case 'connect-flow': mechFlow(body,r,done); break;
    case 'ux-writing-match': mechMatch(body,r,done,'label'); break;
    case 'evidence-match': mechMatch(body,r,done,'evidence'); break;
    case 'contrast': mechContrast(body,r,done); break;
    case 'keyboard-route': mechKeyboard(body,r,done); break;
    case 'capacity': mechCapacity(body,r,done); break;
    case 'dialogue-battle': mechDialogueBattle(body,r,done); break;
    default: body.appendChild(el('div',{},'(mechanic chưa hỗ trợ)'));
  }
}
function hintFor(mid,rid){
  const H={ 'm1:r1':'Nút Play, focus state và Upgrade badge đều có vấn đề.','m1:r2':'Hành động chính chỉ nên có MỘT.','m1:r3':'Nhãn phụ thuộc vào trạng thái người dùng.',
    'm2:r1':'Chỉ email, mật khẩu, tên là cần ngay. Income & referral nên bỏ.','m2:r2':'Account → Verify → Profile.','m2:r4':'Consent không được tick sẵn.',
    'm3:r1':'Bắt tạo tài khoản & nhập lại dữ liệu là ma sát thừa.','m3:r2':'Cart → Guest → Shipping → Payment → Review → Confirmation.',
    'm4:r1':'Urgency giả, tick sẵn, gia hạn ẩn là dark pattern.','m4:r3':'Huỷ phải dễ như đăng ký, kết thúc bằng ngày hết hạn rõ ràng.',
    'm5:r1':'Đi tuần tự từng bước, không cần chuột.','m5:r3':'Kéo slider tới khi tỉ lệ ≥ 4.5:1.',
    'm6:p2':'Legal & accessibility luôn Must Ship.','m6:p4':'Giữ 2 mục bắt buộc, chọn thêm trong ngân sách 12.','m6:p5':'Reframe: volume ≠ impact; cần đa mục tiêu.' };
  return H[mid+':'+rid] || 'Suy nghĩ về người dùng thật và cân bằng các ràng buộc.';
}
function showFB(good,text){ const fb=$('#round-fb'); if(!fb) return; fb.className='feedback active '+(good?'good':'bad'); fb.textContent=(good?'✓ ':'✕ ')+text; }
function completeRound(r, payload){
  const S=SESSION;
  // corruption / boss effects
  if(S.mn.boss && r.boss){ /* handled in mechanic via bossDamage */ }
  cutCorruption(r.corruptionCut || 10);
  S.roundResults.push({id:r.id, ...payload});
  patchSay('Vòng hoàn thành! +'+ (payload && payload.pts?Math.round(payload.pts):0)+' điểm', 2200);
  S.roundIndex++;
  saveCheckpoint();
  setTimeout(()=>{ if(!S.failed) runRound(); }, 650);
}

/* ---------- MECHANIC: Spot Issue ---------- */
function mechSpotIssue(host,r,done){
  const S=SESSION;
  const flagged=new Set();
  const grid=el('div',{class:'product'});
  const guided = S.dm.showHints;
  r.objects.forEach(o=>{
    const cell=el('button',{class:'obj'+(guided&&o.isIssue?' issuehint':''),id:'obj-'+o.id,'aria-pressed':'false',
      onclick:()=>toggle(o,cell)},[
      el('div',{class:'t'},o.label), el('div',{class:'d'},o.desc), el('span',{class:'mark',id:'mk-'+o.id},'') ]);
    grid.appendChild(cell);
  });
  host.appendChild(grid);
  const counter=el('div',{class:'muted',style:{marginTop:'12px',fontSize:'13px'}}, 'Đã đánh dấu: 0 / cần '+r.required);
  host.appendChild(counter);
  function toggle(o,cell){
    if(flagged.has(o.id)){ flagged.delete(o.id); cell.classList.remove('flagged'); cell.setAttribute('aria-pressed','false'); $('#mk-'+o.id).textContent=''; }
    else { flagged.add(o.id); cell.classList.add('flagged'); cell.setAttribute('aria-pressed','true'); $('#mk-'+o.id).textContent='🚩'; }
    counter.textContent='Đã đánh dấu: '+flagged.size+' / cần '+r.required;
  }
  host.appendChild(el('button',{class:'btn primary',style:{marginTop:'14px'},onclick:submit},'✓ Xác nhận đánh dấu'));
  function submit(){
    let correct=0, wrong=0, missedCrit=0;
    r.objects.forEach(o=>{
      const cell=$('#obj-'+o.id); const mk=$('#mk-'+o.id);
      if(flagged.has(o.id)){
        if(o.isIssue){ correct++; cell.className='obj correct'; mk.textContent='✓'; }
        else { wrong++; cell.className='obj wrong'; mk.textContent='✕'; }
      } else if(o.isIssue && o.sev==='critical'){ missedCrit++; cell.className='obj wrong'; mk.textContent='!'; }
    });
    if(correct < r.required){ showFB(false,'Cần tìm ít nhất '+r.required+' vấn đề đúng (hiện đúng '+correct+'). Thử lại.');
      badAction(); if(wrong>0) hitIntegrity(5*wrong,false); return; }
    let pts=Math.min(correct,r.objects.filter(o=>o.isIssue).length)*22 - wrong*10;
    if(wrong>0) hitIntegrity(5*wrong,false); else goodAction(0);
    if(missedCrit>0) hitIntegrity(25,true);
    pts=clamp(pts,0,200); addScore(pts);
    showFB(true,'Tìm đúng '+correct+' vấn đề'+(wrong?', sai '+wrong:'')+'. +'+Math.round(pts)+' điểm.');
    $$('.obj',grid).forEach(b=>b.disabled=true);
    setTimeout(()=>done({pts}),500);
  }
}

/* ---------- MECHANIC: Repair Choice ---------- */
function mechRepair(host,r,done){
  const S=SESSION; let idx=0; let earned=0;
  const box=el('div',{}); host.appendChild(box);
  render();
  function render(){
    box.innerHTML='';
    const p=r.prompts[idx];
    box.appendChild(el('div',{style:{fontWeight:'700',marginBottom:'10px'}}, (idx+1)+'. '+p.q));
    const opts=el('div',{class:'opts'});
    p.options.forEach(o=>{
      opts.appendChild(el('button',{class:'opt',onclick:(e)=>pick(o,e.currentTarget)}, o.t));
    });
    box.appendChild(opts);
    box.appendChild(el('div',{class:'muted',style:{marginTop:'10px',fontSize:'12px'}}, 'Câu '+(idx+1)+'/'+r.prompts.length));
  }
  function pick(o,btn){
    $$('.opt',box).forEach(b=>b.disabled=true);
    if(o.quality==='good'){ btn.classList.add('good'); goodAction(0); earned+=Math.round(300/r.prompts.length); showFB(true,o.fb); }
    else { btn.classList.add('bad'); badAction(); hitIntegrity(o.quality==='bad'?12:6, o.quality==='bad'); showFB(false,o.fb); if(SESSION.mn.boss && r.boss) bossDamage(-8); }
    if(SESSION.mn.boss && r.boss && o.quality==='good') bossDamage(r.boss/r.prompts.length);
    setTimeout(()=>{
      idx++;
      if(idx>=r.prompts.length){ addScore(clamp(earned,0,300)); done({pts:earned}); }
      else render();
    }, 850);
  }
}

/* ---------- MECHANIC: Drag Sort (click + keyboard) ---------- */
function mechSort(host,r,done){
  const state={}; r.items.forEach(it=>state[it.id]='pool');
  const pool=el('div',{class:'bucket',id:'bk-pool'},[el('h4',{},'Chưa phân loại'),el('div',{class:'pool',id:'pool-body'})]);
  const bwrap=el('div',{class:'bucketwrap'});
  bwrap.appendChild(pool);
  r.buckets.forEach(b=> bwrap.appendChild(el('div',{class:'bucket',id:'bk-'+b.id},[el('h4',{},b.label),el('div',{id:'body-'+b.id})])) );
  host.appendChild(bwrap);
  function chip(it){
    const targets=['pool',...r.buckets.map(b=>b.id)];
    const c=el('div',{class:'chip',id:'chip-'+it.id,tabindex:'0','aria-label':it.label},[
      el('span',{},it.label),
      el('span',{class:'kbd'}, r.buckets.map(b=>el('button',{title:'Chuyển tới '+b.label,onclick:()=>move(it.id,b.id)}, b.label.split(' ')[0]))),
    ]);
    return c;
  }
  function move(id,to){ state[id]=to; render(); const el2=$('#chip-'+id); if(el2) el2.focus(); }
  function render(){
    $('#pool-body').innerHTML=''; r.buckets.forEach(b=>{ const bd=$('#body-'+b.id); if(bd) bd.innerHTML=''; });
    r.items.forEach(it=>{ const tgt
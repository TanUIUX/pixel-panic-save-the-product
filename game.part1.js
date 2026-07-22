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

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
    r.items.forEach(it=>{ const tgt = state[it.id]==='pool'?$('#pool-body'):$('#body-'+state[it.id]); if(tgt) tgt.appendChild(chip(it)); });
  }
  render();
  host.appendChild(el('button',{class:'btn primary',style:{marginTop:'6px'},onclick:submit},'✓ Xác nhận phân loại'));
  function submit(){
    let correct=0, wrong=0;
    r.items.forEach(it=>{ if(state[it.id]==='pool'){ wrong++; } else if(state[it.id]===it.correct) correct++; else wrong++; });
    if(wrong>0){ showFB(false,'Còn '+wrong+' mục chưa đúng vị trí. Điều chỉnh lại.'); badAction(); hitIntegrity(6,false);
      if(SESSION.mn.boss && r.boss) bossDamage(-6); return; }
    goodAction(0); const pts=clamp(r.items.length*30,0,300); addScore(pts);
    if(SESSION.mn.boss && r.boss) bossDamage(r.boss);
    showFB(true,'Phân loại chính xác! +'+pts+' điểm.');
    $$('.chip',host).forEach(c=>c.querySelectorAll('button').forEach(b=>b.disabled=true));
    setTimeout(()=>done({pts}),500);
  }
}

/* ---------- MECHANIC: Connect Flow (ordering) ---------- */
function mechFlow(host,r,done){
  let order=r.steps.map(s=>s.id); shuffle(order);

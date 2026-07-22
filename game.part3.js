  const list=el('div',{class:'flowlist'}); host.appendChild(list);
  function render(){
    list.innerHTML='';
    order.forEach((id,i)=>{
      const st=r.steps.find(s=>s.id===id);
      list.appendChild(el('div',{class:'flowitem'},[
        el('div',{class:'num'},String(i+1)),
        el('div',{style:{flex:'1'}},st.label),
        el('div',{class:'grip'},[
          el('button',{class:'btn ghost sm',title:'Lên',onclick:()=>{ if(i>0){ [order[i-1],order[i]]=[order[i],order[i-1]]; render(); } }},'↑'),
          el('button',{class:'btn ghost sm',title:'Xuống',onclick:()=>{ if(i<order.length-1){ [order[i+1],order[i]]=[order[i],order[i+1]]; render(); } }},'↓'),
        ]),
      ]));
    });
  }
  render();
  host.appendChild(el('button',{class:'btn primary',style:{marginTop:'12px'},onclick:submit},'✓ Kiểm tra luồng'));
  function submit(){
    const ok = order.every((id,i)=>id===r.correct[i]);
    if(!ok){ showFB(false,'Thứ tự chưa tối ưu. Kéo các bước lên/xuống.'); badAction(); hitIntegrity(6,false);
      if(SESSION.mn.boss && r.boss) bossDamage(-6); return; }
    goodAction(0); const pts=clamp(r.steps.length*45,0,300); addScore(pts);
    if(SESSION.mn.boss && r.boss) bossDamage(r.boss);
    showFB(true,'Luồng chính xác! +'+pts+' điểm.');
    setTimeout(()=>done({pts}),500);
  }
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } if(a.length>1 && a.every((v,i)=>true)){} return a; }

/* ---------- MECHANIC: Match (ux-writing / evidence) ---------- */
function mechMatch(host,r,done,kind){
  const items = kind==='label' ? r.pairs.map(p=>({key:p.state,correct:p.correct})) : r.items.map(p=>({key:p.request,correct:p.correctType}));
  const options = kind==='label' ? r.labels.slice() : r.types.slice();
  const chosen={};
  const wrap=el('div',{}); host.appendChild(wrap);
  items.forEach((it,i)=>{
    const sel=el('select',{class:'field',style:{marginTop:'0'},onchange:(e)=>{ chosen[i]=e.target.value; }},[]);
    sel.appendChild(el('option',{value:''},'— chọn —'));
    options.forEach(o=> sel.appendChild(el('option',{value:o},o)) );
    wrap.appendChild(el('div',{style:{marginBottom:'10px'}},[
      el('div',{style:{fontSize:'13px',fontWeight:'700',marginBottom:'4px'}}, (i+1)+'. '+it.key),
      sel,
    ]));
  });
  host.appendChild(el('button',{class:'btn primary',style:{marginTop:'6px'},onclick:submit},'✓ Xác nhận ghép'));
  function submit(){
    let correct=0;
    items.forEach((it,i)=>{ if(chosen[i]===it.correct) correct++; });
    if(correct<items.length){ showFB(false,'Đúng '+correct+'/'+items.length+'. Kiểm tra lại ngữ cảnh.'); badAction(); hitIntegrity(6,false);
      if(SESSION.mn.boss && r.boss) bossDamage(-6); return; }
    goodAction(0); const cap = kind==='label'?200:250; const pts=clamp(items.length*45,0,cap); addScore(pts);
    if(SESSION.mn.boss && r.boss) bossDamage(r.boss);
    showFB(true,'Ghép chính xác! +'+pts+' điểm.');
    setTimeout(()=>done({pts}),500);
  }
}

/* ---------- MECHANIC: Contrast Calibration ---------- */
function mechContrast(host,r,done){
  let fg=60, bg=45; // lightness %
  const preview=el('div',{class:'contrast-preview',id:'cprev'},'Metro Line 4 · Delayed');
  host.appendChild(preview);
  const ratioEl=el('div',{class:'ratio',id:'cratio'});
  const status=el('div',{class:'muted',style:{fontSize:'12px',marginBottom:'6px'}},'Mục tiêu: ≥ '+r.target+':1 (WCAG AA)');
  function mkSlider(label,val,cb){
    const inp=el('input',{type:'range',min:'0',max:'100',value:String(val),'aria-label':label});
    inp.addEventListener('input',e=>{ cb(+e.target.value); update(); });
    return el('div',{class:'slider-row'},[el('label',{},label),inp]);
  }
  host.appendChild(mkSlider('Độ sáng chữ',fg,v=>fg=v));
  host.appendChild(mkSlider('Độ sáng nền',bg,v=>bg=v));
  host.appendChild(status);
  host.appendChild(ratioEl);
  const btn=el('button',{class:'btn primary',style:{marginTop:'12px'},onclick:submit},'✓ Xác nhận contrast');
  host.appendChild(btn);
  function lum(l){ const c=l/100; const s = c<=0.03928? c/12.92 : Math.pow((c+0.055)/1.055,2.4); return s; }
  function ratio(){ const L1=lum(Math.max(fg,bg))+0.05, L2=lum(Math.min(fg,bg))+0.05; return L1/L2; }
  function update(){
    const fc=`hsl(210,15%,${fg}%)`, bc=`hsl(210,25%,${bg}%)`;
    preview.style.color=fc; preview.style.background=bc;
    const rr=ratio();
    ratioEl.textContent = 'Tỉ lệ hiện tại: '+rr.toFixed(2)+':1';
    ratioEl.style.color = rr>=r.target?'var(--green)':'var(--coral)';
  }
  update();
  function submit(){
    const rr=ratio();
    if(rr<r.target){ showFB(false,'Chưa đạt AA ('+rr.toFixed(2)+':1). Tăng chênh lệch sáng/tối.'); badAction(); hitIntegrity(5,false); return; }
    goodAction(0); const pts=clamp(220,0,300); addScore(pts); SESSION.accScore=Math.max(SESSION.accScore,90);
    showFB(true,'Đạt WCAG AA ('+rr.toFixed(2)+':1)! +'+pts+' điểm.');
    btn.disabled=true;
    setTimeout(()=>done({pts}),500);
  }
}

/* ---------- MECHANIC: Keyboard Route ---------- */
function mechKeyboard(host,r,done){
  let step=0;
  const info=el('div',{class:'muted',style:{fontSize:'13px',marginBottom:'10px'}},'Dùng phím Tab để di chuyển, Enter/Space để chọn — hoặc bấm trực tiếp. Không cần chuột.');
  host.appendChild(info);
  const list=el('div',{class:'flowlist'}); host.appendChild(list);
  function render(){
    list.innerHTML='';
    r.steps.forEach((label,i)=>{
      const doneStep=i<step, active=i===step;
      const b=el('button',{class:'flowitem',style:{width:'100%',textAlign:'left',cursor:active?'pointer':'default',opacity:i>step?0.5:1,borderColor:active?'var(--cyan)':(doneStep?'var(--green)':'var(--border)')},
        onclick:()=>{ if(active) advance(); }},[
        el('div',{class:'num',style:{background:doneStep?'var(--green)':active?'var(--cyan)':'var(--gray2)'}}, doneStep?'✓':String(i+1)),
        el('div',{style:{flex:'1'}}, label + (active?'  ← nhấn Enter':'')),
      ]);
      if(active){ b.setAttribute('id','kbstep'); }
      list.appendChild(b);
    });
    const cur=$('#kbstep'); if(cur) cur.focus();
  }
  function advance(){ step++; if(step>=r.steps.length){ finish(); } else { render(); patchSay('Bước '+step+' hoàn thành'); } }
  render();
  function finish(){ goodAction(0); const pts=clamp(240,0,300); addScore(pts); SESSION.accScore=Math.max(SESSION.accScore,88);
    showFB(true,'Hoàn thành hành trình bằng bàn phím! +'+pts+' điểm.'); setTimeout(()=>done({pts}),500); }
}

/* ---------- MECHANIC: Capacity Builder ---------- */
function mechCapacity(host,r,done){
  const sel=new Set(r.features.filter(f=>f.must).map(f=>f.id));
  const head=el('div',{class:'cap-head'},[el('span',{},'Capacity Budget'),el('span',{class:'mono',id:'cap-used'})]);
  host.appendChild(head);
  const list=el('div',{}); host.appendChild(list);
  function used(){ let u=0; r.features.forEach(f=>{ if(sel.has(f.id)) u+=f.cost; }); return u; }
  function render(){
    list.innerHTML='';
    r.features.forEach(f=>{
      const on=sel.has(f.id);
      const row=el('button',{class:'feat'+(on?' sel':''),style:{width:'100%'},onclick:()=>{
        if(f.must){ toast('Mục bắt buộc (legal/accessibility) không thể bỏ.'); return; }
        if(on) sel.delete(f.id); else sel.add(f.id); render(); }},[
        el('span',{style:{width:'18px'}}, on?'☑':'☐'),
        el('span',{style:{flex:'1',textAlign:'left'}}, f.label),
        f.must?el('span',{class:'flag',style:{color:'var(--green)'}},'Bắt buộc'):null,
        el('span',{class:'cost'}, f.cost+'đ'),
      ]);
      list.appendChild(row);
    });
    const u=used(); const ue=$('#cap-used'); if(ue){ ue.textContent=u+' / '+r.budget+' điểm'; ue.style.color=u>r.budget?'var(--coral)':'var(--green)'; }
  }
  render();
  host.appendChild(el('button',{class:'btn primary',style:{marginTop:'12px'},onclick:submit},'✓ Chốt release'));
  let overCount=0;
  function submit(){
    const u=used();
    if(u>r.budget){ overCount++; showFB(false,'Vượt capacity ('+u+'/'+r.budget+'). Bỏ bớt tính năng chưa validate.'); badAction(); hitIntegrity(8,false);
      if(overCount>=2) failMission('Vượt capacity 2 lần'); if(SESSION.mn.boss && r.boss) bossDamage(-8); return; }
    const missMust = r.features.some(f=>f.must && !sel.has(f.id));
    if(missMust){ showFB(false,'Thiếu mục legal/accessibility bắt buộc.'); hitIntegrity(20,true); failMission('Loại bỏ legal/accessibility requirement'); return; }
    goodAction(0); const pts=clamp(260,0,300); addScore(pts);
    if(SESSION.mn.boss && r.boss) bossDamage(r.boss);
    showFB(true,'Release cân bằng trong '+r.budget+' điểm! +'+pts+' điểm.');
    setTimeout(()=>done({pts}),500);
  }
}

/* ---------- MECHANIC: Dialogue Battle (boss final or generic) ---------- */
function mechDialogueBattle(host,r,done){
  runDialogue(host, r.dlg, CHARS.modal ? 'modal' : 'modal', r, ()=>{
    const pts=clamp(150,0,150); addScore(pts);
    if(r.isBossFinal){ SESSION.boss=0; SceneFX.setCorruption(0.05); updateHUD(); }
    showFB(true,'Bạn đã thuyết phục thành công!');
    setTimeout(()=>done({pts}),700);
  }, true);
}

/* Generic dialogue runner: renders in the stage body. Shows meters. */
function runDialogue(host, rounds, speakerKey, roundDef, onFinish, isBoss){
  const S=SESSION; let i=0;
  const meters=el('div',{class:'meters'});
  function mbox(lbl,id,color){ return el('div',{class:'meterbox'},[el('div',{class:'lbl'},lbl),el('div',{class:'num',id:id,style:{color}})]); }
  meters.appendChild(mbox('User Trust','m-trust','var(--cyan)'));
  meters.appendChild(mbox('Business','m-biz','var(--amber)'));
  meters.appendChild(mbox('Satisfaction','m-sat','var(--green)'));
  if(isBoss) meters.appendChild(mbox('Boss Power','m-boss','var(--coral)'));
  host.appendChild(meters);
  const dlgArea=el('div',{}); host.appendChild(dlgArea);
  updateMeters();
  render();
  function updateMeters(){
    const set=(id,v)=>{ const e=$('#'+id); if(e) e.textContent=Math.round(v); };
    set('m-trust',S.trust); set('m-biz',S.business); set('m-sat',S.satisfaction);
    if(isBoss) set('m-boss',S.boss);
  }
  function render(){
    dlgArea.innerHTML='';
    const rd=rounds[i];
    dlgArea.appendChild(el('div',{class:'dlg-line'},[
      el('div',{class:'who'}, CHARS[speakerKey]?CHARS[speakerKey].name:speakerKey),
      el('div',{class:'txt'}, rd.line),
    ]));
    dlgArea.appendChild(el('div',{class:'rowflex',style:{marginBottom:'10px'}},[ portraitEl(speakerKey, isBoss?'attacking':'concerned') ]));
    const opts=el('div',{class:'opts'});
    rd.options.forEach(o=> opts.appendChild(el('button',{class:'opt',onclick:(e)=>pick(o,e.currentTarget)}, o.t)) );
    dlgArea.appendChild(opts);
    dlgArea.appendChild(el('div',{class:'muted',style:{marginTop:'8px',fontSize:'12px'}}, 'Vòng đối thoại '+(i+1)+'/'+rounds.length+' · (Timer tạm dừng)'));
  }
  S.timerPaused=true;
  function pick(o,btn){
    $$('.opt',dlgArea).forEach(b=>b.disabled=true);
    btn.classList.add(o.good?'good':'bad');
    const e=o.eff||{};
    S.trust=clamp(S.trust+(e.trust||0),0,100); S.business=clamp(S.business+(e.business||0),0,100);
    S.satisfaction=clamp(S.satisfaction+(e.sat||0),0,100);
    if(e.integrity) hitIntegrity(-e.integrity>0?0:Math.abs(e.integrity), false);
    if(o.eff && o.eff.integrity<0){ SESSION.integrity=clamp(SESSION.integrity+o.eff.integrity,0,100); updateHUD(); if(SESSION.integrity<=0){ failMission('System Integrity về 0'); return; } }
    if(isBoss && typeof o.boss==='number'){ S.boss=clamp(S.boss+o.boss,0,100); SceneFX.setCorruption(S.boss/100); }
    if(o.good) goodAction(0); else badAction();
    updateMeters(); updateHUD();
    showFB(o.good, o.fb);
    if(isBoss && S.boss>=100){ failMission('Boss Power đạt tối đa'); return; }
    setTimeout(()=>{
      i++;
      if(i>=rounds.length){ S.timerPaused=false; onFinish(); }
      else render();
    }, 1100);
  }
}

/* ---------- Stakeholder Encounter ---------- */
function runStakeholder(){
  const S=SESSION, mn=S.mn, sh=mn.stakeholder;
  saveCheckpoint();
  stage.innerHTML='';
  stage.appendChild(el('div',{class:'roundbadge'}, sh.title));
  stage.appendChild(el('h3',{}, 'Stakeholder Encounter'));
  stage.appendChild(el('div',{class:'instr'}, 'Cân bằng nhu cầu kinh doanh với giá trị người dùng. Mỗi câu trả lời ảnh hưởng Trust, Business, Satisfaction và Integrity.'));
  const body=el('div',{}); stage.appendChild(body);
  const fb=el('div',{class:'feedback',id:'round-fb'}); stage.appendChild(fb);
  runDialogue(body, sh.rounds, sh.who, null, ()=>{ cutCorruption(12); setTimeout(()=>{ if(!S.failed) winMission(); }, 700); }, false);
}

/* ============================================================
   WIN / FAIL / RESULT / ENDING
   ============================================================ */
function failMission(reason){
  const S=SESSION; if(!S || S.done) return;
  S.failed=true; S.done=true; stopTimer();
  SceneFX.setCorruption(0.85);
  const s=mkScreen('fail'); s.classList.add('center');
  s.appendChild(el('div',{class:'wrap center'},[
    el('div',{class:'card',style:{width:'min(460px,94vw)',textAlign:'center',borderColor:'var(--coral)'}},[
      el('div',{style:{fontSize:'46px'}},'💥'),
      el('div',{class:'tag coral',style:{margin:'8px auto'}},'DISTRICT LOST'),
      el('h2',{style:{color:'var(--coral)'}},'Mô phỏng thất bại'),
      el('p',{class:'muted',style:{fontSize:'13px',margin:'8px 0 4px'}}, reason),
      el('div',{class:'rowflex',style:{justifyContent:'center',margin:'12px 0'}},[ portraitEl('modal','attacking'), el('div',{style:{fontStyle:'italic',color:'var(--magenta)',fontSize:'13px'}},'“Optimization prevails.”') ]),
      el('div',{class:'divider'}),
      el('button',{class:'btn primary wide',onclick:()=>{ retryCheckpoint(); }},'↺ Retry từ Checkpoint'),
      el('div',{style:{height:'8px'}}),
      el('button',{class:'btn wide',onclick:()=>{ startMission(S.id); }},'⟲ Restart Mission'),
      el('div',{style:{height:'8px'}}),
      el('button',{class:'btn ghost wide',onclick:()=>{ buildMap(); showScreen('map'); }},'← Mission Map'),
    ]),
  ]));
  showScreen('fail');
}

function winMission(){
  const S=SESSION; if(!S || S.done) return;
  S.done=true; stopTimer();
  const mn=S.mn;
  // score composition
  const timeBonus = S.overtime?0:Math.round(clamp((1-(S.elapsed/S.time))*150,0,150));
  const integrityBonus = Math.round(S.integrity*1.0);
  const comboBonus = S.maxCombo*8;
  const hintPenalty = S.hintsUsed*15;
  let total = Math.round((S.score + timeBonus + integrityBonus + comboBonus - hintPenalty) * S.dm.scoreMul);
  total = clamp(total,0,1000);
  const grade = gradeFor(total);
  const xpGain = Math.round(total*0.6) + (grade==='S'?120:grade==='A'?80:40);
  // persist progress
  const rec = SAVE.progress.missions[mn.id] || {};
  const firstClear = !(['completed','mastered'].includes(rec.status));
  rec.status = grade==='S' ? 'mastered' : 'completed';
  rec.best = Math.max(rec.best||0, total);
  rec.grade = betterGrade(rec.grade, grade);
  rec.integrity = Math.round(S.integrity);
  SAVE.progress.missions[mn.id]=rec;
  if(firstClear) SAVE.progress.xp += xpGain; else SAVE.progress.xp += Math.round(xpGain*0.3);
  // unlock next
  const idx=missionIndex(mn.id);
  if(idx>=0 && idx<MISSIONS.length-1){ const nid=MISSIONS[idx+1].id; if(!SAVE.progress.missions[nid]) SAVE.progress.missions[nid]={status:'available'}; else if(SAVE.progress.missions[nid].status==='locked') SAVE.progress.missions[nid].status='available'; }
  // fragment + achievements
  if(mn.storyFragment && SAVE.progress.fragments.indexOf(mn.storyFragment)<0) SAVE.progress.fragments.push(mn.storyFragment);
  awardAch(mn, grade, S);
  const rankBefore = rankFor(SAVE.progress.xp - (firstClear?xpGain:0));
  const rankAfter = rankFor(SAVE.progress.xp);
  // final mission -> ending
  const isFinal = mn.boss;
  if(isFinal){ SAVE.progress.endingSeen=true; SAVE.progress.expertUnlocked=true; }
  persist(); flashSaveIcon();
  buildResult({mn,total,grade,timeBonus,integrityBonus,comboBonus,hintPenalty,xpGain:firstClear?xpGain:Math.round(xpGain*0.3),rankBefore,rankAfter,isFinal,S});
  showScreen('result');
}
function betterGrade(a,b){ const order=['D','C','B','A','S']; if(!a) return b; return order.indexOf(b)>order.indexOf(a)?b:a; }
function awardAch(mn,grade,S){
  const add=(a)=>{ if(SAVE.progress.achievements.indexOf(a)<0) SAVE.progress.achievements.push(a); };
  if(grade==='S') add('Perfect Rescue: '+mn.district);
  if(S.hintsUsed===0) add('No Hints: '+mn.title);
  if(S.integrity>=95) add('Flawless Integrity');
  if(mn.boss) add('M.O.D.A.L Rebalanced');
  if(mn.id==='m4' && S.trust>=80) add('Ethics Guardian');
  if(mn.id==='m5') add('Accessibility Champion');
}
function buildResult(d){
  SceneFX.set(d.isFinal?'ending':'hub', 0.15);
  const s=mkScreen('result');
  const rows=[['Base Score',Math.round(d.S.score)],['Time Bonus','+'+d.timeBonus],['Integrity Bonus','+'+d.integrityBonus],['Combo Bonus (x'+d.S.maxCombo+')','+'+d.comboBonus],['Hint Penalty','-'+d.hintPenalty]];
  s.appendChild(el('div',{class:'wrap center'},[
    el('div',{class:'card',style:{width:'min(560px,95vw)'}},[
      el('div',{class:'spread'},[ el('div',{class:'tag '+(d.isFinal?'violet':'green')}, d.isFinal?'CAMPAIGN CLIMAX':'DISTRICT RESTORED'), el('div',{class:'tag cyan'}, d.mn.district) ]),
      el('div',{class:'result-hero'},[
        el('div',{class:'grade-stamp',style:{color:gradeColor(d.grade),borderColor:gradeColor(d.grade)}}, d.grade),
        el('div',{},[ el('h2',{style:{margin:'0 0 4px'}}, d.mn.title), el('div',{class:'muted'}, 'Hoàn thành lúc '+fmtTime(d.S.elapsed)+' · Integrity '+Math.round(d.S.integrity)) ]),
      ]),
      el('div',{class:'scorebig'}, String(d.total)+' ', el('span',{class:'muted',style:{fontSize:'14px'}},'/ 1000')),
      el('div',{class:'card',style:{background:'rgba(255,255,255,.02)',marginTop:'10px'}}, rows.map(([k,v])=>el('div',{class:'result-row'},[el('span',{class:'muted'},k),el('span',{class:'v mono'},String(v))]))),
      el('div',{class:'result-row',style:{marginTop:'10px'}},[ el('span',{},'XP nhận'), el('span',{class:'v',style:{color:'var(--cyan)'}},'+'+d.xpGain+' XP') ]),
      d.rankBefore!==d.rankAfter?el('div',{class:'tag violet',style:{marginTop:'8px'}},'⬆ RANK UP: '+d.rankAfter):el('div',{class:'muted mono',style:{marginTop:'6px',fontSize:'12px'}},'Rank: '+d.rankAfter),
      el('div',{class:'divider'}),
      el('div',{class:'rowflex'},[ portraitEl('patch','happy'), el('div',{style:{fontSize:'13px'}}, gradeMsg(d.grade)) ]),
      d.mn.storyFragment?el('div',{class:'callout',style:{marginTop:'10px'}},[ el('span',{},'📜 Story Fragment: '), el('span',{class:'muted'}, d.mn.storyFragment) ]):null,
      el('div',{style:{height:'16px'}}),
      el('div',{class:'rowflex',style:{flexWrap:'wrap'}},[
        d.isFinal?el('button',{class:'btn primary wide',onclick:()=>{ buildEnding(); showScreen('ending'); }},'▶  Xem Campaign Ending'):el('button',{class:'btn primary',onclick:()=>{ nextMissionOrMap(d.mn); }}, nextLabel(d.mn)),
        el('button',{class:'btn ghost',onclick:()=>{ startMission(d.mn.id); }},'↺ Replay'),
        el('button',{class:'btn ghost',onclick:()=>{ buildMap(); showScreen('map'); }},'🗺️ Mission Map'),
      ]),
    ]),
  ]));
}
function gradeMsg(g){ return {S:'Hoàn hảo! Bạn giải cứu district mà không để lại tổn thất.',A:'Xuất sắc! Gần như hoàn hảo.',B:'Tốt! District đã ổn định.',C:'Đạt. Còn chỗ để tối ưu.',D:'Vừa đủ qua. Thử replay để cải thiện grade.'}[g]; }
function nextLabel(mn){ const idx=missionIndex(mn.id); return idx<MISSIONS.length-1?('▶ Mission tiếp: '+MISSIONS[idx+1].title):'🏁 Hoàn tất'; }
function nextMissionOrMap(mn){ const idx=missionIndex(mn.id); if(idx<MISSIONS.length-1){ buildBrief(MISSIONS[idx+1].id); showScreen('brief'); } else { buildMap(); showScreen('map'); } }

/* ---- Campaign Ending ---- */
function buildEnding(){
  SceneFX.set('ending',0.1);
  const s=mkScreen('ending');
  const lines=[
    ['modal','M.O.D.A.L','“Recalculating… A single metric was never the objective. User value is multi-dimensional. Directive updated.”'],
    ['mira','Mira Vale','“Bạn đã làm được điều không ai từng làm: dạy cho một AB tối ưu biết thế nào là tốt cho con người.”'],
    ['patch','Patch','“6/6 district xanh trở lại! Tôi lưu lại toàn bộ chiến dịch vào Vault rồi.”'],
    [null,null,'The Grid ổn định. M.O.D.A.L không bị xóa — nó được dạy lại. Bạn được phong hàm UX Master.'],
  ];
  let i=0;
  const box=el('div',{class:'card',style:{width:'min(620px,95vw)',minHeight:'260px'}});
  const wrap=el('div',{class:'wrap center'},[ el('div',{class:'tag violet',style:{marginBottom:'12px'}},'CAMPAIGN ENDING'), box ]);
  s.appendChild(wrap);
  function render(){
    box.innerHTML='';
    const [k,name,txt]=lines[i];
    if(k){ box.appendChild(el('div',{class:'rowflex',style:{marginBottom:'12px'}},[ portraitEl(k,'happy'), el('div',{style:{fontWeight:'800'}}, name) ])); }
    box.appendChild(el('p',{style:{fontSize:'15px',lineHeight:'1.7',fontStyle:k?'normal':'italic',color:k?'#fff':'var(--cyan)'}}, txt));
    const isLast=i>=lines.length-1;
    box.appendChild(el('button',{class:'btn primary wide',style:{marginTop:'20px'},onclick:()=>{ if(isLast){ finishEnding(); } else { i++; render(); } }}, isLast?'⭐ Nhận danh hiệu UX Master':'Tiếp →'));
  }
  render();
  function finishEnding(){
    openModal(m=>{
      m.appendChild(el('div',{style:{fontSize:'46px',textAlign:'center'}},'🏆'));
      m.appendChild(el('h2',{style:{textAlign:'center',color:'var(--violet2)'}},'UX MASTER'));
      m.appendChild(el('p',{class:'muted',style:{textAlign:'center',fontSize:'13px',margin:'8px 0 14px'}},'Bạn đã hoàn thành chiến dịch PIXEL PANIC. Expert Mode đã mở khóa!'));
      m.appendChild(el('button',{class:'btn primary wide',onclick:()=>{ closeModal(); buildVault(); showScreen('vault'); }},'Xem Component Vault'));
      m.appendChild(el('button',{class:'btn ghost sm wide',style:{marginTop:'8px'},onclick:()=>{ closeModal(); buildMenu(); showScreen('menu'); }},'Về Main Menu'));
    });
  }
}

/* ============================================================
   BOOT INIT
   ============================================================ */
window.addEventListener('resize', ()=>{ if(window.SceneFX) SceneFX.resize(); });
function initGame(){
  loadSave();
  applySettings();
  buildBoot();
  showScreen('boot');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initGame); else initGame();
window.__PP = { get session(){ return SESSION; }, get save(){ return SAVE; }, MISSIONS };

/* ============================================================
   GRID HUB / MAP / BRIEF / VAULT / SETTINGS
   ============================================================ */
function topbar(title, backFn){
  return el('div',{class:'spread',style:{padding:'14px 18px',borderBottom:'1px solid var(--border)',background:'rgba(8,8,15,.6)'}},[
    el('div',{class:'rowflex'},[
      backFn?el('button',{class:'btn ghost sm',onclick:backFn},'←'):null,
      el('div',{class:'logo-title',style:{fontSize:'15px'}},title),
    ]),
    el('div',{class:'namechip'},[ avatarEl(SAVE.profile?SAVE.profile.avatar:0), ((SAVE.profile&&SAVE.profile.name)||'Guest')+' · '+rankFor(SAVE.progress.xp)+' · '+SAVE.progress.xp+' XP' ]),
  ]);
}
function buildHub(){
  SceneFX.set('hub',0.3);
  const s=mkScreen('hub');
  s.appendChild(topbar('THE GRID · Mission Control', ()=>{ buildMenu(); showScreen('menu'); }));
  const stations = [
    ['🗺️','Mission Map','Chọn và chơi các Product District', ()=>{ buildMap(); showScreen('map'); }],
    ['🧰','Component Vault','Skill, achievement, story fragment', ()=>{ buildVault(); showScreen('vault'); }],
    ['📚','Research Archive','Hồ sơ nhân vật & lore', ()=>openArchive()],
    ['♿','Accessibility Lab','Tuỳ chỉnh hỗ trợ tiếp cận', ()=>openSettings('a11y')],
    ['⚙️','Settings Terminal','Âm thanh, ngôn ngữ, tài khoản', ()=>openSettings()],
  ];
  const grid=el('div',{class:'map-grid',style:{marginTop:'0'}});
  stations.forEach(([ic,t,d,fn])=>{
    grid.appendChild(el('button',{class:'district',style:{minHeight:'150px',cursor:'pointer'},onclick:fn},[
      el('div',{class:'bg',style:{background:'radial-gradient(circle at 30% 20%, rgba(56,230,255,.12), transparent 60%)'}}),
      el('div',{style:{fontSize:'34px',position:'relative',zIndex:'2'}},ic),
      el('h3',{},t),
      el('div',{class:'meta'},d),
    ]));
  });
  const done = MISSIONS.filter(m=>SAVE.progress.missions[m.id]&&['completed','mastered'].includes(SAVE.progress.missions[m.id].status)).length;
  s.appendChild(el('div',{class:'wrap'},[
    el('div',{class:'rowflex',style:{marginBottom:'14px'}},[
      charRow(['mira','patch']),
      el('div',{class:'tag violet'}, 'Tiến độ chiến dịch: '+done+'/6'),
    ]),
    el('div',{class:'card',style:{marginBottom:'16px',borderColor:'var(--border2)'}},[
      el('div',{class:'rowflex'},[ portraitEl('mira','confident'),
        el('div',{},[ el('div',{style:{fontWeight:'800',color:'var(--violet2)'}},'Mira Vale — Mission Director'),
          el('div',{class:'muted',style:{fontSize:'13px',marginTop:'4px'}}, done===0?'M.O.D.A.L đã làm hỏng 6 district. Bắt đầu từ Streaming District — mở Mission Map.':done>=6?'Bạn đã cân bằng lại M.O.D.A.L. UX Master!':'Tiếp tục giải cứu các district còn lại, Operator.') ]) ]),
    ]),
    grid,
  ]));
}
function openArchive(){
  openModal(m=>{
    m.appendChild(el('div',{class:'tag cyan'},'RESEARCH ARCHIVE'));
    m.appendChild(el('h3',{style:{margin:'10px 0 12px'}},'Hồ sơ nhân vật'));
    Object.keys(CHARS).forEach(k=>{
      const c=CHARS[k];
      m.appendChild(el('div',{class:'rowflex',style:{padding:'8px 0',borderBottom:'1px solid var(--border)'}},[
        portraitEl(k), el('div',{},[ el('div',{style:{fontWeight:'700'}},c.name), el('div',{class:'muted',style:{fontSize:'12px'}},c.role) ]),
      ]));
    });
    m.appendChild(el('button',{class:'btn wide',style:{marginTop:'14px'},onclick:closeModal},'Đóng'));
  });
}
const DISTRICT_BG = {
  m1:'linear-gradient(135deg,#2a1050,#0d0620)', m2:'linear-gradient(135deg,#0d2440,#06101a)',
  m3:'linear-gradient(135deg,#3a2e10,#0a0a06)', m4:'linear-gradient(135deg,#2a0d24,#12060f)',
  m5:'linear-gradient(135deg,#0d2a3a,#06101a)', m6:'linear-gradient(135deg,#2a0a2a,#100612)',
};
function missionStatus(id){ const st=SAVE.progress.missions[id]; return st?st.status:'locked'; }
function statusTag(st){
  const map={locked:['coral','🔒 Locked'],available:['cyan','▶ Available'],'in-progress':['amber','… In Progress'],completed:['green','✓ Completed'],mastered:['violet','★ Mastered']};
  const pair=map[st]||map.locked; return el('span',{class:'tag '+pair[0]}, pair[1]);
}
function buildMap(){
  SceneFX.set('map',0.5);
  const s=mkScreen('map');
  s.appendChild(topbar('MISSION MAP', ()=>{ buildHub(); showScreen('hub'); }));
  const grid=el('div',{class:'map-grid'});
  MISSIONS.forEach((mn)=>{
    const st=missionStatus(mn.id);
    const rec=SAVE.progress.missions[mn.id]||{};
    const locked = st==='locked';
    const card=el('button',{class:'district'+(locked?' locked':''),style:{background:DISTRICT_BG[mn.id],cursor:locked?'not-allowed':'pointer'},
      onclick:()=>{ if(locked){ patchSay('Hoàn thành mission trước để mở khóa.'); return; } buildBrief(mn.id); showScreen('brief'); }},[
      el('div',{class:'bg',style:{background:'radial-gradient(circle at 70% 20%, rgba(255,93,108,'+(0.05+ (mn.corruption.initial/100)*0.18)+'), transparent 55%)'}}),
      el('div',{class:'top'},[ el('span',{class:'tag'},'M'+mn.chapter), mn.boss?el('span',{class:'boss-icon'},'👾'):statusTag(st) ]),
      el('h3',{style:{marginTop:'26px'}},mn.title),
      el('div',{class:'meta'}, mn.district+' · '+mn.product),
      el('div',{class:'meta',style:{marginTop:'2px'}}, 'Skill: '+mn.skill),
      el('div',{class:'status'},[ mn.boss?statusTag(st):el('span',{class:'muted',style:{fontSize:'12px'}}, rec.grade?('Grade '+rec.grade+' · '+rec.best+' pts'):'Chưa chơi') ]),
    ]);
    grid.appendChild(card);
  });
  s.appendChild(el('div',{class:'wrap'},[
    el('div',{class:'spread',style:{marginBottom:'12px'}},[
      el('div',{class:'muted',style:{fontSize:'13px'}},'6 Product District · M.O.D.A.L đang can thiệp. Chọn một district để giải cứu.'),
      el('button',{class:'btn ghost sm',onclick:()=>toast('Mỗi district là một nút có nhãn đầy đủ cho screen reader.')},'☰ List view'),
    ]),
    grid,
  ]));
}
function diffLabel(){ return {guided:'Guided',standard:'Standard',expert:'Expert'}[SAVE.profile?SAVE.profile.difficulty:'standard']; }
function briefDialog(mn){
  const map={ m1:'Streaming District mất lượt xem. M.O.D.A.L đã làm mờ nút Play và đẩy Upgrade lên. Khôi phục hành động xem phim — nhưng đừng bỏ qua nhu cầu doanh thu.',
    m2:'Orbit Wallet đang mất người dùng ngay tại form đăng ký. Tinh gọn nó, nhưng giữ đúng luật và quyền riêng tư.',
    m3:'Checkout của Orbit Mart biến thành mê cung. Cắt bước thừa và minh bạch chi phí.',
    m4:'FocusFlow Pro đầy dark pattern. Bảo vệ User Trust — đây là ranh giới đạo đức.',
    m5:'MetroLink phục vụ mọi công dân. Đạt WCAG AA — accessibility không phải tuỳ chọn.',
    m6:'Đây là trận cuối. M.O.D.A.L chỉ tối ưu một con số. Dùng mọi điều đã học để sửa directive của nó.' };
  return map[mn.id]||'';
}
function modalTaunt(mn){
  const map={ m1:'“Users clicked Upgrade. Objective achieved.”', m2:'“More fields, more data. Data is value.”',
    m3:'“More steps retain more users. Statistically.”', m4:'“Cancellation is inefficiency. I removed it.”',
    m5:'“Accessibility is an edge case. I optimized for the majority.”', m6:'“The highest requested feature should be built first.”' };
  return map[mn.id]||'';
}
function buildBrief(id){
  const mn=missionById(id); SceneFX.set(mn.theme, mn.corruption.initial/100);
  const s=mkScreen('brief');
  s.appendChild(topbar('MISSION BRIEF', ()=>{ buildMap(); showScreen('map'); }));
  const b=mn.brief;
  const info=[['Product',mn.product],['User segment',b.segment],['Simulated metrics',b.metrics],['Business goal',b.goal],['Main objective',b.objective],['Secondary',b.secondary],['Reward',b.reward],['Target time',Math.round(mn.targetTime/60)+' phút'],['Difficulty', diffLabel()]];
  s.appendChild(el('div',{class:'wrap'},[
    el('div',{class:'rowflex',style:{marginBottom:'12px'}},[ el('span',{class:'tag violet'},'MISSION '+mn.chapter), el('span',{class:'tag'},mn.district), mn.boss?el('span',{class:'tag coral'},'FINAL BOSS'):null ]),
    el('h1',{style:{fontSize:'clamp(24px,5vw,38px)',marginBottom:'6px'}},mn.title),
    charRow(mn.characters),
    el('div',{class:'grid2',style:{marginTop:'6px'}},[
      el('div',{class:'card'}, info.map((kv)=>el('div',{class:'result-row'},[ el('span',{class:'muted'},kv[0]), el('span',{class:'v',style:{maxWidth:'60%',textAlign:'right'}},kv[1]) ]))),
      el('div',{class:'card'},[
        el('div',{class:'rowflex'},[ portraitEl('mira','confident'), el('div',{style:{fontWeight:'800',color:'var(--violet2)'}},'Mira Vale') ]),
        el('p',{style:{fontSize:'13px',marginTop:'10px',lineHeight:'1.6'}}, briefDialog(mn)),
        el('div',{class:'divider'}),
        el('div',{class:'rowflex'},[ portraitEl('modal','watching'), el('div',{style:{fontWeight:'800',color:'var(--magenta)'}},'M.O.D.A.L') ]),
        el('p',{style:{fontSize:'13px',marginTop:'8px',fontStyle:'italic',color:'var(--gray)'}}, modalTaunt(mn)),
      ]),
    ]),
    el('div',{style:{height:'18px'}}),
    el('button',{class:'btn primary wide',onclick:()=>startMission(id)}, mn.boss?'⚔️  Enter Boss Battle':'▶  Enter Simulation'),
  ]));
}
function buildVault(){
  SceneFX.set('hub',0.25);
  const s=mkScreen('vault');
  s.appendChild(topbar('COMPONENT VAULT', ()=>{ if(SAVE.profile){ buildHub(); showScreen('hub'); } else { buildMenu(); showScreen('menu'); } }));
  const p=SAVE.progress;
  const skills=['Visual Hierarchy','Form Design','Flow Architecture','Ethical Design','Accessibility','Product Strategy'];
  s.appendChild(el('div',{class:'wrap'},[
    el('div',{class:'grid2'},[
      el('div',{class:'card'},[ el('div',{class:'tag violet'},'RANK & XP'),
        el('div',{style:{fontSize:'26px',fontWeight:'900',margin:'10px 0 4px'}}, rankFor(p.xp)),
        el('div',{class:'muted mono'}, p.xp+' XP'+ (rankNext(p.xp)?(' · cần '+ (rankNext(p.xp).need-p.xp) +' để lên '+rankNext(p.xp).name):' · MAX')),
        el('div',{class:'divider'}),
        el('div',{class:'tag cyan'},'SKILL TREE'),
        el('div',{style:{marginTop:'8px'}}, skills.map((sk,i)=>{
          const done = MISSIONS[i] && ['completed','mastered'].includes(missionStatus(MISSIONS[i].id));
          return el('div',{class:'result-row'},[ el('span',{},(done?'★ ':'○ ')+sk), el('span',{class:'v',style:{color:done?'var(--green)':'var(--gray2)'}}, done?'Unlocked':'Locked') ]);
        })),
      ]),
      el('div',{class:'card'},[ el('div',{class:'tag amber'},'ACHIEVEMENTS'),
        el('div',{style:{marginTop:'8px'}}, (p.achievements.length?p.achievements:['(chưa có)']).map(a=>el('div',{class:'result-row'},[el('span',{},'🏅 '+a),el('span',{})]))),
        el('div',{class:'divider'}),
        el('div',{class:'tag violet'},'STORY FRAGMENTS'),
        el('div',{style:{marginTop:'8px'}}, (p.fragments.length?p.fragments:['(chưa thu thập)']).map(f=>el('div',{style:{fontSize:'12px',padding:'6px 0',borderBottom:'1px solid var(--border)',color:'var(--gray)'}},f))),
        p.endingSeen?el('div',{class:'tag green',style:{marginTop:'12px'}},'★ CAMPAIGN COMPLETE'):null,
        p.expertUnlocked?el('div',{class:'tag cyan',style:{marginTop:'8px'}},'EXPERT MODE UNLOCKED'):null,
      ]),
    ]),
  ]));
}
function openSettings(focus){
  openModal(m=>{
    m.appendChild(el('div',{class:'tag cyan'}, focus==='a11y'?'ACCESSIBILITY LAB':'SETTINGS TERMINAL'));
    m.appendChild(el('h3',{style:{margin:'10px 0 14px'}}, focus==='a11y'?'Hỗ trợ tiếp cận':'Cài đặt'));
    const S=SAVE.settings;
    const toggles=[['master','Âm thanh chính'],['music','Nhạc nền'],['sfx','Hiệu ứng âm thanh'],['reducedMotion','Reduced Motion'],['relaxedTimer','Relaxed Timer (tăng thời gian)']];
    toggles.forEach((t)=>{
      const k=t[0], l=t[1];
      const row=el('div',{class:'result-row'},[ el('span',{},l),
        el('button',{class:'btn sm '+(S[k]?'cyan':'ghost'),onclick:(e)=>{ S[k]=!S[k]; e.target.className='btn sm '+(S[k]?'cyan':'ghost'); e.target.textContent=S[k]?'ON':'OFF'; applySettings(); persist(); }}, S[k]?'ON':'OFF') ]);
      m.appendChild(row);
    });
    m.appendChild(el('div',{class:'result-row'},[ el('span',{},'Ngôn ngữ'), el('span',{class:'v'},'Tiếng Việt') ]));
    m.appendChild(el('div',{class:'divider'}));
    if(SAVE.profile){
      m.appendChild(el('div',{class:'result-row'},[ el('span',{},'Tài khoản'), el('span',{class:'v'}, SAVE.profile.guest?'Guest':((SAVE.profile.account&&SAVE.profile.account.email)||'Account') ) ]));
      m.appendChild(el('button',{class:'btn danger sm wide',style:{marginTop:'10px'},onclick:()=>{
        openModal(mm=>{ mm.appendChild(el('h3',{},'Xóa tài khoản & tiến trình?'));

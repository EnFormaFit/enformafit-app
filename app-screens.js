// ── MEAL CONSTANTS ──────────────────────────────────────────────────────────
var _MEAL_BASE_MAP={desayuno_extra:'desayuno',snack_am:'snack',snack_pm:'snack',post_entreno:'snack',comida_extra:'comida',cena_extra:'cena'};
var _MEAL_ORDER=['desayuno','comida','cena','snack','desayuno_extra','snack_am','snack_pm','comida_extra','cena_extra','post_entreno'];
var _MEAL_NAMES={desayuno:'🌅 Desayuno',comida:'☀️ Comida',cena:'🌙 Cena',snack:'🍎 Snack',snack_am:'🍎 Snack mañana',snack_pm:'🍎 Snack tarde',post_entreno:'💪 Post-entreno',desayuno_extra:'🌅 Desayuno extra',comida_extra:'☀️ Comida extra',cena_extra:'🌙 Cena extra'};

// ── ENTRENO ──
let curDay=null,_entTX=0;

function renderEntreno(){
  if(!ST.ejStates)ST.ejStates={};
  if(curDay===null){
    var _todayIdx=[6,0,1,2,3,4,5][new Date().getDay()];
    if(DIAS[_todayIdx]&&!DIAS[_todayIdx].rest){
      curDay=_todayIdx;
    } else {
      curDay=DIAS.findIndex(function(d){return !d.rest;});
      if(curDay<0)curDay=0;
    }
  }
  if(!ST.semVer)ST.semVer=ST.u.semana||1;
  var sem=ST.semVer;
  var di=curDay;
  var cacheKey=sem+'_'+di;
  // Always fill ejStates from cache (may be empty if not loaded yet)
  _fillEjStatesFromCache(di, sem);
  // If not in cache yet, load from BD then re-render
  if(ENT_CACHE[cacheKey]===undefined){
    ENT_CACHE[cacheKey]=null; // mark as loading
    (function(capturedSem, capturedDi){
      cargarRegistrosSemDia(capturedSem, capturedDi, function(){
        cargarRegistrosAnt(capturedSem, capturedDi, function(){
          _fillEjStatesFromCache(capturedDi, capturedSem);
          // Re-render if still on entreno screen (any day/sem)
          var ct=document.getElementById('ct');
          if(ct&&ct.querySelector('.ent-wrap')){
            _fillEjStatesFromCache(curDay,ST.semVer);
            ct.innerHTML=buildEntHTML(curDay);
          }
        });
      });
    })(sem, di);
  }
  return buildEntHTML(di);
}

function _fillEjStatesFromCache(di,sem){
  var cacheKey=sem+'_'+di;
  var data=ENT_CACHE[cacheKey]||{};
  var hasData=Object.keys(data).length>0;
  DIAS[di]&&DIAS[di].ejercicios&&DIAS[di].ejercicios.forEach(function(ej,ei){
    var key=di+'_'+ei;
    var existing=ST.ejStates[key];
    // Rebuild if: wrong sem, doesn't exist, OR cache has data but fields are empty
    var needsRebuild=!existing||existing._sem!==sem;
    if(!needsRebuild&&hasData){
      var allEmpty=existing.series.every(function(s){return !s.kg&&!s.repsH;});
      if(allEmpty)needsRebuild=true;
    }
    if(needsRebuild){
      var series=Array.from({length:ej.sets||3},function(_,si){
        var rec=data&&data[ej.nom+'_'+(si+1)];
        return {
          kg:rec&&rec.kg?String(rec.kg):'',
          repsH:rec&&rec.reps?String(rec.reps):'',
          done:!!(rec&&rec.done),
          rir:rec&&rec.rir!==undefined&&rec.rir!==null?String(rec.rir):''
        };
      });
      ST.ejStates[key]={collapsed:false,rest:ej.rest||120,series:series,_sem:sem};
    }
  });
}

function buildEntHTML(di){
  const d=DIAS[di];
  const todayIdx=[6,0,1,2,3,4,5][new Date().getDay()]||0;
  const semActual=ST.u.semana||1;
  const semTotal=ST.u.semTotal||14;
  // Week selector header
  const semSel=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--az3);border-radius:10px;margin-bottom:10px">
    <button onclick="if(ST.semVer>1){ST.semVer--;ST.ejStates={};buildDIAS(ST.semVer);document.getElementById('ct').innerHTML=renderEntreno();}" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--az);padding:4px 8px" ${(ST.semVer||semActual)<=1?'disabled':''}>‹</button>
    <div style="text-align:center">
      <div style="font-size:13px;font-weight:700;color:var(--az)">Semana ${ST.semVer||semActual} de ${semTotal}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:1px">${getSemanaFechas(ST.semVer||semActual)}</div>
      ${(ST.semVer||semActual)!==semActual?`<div style="font-size:10px;color:var(--nr);font-weight:600">← Semana actual: ${semActual}</div>`:'<div style="font-size:10px;color:var(--t3)">Semana actual</div>'}
    </div>
    <button onclick="if((ST.semVer||1)<${semTotal}){ST.semVer++;ST.ejStates={};buildDIAS(ST.semVer);document.getElementById('ct').innerHTML=renderEntreno();}" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--az);padding:4px 8px" ${(ST.semVer||semActual)>=semTotal?'disabled':''}>›</button>
  </div>
  ${(ST.semVer||semActual)!==semActual?`<div style="background:rgba(255,160,0,.12);border:1px solid rgba(255,160,0,.4);border-radius:8px;padding:8px 12px;margin-bottom:8px;font-size:12px;color:var(--nr);display:flex;justify-content:space-between;align-items:center">
    <span>Viendo S${ST.semVer} — solo lectura</span>
    <button onclick="ST.semVer=${semActual};ST.ejStates={};buildDIAS(ST.semVer);document.getElementById('ct').innerHTML=renderEntreno()" style="background:var(--nr);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">Ir a actual</button>
  </div>`:''}`;
  const dayBtns=DIAS.map((dd,i)=>`<button class="day-b${i===di?' on':''}${i===todayIdx?' today':''}${dd.rest?' rest':''}" onclick="curDay=${i};document.getElementById('ct').innerHTML=buildEntHTML(${i})">${dd.nom}<br><small style="font-size:9px;opacity:.6">${dd.tipo}</small></button>`).join('');

  let body='';
  if(d.rest){
    body=`<div class="card"><div class="cb" style="text-align:center;padding:28px 14px">
      <div style="font-size:48px;margin-bottom:10px">😴</div>
      <div style="font-size:17px;font-weight:700;margin-bottom:8px">Día de descanso</div>
      <div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:12px">El descanso es parte del entrenamiento. Es cuando el músculo crece y se recupera.</div>
      <div class="alert avd" style="text-align:left">💡 Aprovecha para acumular tus <b>${ST.pasos.obj.toLocaleString('es')} pasos</b> diarios y seguir tu plan de nutrición.</div>
    </div></div>`;
  } else {
    const grabIdxs=getGrabarIdxs(di);
    body=d.ejercicios.map((ej,ei)=>renderEj(ej,ei,di,grabIdxs)).join('');
    body+=`<button class="btn btnp btnf" onclick="guardarDia(${di})">Guardar entrenamiento ✓</button>`;
  }
  return`<div style="min-height:100%" ontouchstart="_entTX=event.touches?event.touches[0].clientX:0" ontouchend="swipeEnt(event,${di})">
    ${semSel}
    <div class="day-sticky"><div class="day-sel">${dayBtns}</div></div>
    ${body}
  </div>`;
}

function swipeEnt(e,di){
  if(!e.changedTouches)return;
  const dx=e.changedTouches[0].clientX-_entTX;
  if(Math.abs(dx)<55)return;
  if(dx<0&&di<DIAS.length-1){curDay=di+1;document.getElementById('ct').innerHTML=buildEntHTML(di+1);}
  else if(dx>0&&di>0){curDay=di-1;document.getElementById('ct').innerHTML=buildEntHTML(di-1);}
}

function getGrabarIdxs(di){
  const s=ST.u.semana;
  const seed=Math.floor((s-1)/2);
  const ejs=DIAS[di]?.ejercicios||[];
  if(!ejs.length)return[];
  const idxs=[];
  const n=Math.min(2,ejs.length);
  for(let i=0;i<n;i++){
    const idx=(seed*3+di*7+i*4)%ejs.length;
    if(!idxs.includes(idx))idxs.push(idx);
    else idxs.push((idx+1)%ejs.length);
  }
  return idxs;
}

function renderEj(ej,ei,di,grabIdxs){
  const key=`${di}_${ei}`;
  if(!ST.ejStates[key])ST.ejStates[key]={collapsed:false,rest:ej.rest||120,series:Array.from({length:ej.sets||3},()=>({kg:'',repsH:'',done:false,rir:''})),_sem:ST.semVer||1};
  const st=ST.ejStates[key];
  const esGrabar=(grabIdxs||[]).includes(ei);
  const hist=ST.histEnt&&ST.histEnt[ej.nom]?ST.histEnt[ej.nom]:null;

  if(st.collapsed){
    const done=st.series.filter(s=>s.done).length;
    const kgs=st.series.filter(s=>s.done).map(s=>s.kg||'BW').join('/');
    return`<div class="ejcard">
      <div class="ejhead" onclick="ST.ejStates['${key}'].collapsed=false;document.getElementById('ct').innerHTML=buildEntHTML(${di})">
        <div class="ejnum">${ei+1}</div>
        <div style="flex:1">
          <div class="ejnom">${ej.nom}${esGrabar?' 🎥':''}</div>
          <div class="ejmeta">${ej.sets}×${ej.reps} · RIR ${ej.rir||0}</div>
        </div>
      </div>
      <div class="ej-col">
        <div class="ej-col-info">✅ ${done}/${ej.sets} · ${kgs}kg</div>
        <button class="ej-edit" onclick="ST.ejStates['${key}'].collapsed=false;document.getElementById('ct').innerHTML=buildEntHTML(${di})">Editar</button>
      </div>
    </div>`;
  }

  let sers=`<div class="serwrap">`;
  if(ej.bw)sers+=`<div style="font-size:11px;color:var(--t3);margin-bottom:6px">💡 Deja vacío si es con peso corporal</div>`;
  sers+=`<div class="serhd"><span>#</span><span>Anterior</span><span>Kg</span><span>Reps</span><span>RIR</span><span>✓</span></div>`;
  st.series.forEach((s,si)=>{
    let antKg='—',antReps='';
    const _semVer=ST.semVer||ST.u.semana||1;
    const _antCacheKey=(_semVer-1)+'_'+di;
    const _antData=ENT_CACHE&&ENT_CACHE[_antCacheKey]?ENT_CACHE[_antCacheKey]:{};
    const _antRec=_antData[ej.nom+'_'+(si+1)];
    if(_antRec&&_antRec.kg){antKg=_antRec.kg+'kg';antReps=_antRec.reps?'×'+_antRec.reps:'';}
    sers+=`<div class="serrow">
      <div class="sern">${si+1}</div>
      <div class="serant">${antKg}${antReps}</div>
      <input class="sinp" type="number" inputmode="decimal" placeholder="kg" value="${s.kg}" oninput="ST.ejStates['${key}'].series[${si}].kg=this.value;autoGuardarSerie(${di},${ei},${si})">
      <input class="sinp" type="number" inputmode="numeric" placeholder="${ej.reps}" value="${s.repsH}" oninput="ST.ejStates['${key}'].series[${si}].repsH=this.value;autoGuardarSerie(${di},${ei},${si})">
      <input class="sinp" type="number" inputmode="numeric" placeholder="RIR" min="0" max="5" value="${s.rir||''}" oninput="ST.ejStates['${key}'].series[${si}].rir=this.value;autoGuardarSerie(${di},${ei},${si})" style="color:var(--nr)">
      <button class="ck ${s.done?'on':''}" onclick="toggleSer('${key}',${si},${di})">${s.done?'✓':''}</button>
    </div>`;
  });
  sers+=`</div>`;

  const ytBtn=ej.url?`<a href="${ej.url}" target="_blank" class="ejyt">▶ Ver</a>`:'';
  const grabarBadge=esGrabar?`<span class="grabar">🎥 Grábalo</span>`:'';
  const histBtn=`<button onclick="openHistEj('${ej.nom.replace(/'/g,"\\'")}',${di},${ei})" style="font-size:11px;color:var(--az2);background:var(--az3);border:none;cursor:pointer;font-family:inherit;padding:4px 9px;border-radius:6px;margin-top:6px;font-weight:600">📊 Historial</button>`;

  return`<div class="ejcard">
    <div class="ejhead">
      <div class="ejnum">${ei+1}</div>
      <div style="flex:1">
        <div class="ejnom">${ej.nom}</div>
        <div class="ejmeta">${ej.sets} series · ${ej.reps} reps · RIR ${ej.rir||0} · ${Math.floor((ej.rest||120)/60)}:${String((ej.rest||120)%60).padStart(2,'0')}min desc.</div>
        ${ej.acl?`<div class="ejacl">${ej.acl}</div>`:''}
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${ytBtn}${grabarBadge}${histBtn}</div>
      </div>
    </div>
    ${sers}
  </div>`;
}

function toggleSer(key,si,di){
  const s=ST.ejStates[key].series[si];s.done=!s.done;
  save();
  if(s.done){
    startTimer(ST.ejStates[key].rest||120);
    // Sync to BD
    if(_tk){
      const parts=key.split('_');
      const diaIdx=parseInt(parts[0]);
      const ejIdx=parseInt(parts[1]);
      const dia=DIAS[diaIdx];
      const ej=dia&&dia.ejercicios&&dia.ejercicios[ejIdx];
      if(ej){
        api('POST','/api/entreno/registrar-serie',{
          ejercicio:ej.nom||ej.nombre||key,
          dia:dia.cod||dia.nom||'',
          semana:ST.u.semana||1,
          serie:si+1,
          kg:parseFloat(s.kg)||0,
          reps:parseInt(s.repsH)||0,
          rir:ej.rir||2
        }).catch(function(e){console.warn('[serie]',e);});
      }
    }
  }
  document.getElementById('ct').innerHTML=buildEntHTML(di);
}

function guardarDia(di){
  if(!ST.ejStates)ST.ejStates={};
  if(!ST.histEnt)ST.histEnt={};
  DIAS[di].ejercicios.forEach((ej,ei)=>{
    const key=`${di}_${ei}`;
    if(!ST.ejStates[key]){
      var semK=String(ST.semVer||ST.u.semana||1);
      var histCur=ST.histEnt&&ST.histEnt[ej.nom]&&ST.histEnt[ej.nom].semanas?ST.histEnt[ej.nom].semanas[semK]:null;
      ST.ejStates[key]={collapsed:true,rest:ej.rest||120,series:Array.from({length:ej.sets||3},function(_,si){
        var hd=histCur&&histCur.series?histCur.series[si]:null;
        return {kg:hd&&hd.kg?String(hd.kg):'',repsH:hd&&hd.reps?String(hd.reps):'',done:!!(hd&&hd.done),rir:hd&&hd.rir_real!==undefined?hd.rir_real:''};
      })};
    }
    const st=ST.ejStates[key];
    const doneSeries=st.series.filter(s=>s.done&&s.kg);
    if(doneSeries.length){
      if(!ST.histEnt[ej.nom])ST.histEnt[ej.nom]={semanas:{}};
      ST.histEnt[ej.nom].semanas[String(ST.u.semana)]={series:st.series.map(s=>({kg:s.kg||'',reps:s.repsH||'',done:s.done}))};
      ST.histEnt[ej.nom].series=st.series.map(s=>({kg:s.kg||'',reps:s.repsH||''}));
    }
    st.collapsed=true;
  });
  save();
  document.getElementById('ct').innerHTML=buildEntHTML(di);
  toast('Entrenamiento guardado ✓','vd');
}

// Historial por ejercicio
// Cache for exercise historial
var _histEjCache={};

function openHistEj(nom,di,ei){
  document.getElementById('histTitle').textContent=nom;
  document.getElementById('histWeeks').innerHTML='<div style="color:var(--t3);font-size:13px">Cargando...</div>';
  document.getElementById('histContent').innerHTML='';
  document.getElementById('histModal').classList.add('show');
  api('GET','/api/entreno/mi-historial').then(function(rows){
    var ejRows=(rows||[]).filter(function(r){return r.ejercicio===nom;});
    if(!ejRows.length){
      document.getElementById('histWeeks').innerHTML='';
      document.getElementById('histContent').innerHTML='<div style="color:var(--t3);font-size:13px;padding:20px 0">Sin historial aún</div>';
      return;
    }
    var semanas={};
    ejRows.forEach(function(r){
      var s=String(r.semana);
      if(!semanas[s])semanas[s]=[];
      semanas[s].push(r);
    });
    _histEjCache={nom:nom,semanas:semanas};
    var sems=Object.keys(semanas).sort(function(a,b){return Number(a)-Number(b);});
    _showHistSem(sems[sems.length-1],sems);
  }).catch(function(){
    document.getElementById('histContent').innerHTML='<div style="color:var(--rj)">Error</div>';
  });
}

function _showHistSem(sem,sems){
  var semanas=_histEjCache.semanas||{};
  var rows=semanas[sem]||[];
  var weeksHtml=sems.map(function(s){
    var sc="'"+s+"'";
    var semsArr='['+sems.map(function(x){return"'"+x+"'"}).join(',')+']';
    return '<button class="hw '+(s===sem?'on':'')+'" onclick="_showHistSem('+sc+','+semsArr+')">S'+s+'</button>';
  }).join('');
  document.getElementById('histWeeks').innerHTML=weeksHtml;
  var content='<div style="font-size:13px;color:var(--t3);margin-bottom:10px">Semana '+sem+'</div>';
  content+='<div style="display:grid;grid-template-columns:30px 1fr 1fr 1fr;gap:6px;font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px"><span>#</span><span>Kg</span><span>Reps</span><span>RIR</span></div>';
  rows.sort(function(a,b){return a.serie-b.serie;}).forEach(function(r){
    content+='<div style="display:grid;grid-template-columns:30px 1fr 1fr 1fr;gap:6px;padding:8px 0;border-bottom:1px solid var(--bor2);font-size:14px">';
    content+='<span style="color:var(--t3);font-weight:700">'+r.serie+'</span>';
    content+='<span style="font-weight:700;color:var(--az)">'+(r.kg?r.kg+'kg':'—')+'</span>';
    content+='<span style="color:var(--t2)">'+(r.reps_reales?r.reps_reales+' reps':'—')+'</span>';
    content+='<span style="color:var(--nr)">'+(r.rir_real!==null&&r.rir_real!==undefined?'RIR'+r.rir_real:'—')+'</span>';
    content+='</div>';
  });
  document.getElementById('histContent').innerHTML=content;
}


function showHistSem(nom,sem,sems){
  const hist=ST.histEnt[nom];
  const data=hist.semanas[sem];
  const weeksHtml=sems.map(s=>`<button class="hw ${s===sem?'on':''}" onclick="showHistSem('${nom.replace(/'/g,"\\'")}','${s}',[${sems.map(x=>"'"+x+"'").join(',')}])">S${s}</button>`).join('');
  document.getElementById('histWeeks').innerHTML=weeksHtml;
  let content=`<div style="font-size:13px;color:var(--t3);margin-bottom:10px">Semana ${sem}</div>`;
  content+=`<div style="display:grid;grid-template-columns:30px 1fr 1fr;gap:6px;font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;margin-bottom:6px"><span>#</span><span>Kg</span><span>Reps</span></div>`;
  (data.series||[]).forEach((s,i)=>{
    content+=`<div style="display:grid;grid-template-columns:30px 1fr 1fr;gap:6px;padding:8px 0;border-bottom:1px solid var(--bor2);font-size:14px">
      <span style="color:var(--t3);font-weight:700">${i+1}</span>
      <span style="font-weight:700;color:var(--az)">${s.kg||'—'}${s.kg?'kg':''}</span>
      <span style="color:var(--t2)">${s.reps||'—'}${s.reps?' reps':''}</span>
    </div>`;
  });
  document.getElementById('histContent').innerHTML=content;
}
function closeHist(){document.getElementById('histModal').classList.remove('show');}

// Timer
let _timID=null,_timSec=0;
function startTimer(sec){
  _timSec=sec;const d=document.getElementById('timDiv');d.classList.add('show');
  clearInterval(_timID);
  const upd=()=>{_timSec--;document.getElementById('timN').textContent=Math.floor(_timSec/60)+':'+(String(_timSec%60).padStart(2,'0'));if(_timSec<=0){clearInterval(_timID);d.classList.remove('show');toast('¡Siguiente serie!','vd');}};
  document.getElementById('timN').textContent=Math.floor(sec/60)+':'+(String(sec%60).padStart(2,'0'));
  _timID=setInterval(upd,1000);
}
function stopTimer(){clearInterval(_timID);document.getElementById('timDiv').classList.remove('show');}

// ── NUTRICIÓN ──
let _NIT=[];

function nitP(di,meal,tipo,idx){const it=_NIT[idx];if(it)selProt(di,meal,it.nom,tipo,it);}
function nitI(di,meal,cat,idx){const it=_NIT[idx];if(it)selItem(di,meal,cat,it);}

function selProt(di,meal,nom,tipo,item){
  if(!ST.menu[di])ST.menu[di]={};
  if(!ST.menu[di][meal])ST.menu[di][meal]={};
  const cur=ST.menu[di][meal];
  if(cur.prot&&cur.prot.nom===nom&&cur.protType===tipo){delete cur.prot;delete cur.protType;}
  else{cur.prot=item;cur.protType=tipo;if(tipo==='grasa')delete cur.fat;}
  save();document.getElementById('ct').innerHTML=renderNutricion();
}
function selItem(di,meal,cat,item){
  if(!ST.menu[di])ST.menu[di]={};
  if(!ST.menu[di][meal])ST.menu[di][meal]={};
  const cur=ST.menu[di][meal];
  if(cur[cat]&&cur[cat].nom===item.nom)delete cur[cat];else cur[cat]=item;
  save();document.getElementById('ct').innerHTML=renderNutricion();
}

function renderNutricion(){
  const tab=ST.nutTab,di=ST.nutDay;
  const DSHORT=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const dayTabs=DSHORT.map((d,i)=>`<button class="dt ${i===di?'on':''}" onclick="ST.nutDay=${i};ST.nutEditing=false;document.getElementById('ct').innerHTML=renderNutricion()">${d}</button>`).join('');
  const dayTabsNav=DSHORT.map((d,i)=>`<button class="dt ${i===di?'on':''}" onclick="ST.nutDay=${i};ST.nutEditing=false;ST.nutTab='menu';document.getElementById('ct').innerHTML=renderNutricion()">${d}</button>`).join('');

  let body='';
  if(tab==='menu')body=renderMenuDia(di);
  else if(tab==='semana')body=renderSemana()+'<div style="padding:0 4px 12px"><button class="btn bo" style="width:100%;margin-top:8px" onclick="checkMenuCompleto()">⬇️ Descargar plan semanal</button></div>';
  else body=renderListaCompra();

  return`<div class="nut-sticky">
    <div class="tabs">
      <button class="tab ${tab==='menu'?'on':''}" onclick="ST.nutTab='menu';ST.nutEditing=false;document.getElementById('ct').innerHTML=renderNutricion()">Mi menú</button>
      <button class="tab ${tab==='semana'?'on':''}" onclick="ST.nutTab='semana';document.getElementById('ct').innerHTML=renderNutricion()">Semana</button>
      <button class="tab ${tab==='lista'?'on':''}" onclick="ST.nutTab='lista';document.getElementById('ct').innerHTML=renderNutricion()">Lista compra</button>
    </div>
    ${tab!=='lista'?`<div class="day-tabs">${tab==='menu'?dayTabs:dayTabsNav}</div>`:''}
  </div>
  <div class="nut-body">${body}</div>`;
}

function renderMenuDia(di){
  const guardado=ST.menuGuardado[di];
  if(guardado&&!ST.nutEditing)return renderMenuPlegado(di,guardado);
  return renderMenuEditor(di);
}

function renderMenuPlegado(di,g){
  const DNAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  // Use meals from plan (set by entrenador) — not hardcoded list
  // using global _MEAL_ORDER
  const ICONS={desayuno:'🌅',comida:'☀️',cena:'🌙',snack:'🍎',desayuno_extra:'🌅',snack_am:'🍎',snack_pm:'🍎',comida_extra:'☀️',cena_extra:'🌙',post_entreno:'💪'};
  // Only show meals that exist in the plan
  const planMeals=ST.p.planAlimentos?Object.keys(ST.p.planAlimentos):['desayuno','comida','cena'];
  const MEALS=_MEAL_ORDER.filter(m=>planMeals.includes(m));
  if(!MEALS.length)MEALS.push('desayuno','comida','cena');
  let out='';
  MEALS.forEach((meal,mi)=>{
    const ms=g[meal]||{};
    // using global _MEAL_BASE_MAP
    const md=MENU[meal]||MENU[_MEAL_BASE_MAP[meal]]||MENU['comida']||{};
    const alims=[];
    ['prot','hidrat','fat','fruta','verd'].forEach(cat=>{
      if(ms[cat]){const it=ms[cat];alims.push({nom:it.nom,cant:cat==='verd'?null:it.cantidad,u:it.u||''});}
    });
    const isOpen=ST[`mopen_${di}_${mi}`]||false;
    out+=`<div class="meal-col">
      <div class="meal-col-h" onclick="ST['mopen_${di}_${mi}']=!ST['mopen_${di}_${mi}'];document.getElementById('ct').innerHTML=renderNutricion()">
        <div>
          <div class="meal-col-title">${ICONS[meal]} ${md.nom}</div>
          ${!isOpen&&alims.length?`<div class="meal-col-sub">${alims.map(a=>a.nom+(a.cant?` ${Math.round(a.cant)}${a.u}`:'')+(':'===a.u[-1]?'':'')).join(' · ')}</div>`:''}
        </div>
        <span style="color:var(--t3)">${isOpen?'▲':'▼'}</span>
      </div>
      <div class="meal-col-body ${isOpen?'open':''}">
        ${alims.map(a=>`<div class="meal-alim"><span>${a.nom}</span><span style="color:var(--t3);font-size:12px">${a.cant!=null?Math.round(a.cant)+(a.u||''):''}</span></div>`).join('')}
      </div>
    </div>`;
  });
  out+=`<div style="display:flex;gap:8px;margin-bottom:12px">
    <button class="btn btnp" style="flex:1;background:var(--az)" onclick="ST.nutEditing=true;document.getElementById('ct').innerHTML=renderNutricion()">✏️ Cambiar alimentos</button>
    <button class="btn btno" style="flex:1" onclick="copiarDia(${di})">📋 Pegar en...</button>
  </div>`;
  out+=`<div class="alert aaz">💧 Bebe al menos 2L de agua hoy</div>`;
  return out;
}

function renderMenuEditor(di){
  _NIT=[];
  const isSuperavit=ST.p.def>0;
  const m=ST.menu[di]||{};
  // using global _MEAL_ORDER
  const planMeals=ST.p.planAlimentos?Object.keys(ST.p.planAlimentos):['desayuno','comida','cena'];
  const MEALS=_MEAL_ORDER.filter(function(m){return planMeals.includes(m);});
  if(!MEALS.length){MEALS.push('desayuno');MEALS.push('comida');MEALS.push('cena');}
  let out='<div style="height:4px"></div>';

  MEALS.forEach(meal=>{
    // using global _MEAL_BASE_MAP
    const md=MENU[meal]||MENU[_MEAL_BASE_MAP[meal]]||MENU['comida']||{};
    const ms=m[meal]||{};
    const protType=ms.protType||null;
    const showFat=protType==='magra';
    const isFat=protType==='grasa';

    out+=`<div class="meal-sec"><div class="meal-title">${_MEAL_NAMES[meal]||meal}</div>`;

    out+=`<div class="cat-lbl">Proteína magra</div><div class="opts">`;
    (md.proteinas_magras||[]).forEach(it=>{
      const on=ms.prot&&ms.prot.nom===it.nom&&protType==='magra';
      const idx=_NIT.push(it)-1;
      out+=`<button class="opt ${on?'on':''}" onclick="nitP(${di},'${meal}','magra',${idx})">${it.nom}<small>${it.cantidad}${it.u}</small></button>`;
    });
    out+=`</div>`;

    out+=`<div class="cat-lbl">Proteína con grasa</div><div class="opts">`;
    (md.proteinas_grasas||[]).forEach(it=>{
      const on=ms.prot&&ms.prot.nom===it.nom&&protType==='grasa';
      const idx=_NIT.push(it)-1;
      out+=`<button class="opt ${on?'on':''}" onclick="nitP(${di},'${meal}','grasa',${idx})">${it.nom}<small>${it.cantidad}${it.u}</small></button>`;
    });
    out+=`</div>`;

    if(isFat)out+=`<div class="fat-alert">⚠️ Esta proteína ya aporta grasa — no añadas más en esta comida.</div>`;

    out+=`<div class="cat-lbl">Hidrato</div><div class="opts">`;
    (md.hidratos||[]).forEach(it=>{
      const on=ms.hidrat&&ms.hidrat.nom===it.nom;
      const idx=_NIT.push(it)-1;
      out+=`<button class="opt ${on?'on':''}" onclick="nitI(${di},'${meal}','hidrat',${idx})">${it.nom}<small>${it.cantidad}${it.u}</small></button>`;
    });
    out+=`</div>`;

    if(md.verduras){
      out+=`<div class="cat-lbl">Verdura</div><div class="opts">`;
      md.verduras.forEach(it=>{
        const on=ms.verd&&ms.verd.nom===it.nom;
        const idx=_NIT.push(it)-1;
        out+=`<button class="opt ${on?'on':''}" onclick="nitI(${di},'${meal}','verd',${idx})">${it.nom}</button>`;
      });
      out+=`</div>`;
    }

    if(md.frutas){
      out+=`<div class="cat-lbl">Fruta</div><div class="opts">`;
      md.frutas.forEach(it=>{
        const on=ms.fruta&&ms.fruta.nom===it.nom;
        const idx=_NIT.push(it)-1;
        out+=`<button class="opt ${on?'on':''}" onclick="nitI(${di},'${meal}','fruta',${idx})">${it.nom}</button>`;
      });
      out+=`</div>`;
    }

    if(showFat&&md.grasas){
      out+=`<div class="cat-lbl">Grasa</div><div class="opts">`;
      md.grasas.forEach(it=>{
        const on=ms.fat&&ms.fat.nom===it.nom;
        const idx=_NIT.push(it)-1;
        out+=`<button class="opt ${on?'on':''}" onclick="nitI(${di},'${meal}','fat',${idx})">${it.nom}<small>${it.cantidad}${it.u}</small></button>`;
      });
      out+=`</div>`;
    }

    if(meal==='snack'&&isSuperavit&&md.grasas_superavit){
      out+=`<div class="cat-lbl" style="color:var(--nr)">Extra (superávit)</div><div class="opts">`;
      md.grasas_superavit.forEach(it=>{
        const on=ms.fat&&ms.fat.nom===it.nom;
        const idx=_NIT.push(it)-1;
        out+=`<button class="opt ${on?'on':''}" onclick="nitI(${di},'${meal}','fat',${idx})">${it.nom}<small>${it.cantidad}${it.u}</small></button>`;
      });
      out+=`</div>`;
    }
    out+=`</div>`;
  });

  out+=`<div id="missing-alert" class="missing-alert"></div>`;
  out+=`<div style="display:flex;gap:8px;margin-bottom:10px">
    <button class="btn btno" style="flex:1" onclick="copiarDia(${di})">📋 Pegar en...</button>
    <button class="btn btnp" style="flex:1" onclick="guardarMenu(${di})">Guardar ✓</button>
  </div>`;
  out+=`<div class="alert aaz">💧 Bebe al menos 2L de agua hoy</div>`;
  return out;
}

function guardarMenu(di){
  // Only validate meals assigned to this client by the trainer
  const MEALS=ST.p&&ST.p.alimentos?Object.keys(ST.p.alimentos):['desayuno','comida','cena'];
  const m=ST.menu[di]||{};
  const NAMES={desayuno:'Desayuno',comida:'Comida',cena:'Cena',snack:'Snack'};
  const faltantes=[];
  MEALS.forEach(meal=>{
    const ms=m[meal]||{};
    // using global _MEAL_BASE_MAP
    const md=MENU[meal]||MENU[_MEAL_BASE_MAP[meal]]||MENU['comida']||{};
    const n=NAMES[meal];
    if(!ms.prot)faltantes.push(n+': falta proteína');
    if(!ms.hidrat)faltantes.push(n+': falta hidrato');
    if(ms.prot&&ms.protType==='magra'&&md.grasas&&md.grasas.length&&!ms.fat)faltantes.push(n+': falta grasa');
    if((meal==='comida'||meal==='cena')&&md.verduras&&md.verduras.length&&!ms.verd)faltantes.push(n+': falta verdura');
    if(meal==='desayuno'&&md.frutas&&md.frutas.length&&!ms.fruta)faltantes.push(n+': falta fruta');
  });
  if(faltantes.length){
    const al=document.getElementById('missing-alert');
    if(al){al.style.display='block';al.textContent='⚠️ '+faltantes.join(' · ');}
    toast('Revisa lo que falta','rj');return;
  }
  ST.menuGuardado[di]=JSON.parse(JSON.stringify(m));
  ST.nutEditing=false;
  api('POST','/api/entreno/menu-semanal',{menu_semanal:ST.menuGuardado}).catch(function(e){console.warn('guardarMenu BD:',e);});
  save();
  document.getElementById('ct').innerHTML=renderNutricion();
  document.getElementById('ct').scrollTop=0;
  toast('Menú guardado ✓','vd');
}

let _copyFrom=-1,_copyTargets=[];
function copiarDia(di){
  _copyFrom=di;_copyTargets=[];
  const DNAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const opts=DNAMES.map((d,i)=>i===di?'':
    `<div class="modal-opt" id="copt${i}" onclick="toggleCopy(${i})" style="background:${_copyTargets.includes(i)?'var(--vd2)':''}">
      ${d}<span id="coptck${i}" style="color:var(--vd)">${_copyTargets.includes(i)?'✓':''}</span>
    </div>`
  ).join('');
  openModal('Pegar menú de '+DNAMES[di]+' a...',opts+`<button class="btn btnp btnf" style="margin-top:8px" onclick="confirmCopy()">Copiar ✓</button>`);
}
function toggleCopy(i){
  const idx=_copyTargets.indexOf(i);
  if(idx>=0)_copyTargets.splice(idx,1);else _copyTargets.push(i);
  const el=document.getElementById('copt'+i);const ck=document.getElementById('coptck'+i);
  if(el)el.style.background=_copyTargets.includes(i)?'var(--vd2)':'';
  if(ck)ck.textContent=_copyTargets.includes(i)?'✓':'';
}
function confirmCopy(){
  if(!_copyTargets.length){toast('Selecciona al menos un día','rj');return;}
  const DNAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  _copyTargets.forEach(to=>{
    ST.menu[to]=JSON.parse(JSON.stringify(ST.menu[_copyFrom]||{}));
    ST.menuGuardado[to]=JSON.parse(JSON.stringify(ST.menuGuardado[_copyFrom]||{}));
  });
  save();closeModal();toast('Copiado a '+_copyTargets.map(t=>DNAMES[t]).join(', '),'vd');
}

function renderSemana(){
  const DNAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  return`<div class="card"><div class="ch"><h2>📆 Vista semanal</h2></div><div class="cb" style="padding:10px 14px">
    ${DNAMES.map((d,di)=>{
      const g=ST.menuGuardado[di];
      return`<div class="compra-item" style="cursor:pointer" onclick="ST.nutTab='menu';ST.nutDay=${di};ST.nutEditing=false;document.getElementById('ct').innerHTML=renderNutricion()">
        <span>${d}</span>
        <span style="font-size:12px;color:${g?'var(--vd)':'var(--t3)'};font-weight:600">${g?'✅ Guardado':'Sin configurar'}</span>
      </div>`;
    }).join('')}
  </div></div>`;
}

function renderListaCompra(){
  const totals={};const verdRac={};
  if(!ST.listaCheck)ST.listaCheck={};
  Object.values(ST.menuGuardado).forEach(dia=>{
    if(typeof dia!=='object')return;
    Object.values(dia).forEach(meal=>{
      if(typeof meal!=='object')return;
      if(meal.verd){const n=meal.verd.nom;verdRac[n]=(verdRac[n]||0)+1;}
      ['prot','hidrat','fat','fruta'].forEach(cat=>{
        if(meal[cat]){const it=meal[cat];if(!totals[it.nom])totals[it.nom]={nom:it.nom,u:it.u||'',cantidad:0};totals[it.nom].cantidad+=it.cantidad||0;}
      });
    });
  });
  const items=[...Object.values(totals).sort((a,b)=>a.nom.localeCompare(b.nom)),
               ...Object.entries(verdRac).sort((a,b)=>a[0].localeCompare(b[0])).map(([nom,r])=>({nom,u:'rac',cantidad:r,esVerd:true}))];
  if(!items.length)return`<div class="card"><div class="cb" style="text-align:center;padding:24px;color:var(--t3)">Configura tu menú primero</div></div>`;
  return`<div class="card"><div class="ch"><h2>🛒 Lista de la compra</h2><button class="btn btns btngr" onclick="ST.listaCheck={};save();document.getElementById('ct').innerHTML=renderNutricion()">Reiniciar</button></div><div class="cb">
    ${items.map(it=>{
      const chk=ST.listaCheck[it.nom]||false;
      const cant=it.esVerd?it.cantidad+' ración'+(it.cantidad>1?'es':''):Math.round(it.cantidad)+(it.u||'');
      return`<div class="compra-item" style="opacity:${chk?.4:1}">
        <span style="text-decoration:${chk?'line-through':'none'};color:${chk?'var(--t3)':'inherit'}">${it.nom}</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:700;color:${chk?'var(--t3)':'var(--az)'}">${cant}</span>
          <button onclick="ST.listaCheck['${it.nom}']=!ST.listaCheck['${it.nom}'];save();document.getElementById('ct').innerHTML=renderNutricion()" style="width:28px;height:28px;border-radius:7px;border:2px solid ${chk?'var(--vd)':'var(--bor)'};background:${chk?'var(--vd)':'#fff'};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;touch-action:manipulation">${chk?'✓':''}</button>
        </div>
      </div>`;
    }).join('')}
  </div></div>`;
}

function checkMenuCompleto(){
  var MEALS=['desayuno','comida','cena','snack'];
  var DNOM=['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
  var inc=[];
  for(var di=0;di<7;di++){
    if(DIAS[di]&&DIAS[di].rest)continue;
    var saved=ST.menuGuardado[di];
    var ok=saved&&MEALS.every(function(m){
      return saved[m]&&Object.values(saved[m]).some(function(v){return v&&v.nom;});
    });
    if(!ok)inc.push(DNOM[di]);
  }
  if(inc.length){toast('Completa primero: '+inc.join(', '),'rj');return;}
  generateMenuPDF();
}
function generateMenuPDF(){
  const DNAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  // Only validate meals assigned to this client by the trainer
  const MEALS=ST.p&&ST.p.alimentos?Object.keys(ST.p.alimentos):['desayuno','comida','cena'];
  const MEAL_NOM={desayuno:'Desayuno',comida:'Comida',cena:'Cena',snack:'Snack'};
  const incomplete=[0,1,2,3,4,5,6].filter(i=>!ST.menuGuardado[i]||Object.keys(ST.menuGuardado[i]).length<4);
  if(incomplete.length){toast('Guarda el menú de los 7 días primero','rj');return;}
  // Build printable window - opens print dialog directly as PDF
  const w=window.open('','_blank','width=900,height=700');
  if(!w){toast('Permite ventanas emergentes','rj');return;}
  let html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
@page{size:A4 landscape;margin:10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;background:#fff;color:#1A2B5A}
.header{background:linear-gradient(135deg,#1A2B5A,#2E6DA4);color:#fff;padding:14px 20px;text-align:center;border-radius:8px;margin-bottom:10px}
.header h1{font-size:15pt;font-weight:800;margin-bottom:3px}
.header .sub{font-size:8.5pt;opacity:.85;font-weight:400}
.water{background:#D4F7E8;border:1px solid #7BE8B4;padding:5px 14px;margin-bottom:10px;border-radius:6px;font-size:9pt;color:#07854D;font-weight:600;text-align:center}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.day{border:1px solid #E2E6EF;border-radius:8px;overflow-x:hidden}
.day-h{background:#EEF3FA;color:#1A2B5A;padding:5px 8px;font-size:9pt;font-weight:800;text-align:center;border-bottom:1px solid #E2E6EF}
.meal{padding:6px 8px;border-bottom:1px solid #F4F5F8}
.meal:last-child{border-bottom:none}
.mt{font-size:7.5pt;font-weight:700;color:#2E6DA4;margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px}
.alim{display:flex;justify-content:space-between;align-items:baseline;padding:2px 0;border-bottom:1px solid #F8F9FB}
.alim:last-child{border-bottom:none}
.alim-n{font-size:9pt;font-weight:500;color:#1A2B5A}
.alim-c{font-size:8pt;color:#9199AD;white-space:nowrap;padding-left:4px}
.footer{text-align:center;padding:8px;font-size:7.5pt;color:#9199AD;margin-top:8px;border-top:1px solid #E2E6EF}
</style></head><body>
<div class="header">
  <h1>Plan de Nutrición · ${ST.u.nom}</h1>
  <div class="sub">EnFormaFit · Semana ${ST.u.semana} · ${new Date().toLocaleDateString('es',{day:'2-digit',month:'long',year:'numeric'})} &nbsp;|&nbsp; ${ST.p.macro.kcal} kcal &nbsp;·&nbsp; ${ST.p.macro.p}g proteína &nbsp;·&nbsp; ${ST.p.macro.c}g carbos &nbsp;·&nbsp; ${ST.p.macro.g}g grasa</div>
</div>
<div class="water">💧 Mínimo 2 litros de agua al día &nbsp;·&nbsp; 🚶 ${ST.pasos.obj.toLocaleString('es')} pasos diarios</div>
<div class="week">`;
  DNAMES.forEach((dia,di)=>{
    const mg=ST.menuGuardado[di]||{};
    html+=`<div class="day"><div class="day-h">${dia}</div>`;
    MEALS.forEach(meal=>{
      const ms=mg[meal]||{};
      const alims=[];
      ['prot','hidrat','fat','fruta','verd'].forEach(cat=>{if(ms[cat])alims.push(ms[cat]);});
      if(!alims.length)return;
      html+=`<div class="meal"><div class="mt">${MEAL_NOM[meal]}</div>`;
      alims.forEach(it=>{
        const c=it.cantidad&&it.u?Math.round(it.cantidad)+it.u:'';
        html+=`<div class="alim"><span class="alim-n">${it.nom}</span>${c?`<span class="alim-c">${c}</span>`:''}</div>`;
      });
      html+=`</div>`;
    });
    html+=`</div>`;
  });
  html+=`</div><div class="footer">EnFormaFit &nbsp;·&nbsp; @alvaro_casal_ &nbsp;·&nbsp; Plan de nutrición personalizado</div></body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>{w.print();},400);
  toast('Abriendo para imprimir/guardar PDF ✓','vd');
}

// ── PROGRESO ──
function buildPesoGridApp(pesos,inicioBloque,semActual){
  if(!pesos||!pesos.length)return'<div style="color:var(--t3);font-size:12px;text-align:center;padding:8px">Sin registros de peso aún</div>';
  var DN=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var fi=inicioBloque?new Date(inicioBloque):null;
  var pm={};var maxS=parseInt(semActual)||1;
  pesos.forEach(function(p){
    var d=new Date(p.f);var sem=1;
    if(fi){var diff=Math.floor((d-fi)/(7*24*60*60*1000));sem=Math.max(1,diff+1);}
    var dw=d.getDay();var di=dw===0?6:dw-1;
    if(!pm[sem])pm[sem]={};pm[sem][di]=p.v;
    if(sem>maxS)maxS=sem;
  });
  var sa=[];for(var i=0;i<=maxS;i++)sa.push(i);
  var md={};
  sa.forEach(function(s){
    var vs=Object.values(pm[s]||{}).filter(function(v){return v>0;});
    md[s]=vs.length?+(vs.reduce(function(a,b){return a+b;},0)/vs.length).toFixed(1):null;
  });
  var h='<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table style="border-collapse:collapse;font-size:10.5px;min-width:'+(52+sa.length*52)+'px">';
  h+='<thead><tr style="background:var(--az)"><th style="padding:4px 7px;text-align:left;color:rgba(255,255,255,.8);font-size:9px;position:sticky;left:0;background:var(--az)">Día</th>';
  sa.forEach(function(s){h+='<th style="padding:4px 8px;text-align:center;color:#fff;font-size:9px;min-width:48px">'+(s===0?'S0':'S'+s)+'</th>';});
  h+='</tr></thead><tbody>';
  DN.forEach(function(d,di){
    h+='<tr><td style="padding:4px 7px;font-weight:700;font-size:9px;color:var(--t2);background:var(--bg);position:sticky;left:0">'+d+'</td>';
    sa.forEach(function(s){
      var v=pm[s]&&pm[s][di]!=null?pm[s][di]:null;var m=md[s];
      var bg=v==null?'transparent':m&&v>m?'rgba(255,26,26,.1)':m&&v<m?'rgba(13,191,111,.1)':'transparent';
      var col=v==null?'#ccc':m&&v>m?'var(--rj)':m&&v<m?'var(--vd)':'var(--t1)';
      h+='<td style="padding:4px 5px;text-align:center;background:'+bg+';color:'+col+';font-weight:'+(v?'700':'400')+'">'+(v||'—')+'</td>';
    });
    h+='</tr>';
  });
  h+='<tr style="background:var(--az3);border-top:2px solid var(--az4)"><td style="padding:4px 7px;font-weight:700;font-size:9px;color:var(--az);background:var(--az3);position:sticky;left:0">Media</td>';
  sa.forEach(function(s){h+='<td style="padding:4px 5px;text-align:center;font-weight:800;font-size:11px;color:var(--az)">'+(md[s]||'—')+'</td>';});
  h+='</tr><tr><td style="padding:4px 7px;font-weight:700;font-size:9px;color:var(--t3);background:#fff;position:sticky;left:0">Cambio</td>';
  sa.forEach(function(s,i){
    var c=md[s];var p=i>0?md[sa[i-1]]:null;var str='—',col='var(--t3)';
    if(c!=null&&p!=null){var dif=+(c-p).toFixed(1);str=(dif>0?'+':'')+dif;col=dif<0?'var(--vd)':dif>0?'var(--rj)':'var(--t3)';}
    h+='<td style="padding:4px 5px;text-align:center;font-weight:700;color:'+col+'">'+str+'</td>';
  });
  h+='</tr></tbody></table></div>';return h;
}

function buildMedidasTable(revSems,hist){
  var MEDS=[['hombros','Hombros'],['pecho','Pecho'],['brazoi','Brazo izq.'],['brazod','Brazo dcho.'],['cintura','Cintura'],['musloi','Muslo izq.'],['muslod','Muslo dcho.'],['gemeloi','Gemelo izq.'],['gemelod','Gemelo dcho.']];
  // Get medidas for each revision semana
  var cols=revSems.map(function(rs){
    var h=hist[rs];
    var meds=h&&h.medidas?h.medidas:{};
    return{rs:rs,meds:meds};
  });
  var hasAny=cols.some(function(c){return Object.keys(c.meds).length>0;});
  if(!hasAny)return'<div class="card" style="margin-bottom:12px"><div class="ch"><h2>📏 Medidas corporales</h2></div><div style="padding:14px;text-align:center;color:var(--t3);font-size:13px">Aparecerán tras tu primera revisión</div></div>';
  var html='<div class="card" style="margin-bottom:12px"><div class="ch"><h2>📏 Medidas corporales</h2></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
  // Header row
  html+='<tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid var(--bor);color:var(--t3)">Medida</th>';
  cols.forEach(function(c){
    html+='<th style="text-align:center;padding:6px 8px;border-bottom:2px solid var(--bor);color:var(--az);white-space:nowrap">'+(c.rs===0?'Inicio':'S'+c.rs)+'</th>';
  });
  html+='</tr>';
  // Data rows
  MEDS.forEach(function(m){
    var k=m[0],l=m[1];
    var hasRow=cols.some(function(c){
      var v=c.meds[k];
      return v&&(typeof v==='number'||(typeof v==='object'&&Object.values(v).some(function(x){return x;})));
    });
    if(!hasRow)return;
    html+='<tr>';
    html+='<td style="padding:6px 8px;border-bottom:1px solid var(--bor2);color:var(--t2);font-weight:600">'+l+'</td>';
    cols.forEach(function(c){
      var v=c.meds[k];
      var val='';
      if(v){
        if(typeof v==='number')val=v;
        else if(typeof v==='object'){var arr=Object.values(v).filter(function(x){return x;});val=arr[arr.length-1]||'';}
      }
      html+='<td style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--bor2);font-weight:'+(val?'700':'400')+';color:'+(val?'var(--az)':'var(--t3)')+'">'+( val?val+' cm':'—')+'</td>';
    });
    html+='</tr>';
  });
  html+='</table></div></div>';
  return html;
}
function toggleProgSection(sec){
  if(sec==='medidas'||sec===1)ST.medidasOpen=!ST.medidasOpen;
  else if(sec==='fotos'||sec===2)ST.fotosOpen=!ST.fotosOpen;
  else if(sec==='pesos'||sec===3)ST.pesosOpen=!ST.pesosOpen;
  save();
  var ct=document.getElementById('ct');
  if(ct&&SEC==='progreso'){var sp=ct.scrollTop;ct.innerHTML=renderProgreso();ct.scrollTop=sp;}
}
function renderProgreso(){
  const pesos=ST.pesos;
  const today=new Date().toISOString().split('T')[0];
  const {semana,tipo}=ST.u;
  const revSems=tipo==='programa'?[0,4,8,12]:[0,3,7,11];
  const _revSemsFull=tipo==='programa'?[4,8,12]:[3,7,11];
  const nextRev=_revSemsFull.find(rs=>rs>=semana)||_revSemsFull[_revSemsFull.length-1];
  const POSES=['Frente','Perfil D.','Perfil I.','Espalda'];

  // Stats
  const ultp=pesos.length?pesos[pesos.length-1].v:0;
  const cambio=pesos.length>1?ultp-pesos[0].v:0;
  const left=ultp?ultp-ST.objPeso:0;
  const semsTotal=Math.ceil(Math.abs(ST.pesoInicial-ST.objPeso)/ST.bajanSem);
  const semsTransc=pesos.length?Math.ceil(pesos.length/3):0;

  // Gráfico SVG
  let chartHTML='<div style="font-size:12px;color:var(--t3);text-align:center;padding:20px">Añade pesos para ver la evolución</div>';
  if(pesos.length>1){
    const W=320,H=130,PL=36,PR=10,PT=14,PB=26;
    const vals=pesos.map(p=>p.v);
    const mn=Math.min(...vals,ST.objPeso)-1.5;
    const mx=Math.max(...vals)+1.5;
    const xOf=i=>PL+(i/(vals.length-1))*(W-PL-PR);
    const yOf=v=>PT+(1-(v-mn)/(mx-mn))*(H-PT-PB);
    const pts=vals.map((v,i)=>`${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
    const areaP=`${xOf(0).toFixed(1)},${(H-PB).toFixed(1)} `+vals.map((v,i)=>`${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')+` ${xOf(vals.length-1).toFixed(1)},${(H-PB).toFixed(1)}`;
    const oy=yOf(ST.objPeso).toFixed(1);
    const yLbls=[mn+1,Math.round((mn+mx)/2),mx-1].map(v=>`<text x="${PL-3}" y="${yOf(v).toFixed(1)}" text-anchor="end" font-size="9" fill="#9199AD" dominant-baseline="middle">${v.toFixed(1)}</text>`).join('');
    const xLbls=[0,Math.floor(pesos.length/2),pesos.length-1].map(i=>{const d=pesos[i].f.split('-');return`<text x="${xOf(i).toFixed(1)}" y="${H-PB+12}" text-anchor="middle" font-size="9" fill="#9199AD">${d[2]}/${d[1]}</text>`;}).join('');
    const dots=vals.map((v,i)=>`<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="${i===vals.length-1?5:3}" fill="${i===vals.length-1?'#2E6DA4':'#D6E8F5'}" stroke="${i===vals.length-1?'#fff':'#2E6DA4'}" stroke-width="${i===vals.length-1?2:1.5}"/>`).join('');
    chartHTML=`<svg class="cht" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2E6DA4" stop-opacity=".12"/><stop offset="100%" stop-color="#2E6DA4" stop-opacity="0"/></linearGradient></defs>
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${H-PB}" stroke="#E2E6EF" stroke-width="1"/>
      <line x1="${PL}" y1="${H-PB}" x2="${W-PR}" y2="${H-PB}" stroke="#E2E6EF" stroke-width="1"/>
      <line x1="${PL}" y1="${oy}" x2="${W-PR}" y2="${oy}" stroke="#0DBF6F" stroke-width="1.5" stroke-dasharray="6,3"/>
      <text x="${W-PR-2}" y="${parseFloat(oy)-5}" text-anchor="end" font-size="9" fill="#0DBF6F" font-weight="600">obj ${ST.objPeso}kg</text>
      ${yLbls}${xLbls}
      <polygon points="${areaP}" fill="url(#gr)"/>
      <polyline points="${pts}" fill="none" stroke="#2E6DA4" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>`;
  }


  // Tabla pesos grid
  const pesoGridHTML=buildPesoGridApp(pesos,ST.u.inicioBloque,ST.u.semana);
  const pesoGridSection=`<div class="card" style="margin:12px 0"><div style="font-size:13px;font-weight:700;margin-bottom:8px">📊 Registro de pesos</div>${pesoGridHTML}</div>`;

  // Fotos
  let fotosH=`<div class="fscroll">`;
  revSems.forEach((rs,gi)=>{
    const locked=rs>semana;
    const isCur=(rs===nextRev&&!ST.rev.done===false)||rs===nextRev;
    const col=locked?'ft-gr':rs===0?'ft-vd':'ft-az';
    const gtit=rs===0?'Inicio':'S'+rs;
    fotosH+=`<div class="fgrp"><div class="fgrp-t ${col}">${gtit}</div>`;
    POSES.forEach((pos,pi)=>{
      // Look for foto in correct place based on semana
      let stored=null;
      if(isCur){
        // Current revision: look in ST.rev.fotos
        stored=ST.rev.fotos['rev_'+pi]||null;
      } else {
        // Past/future: look in ST.revHistorial
        stored=(ST.revHistorial&&ST.revHistorial[rs]&&ST.revHistorial[rs].fotos&&ST.revHistorial[rs].fotos['rev_'+pi])||null;
      }
      fotosH+=`<div class="fslot ${locked?'locked':stored?'has':''}" onclick="${locked?'':'triggerPF('+gi+','+pi+')'}">
        ${stored
          ?`<button data-gi="${gi}" data-pi="${pi}" data-rs="${rs}" data-cur="${isCur?1:0}" onclick="event.preventDefault();event.stopPropagation();confirmarBorrarFoto(this)" style="position:absolute;top:4px;left:4px;background:rgba(220,30,30,.85);border:none;border-radius:50%;width:26px;height:26px;color:#fff;font-size:13px;cursor:pointer;z-index:3">🗑</button><img src="${stored}" alt="${pos}"><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.4);color:#fff;font-size:9px;font-weight:600;text-align:center;padding:2px">${pos}</div>`
          :`<div class="fslot-lbl">${locked?'🔒':pos}</div>`}
      </div>`;
    });
    fotosH+=`</div>`;
  });
  fotosH+=`</div><input type="file" accept="image/*" id="pfin" onchange="loadPF(this)">`;

  // Medidas comparativa
  const MEDS=[['peso','Peso','kg'],['pecho','Pecho','cm'],['cintura','Cintura','cm'],['cadera','Cadera','cm'],['bicepsd','Bíceps der.','cm'],['bicepsi','Bíceps izq.','cm'],['muslod','Muslo der.','cm'],['musloi','Muslo izq.','cm'],['gemelod','Gemelo der.','cm'],['gemeloi','Gemelo izq.','cm']];
  const med=ST.rev.medidas||{};
  const medIni=ST.medidasIni||{};
  const hayMeds=Object.keys(med).length>0;

  return`
<div class="card">
  <div class="ch"><h2>⚖️ Registrar peso</h2></div>
  <div class="cb">
    <div style="font-size:13px;color:var(--t2);margin-bottom:10px">Una vez al día, en ayunas por la mañana.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div>
        <div style="font-size:10.5px;font-weight:700;color:var(--t3);margin-bottom:4px">FECHA</div>
        <input type="date" id="pesoFecha" value="${today}" max="${today}" style="width:100%;border:1.5px solid var(--bor);border-radius:9px;padding:10px 8px;font-size:13px;outline:none;font-family:inherit;color:var(--t1)">
      </div>
      <div>
        <div style="font-size:10.5px;font-weight:700;color:var(--t3);margin-bottom:4px">PESO (kg)</div>
        <input type="number" inputmode="decimal" id="pesoVal" placeholder="0.0" step="0.1" style="width:100%;border:1.5px solid var(--bor);border-radius:9px;padding:10px 8px;font-size:15px;font-weight:700;outline:none;font-family:inherit;color:var(--az)">
      </div>
    </div>
    <button class="btn btnp btnf" onclick="addPeso()" style="margin-bottom:14px">Guardar peso ✓</button>
    ${pesos.length?`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:14px">
      <div class="maci"><div class="macv" style="color:var(--t2);font-size:17px">${ST.pesoInicial}kg</div><div class="macl">Peso inicial</div></div>
      <div class="maci"><div class="macv" style="color:var(--az2);font-size:17px">${ST.objPeso}kg</div><div class="macl">Objetivo</div></div>
      <div class="maci"><div class="macv" style="color:${cambio<0?'var(--vd)':'var(--rj)'};font-size:17px">${cambio>0?'+':''}${cambio.toFixed(1)}kg</div><div class="macl">Cambio total</div></div>
      <div class="maci"><div class="macv" style="color:var(--az);font-size:17px">${left>0?left.toFixed(1).replace('.',',')+' kg':'✅'}</div><div class="macl">Para objetivo</div></div>
      <div class="maci"><div class="macv" style="color:var(--az2);font-size:17px">${ST.p.objSemKg!=null?Math.abs(ST.p.objSemKg).toString().replace('.',',')+'kg':ST.bajanSem+'kg'}</div><div class="macl">Ritmo/sem</div></div>
      <div class="maci"><div class="macv" style="color:var(--az);font-size:17px">${semsTotal}sem</div><div class="macl">Sem. totales</div></div>
    </div>
    ${chartHTML}
    <div style="cursor:pointer;margin-top:10px;display:flex;justify-content:space-between" onclick="toggleProgSection('pesos')">
      <span style="font-size:11.5px;font-weight:600;color:var(--t3)">HISTORIAL DE PESOS</span>
      <span style="color:var(--t3)">${ST.pesosOpen?'▲':'▼'}</span>
    </div>
    ${ST.pesosOpen?buildPesosList(pesos):''}
    `:'<div style="text-align:center;color:var(--t3);font-size:13px;padding:12px 0">Añade tu primer peso para ver la evolución</div>'}
  </div>
</div>

<div class="card">
  <div class="ch" style="cursor:pointer" onclick="toggleProgSection('fotos')">
    <h2>📸 Fotos de progreso</h2>
    <span style="color:var(--t3)">${ST.fotosOpen?'▲':'▼'}</span>
  </div>
  ${ST.fotosOpen?`<div class="cb" style="padding-bottom:8px">${fotosH}</div>`:''}
</div>

${buildMedidasTable(revSems,ST.revHistorial||{})}

<div class="card"><div class="ch"><h2>🏆 Logros</h2></div><div class="cb">
  ${[
    {i:'⚡',n:'Primera semana',d:'Completaste tu primera semana',ok:ST.u.semana>=1},
    {i:'🏋️',n:'Primer mes',d:'4 semanas completadas',ok:ST.u.semana>=4},
    {i:'📸',n:'Primera revisión',d:'Enviaste tu primera revisión',ok:ST.rev.done},
    {i:'🔥',n:'Racha de 7 días',d:'7 días seguidos en verde',ok:ST.racha>=7},
    {i:'🎯',n:'Semana perfecta',d:'Entrenos + nutrición + pasos al 100%',ok:false},
    {i:'💪',n:'Bloque completado',d:'12 semanas finalizadas',ok:ST.u.semana>=12},
  ].map(l=>`<div class="logro ${l.ok?'':'locked'}"><div class="logro-ico">${l.i}</div><div><div class="logro-nom">${l.n}</div><div class="logro-desc">${l.d}</div></div>${l.ok?'<span class="badge bvd">✓</span>':''}</div>`).join('')}
</div></div>
${(function(){
  var m=(ST.revHistorial&&ST.revHistorial[0]&&ST.revHistorial[0].medidas)||{};
  var ent=Object.entries(m).filter(function(e){var v=e[1];return v&&(typeof v==='number'||(typeof v==='object'&&Object.values(v).length>0));});
  if(!ent.length)return'';
  var vals=ent.map(function(e){var nom=e[0].replace(/\s*\([^)]*\)/g,'').trim();var v=e[1];if(typeof v==='object')v=Object.values(v)[0];return'<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--bor2);font-size:13px"><span style="color:var(--t2)">'+nom+'</span><span style="font-weight:700">'+v+' cm</span></div>';}).join('');
  return'<div class="card" style="margin-bottom:12px"><div class="ch" onclick="toggleProgSection(1)" style="cursor:pointer"><h2>📏 Medidas corporales</h2><span style="color:var(--t3)">'+(ST.medidasOpen?'▲':'▼')+'</span></div>'+(ST.medidasOpen?'<div class="cb"><div style="font-size:11px;color:var(--t3);margin-bottom:8px">Medidas iniciales · S0</div>'+vals+'</div>':'')+'</div>';
})()}`;
}

let _pfGi=0,_pfPi=0;
function triggerPF(gi,pi){_pfGi=gi;_pfPi=pi;document.getElementById('pfin').click();}
function loadPF(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{ST.rev.fotos[`prog_${_pfGi}_${_pfPi}`]=e.target.result;save();render();};r.readAsDataURL(f);}
function buildPesosList(pesos){
  var h='<div style="margin-top:8px">';
  [...pesos].reverse().forEach(function(p,ri){
    var d=p.f.split('-');var realIdx=pesos.length-1-ri;
    h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bor2);font-size:13px">'
      +'<span style="color:var(--t2)">'+d[2]+'/'+d[1]+'/'+d[0].slice(2)+'</span>'
      +'<div style="display:flex;align-items:center;gap:8px">'
        +'<span style="font-weight:700;color:var(--az)">'+p.v+'kg</span>'
        +'<button onclick="delPeso('+realIdx+')" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:14px;padding:2px">&#128465;</button>'
      +'</div></div>';
  });
  return h+'</div>';
}
function delPeso(idx){
  if(!confirm('¿Borrar este peso?'))return;
  var p=ST.pesos[idx];
  ST.pesos.splice(idx,1);save();
  // Delete from BD
  if(p&&p.f){
    api('DELETE','/api/entreno/peso?fecha='+encodeURIComponent(p.f)).catch(function(e){console.warn('delPeso BD:',e);});
  }
  var ct=document.getElementById('ct');
  if(ct&&SEC==='progreso'){var sp=ct.scrollTop;ct.innerHTML=renderProgreso();ct.scrollTop=sp;}
}
function addPeso(){
  const v=document.getElementById('pesoVal').value;
  const f=document.getElementById('pesoFecha').value;
  const n=parseFloat(v);
  if(isNaN(n)||n<30||n>300){toast('Peso inválido','rj');return;}
  if(!f){toast('Selecciona una fecha','rj');return;}
  const i=ST.pesos.findIndex(p=>p.f===f);
  if(i>=0)ST.pesos[i].v=n;
  else{ST.pesos.push({f,v:n});ST.pesos.sort((a,b)=>a.f.localeCompare(b.f));}
  save();toast('Peso guardado ✓','vd');
  if(_tk)api('POST','/api/entreno/peso',{fecha:f,peso:n}).catch(e=>console.warn('[API] Peso:',e));
  document.getElementById('ct').innerHTML=renderProgreso();
}

// ── REVISIÓN ──
const BODY_B64='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';

function renderRevision(){
  if(ST._editandoRevSem!=null)return renderRevisionEdit(ST._editandoRevSem);
  const {semana,tipo,inicioBloque}=ST.u;
  const semTotal=tipo==='programa'?13:12;
  const revSems=tipo==='programa'?[4,8,12]:[3,7,11];
  const nextRev=revSems.find(rs=>rs>=semana)||revSems[revSems.length-1];
  const {done,fotos,medidas,preguntas}=ST.rev;
  const step=ST.rev.step||0;

  // Calcular fecha de cada revisión
  function revFecha(rs){
    if(!inicioBloque)return'';
    const d=new Date(inicioBloque);
    if(rs===0){
      // S0 = sábado de la semana ANTERIOR al inicio del bloque
      // inicioBloque es lunes semana 1 → S0 es el sábado 2 días antes
      d.setDate(d.getDate()-2);
    } else {
      // Sn = inicio + (n-1)*7 días → avanzar al próximo sábado de esa semana
      d.setDate(d.getDate()+(rs-1)*7);
      const dow=d.getDay();
      const diasHastaSab=(6-dow+7)%7;
      d.setDate(d.getDate()+diasHastaSab);
    }
    // Formato europeo: DD/MM
    return ('0'+d.getDate()).slice(-2)+'/'+(('0'+(d.getMonth()+1)).slice(-2));
  }

  // Historial de revisiones arriba
  let histH='<div class="card" style="margin-bottom:12px"><div class="ch"><h2>📋 Revisiones del bloque</h2></div><div class="cb" style="padding:0">';
  const allRevSems=[0,...revSems];
  allRevSems.forEach(rs=>{
    const isPast=rs<nextRev;
    const isCur=rs===nextRev;
    const isFut=rs>nextRev;
    const hasData=ST.revHistorial&&ST.revHistorial[rs];
    const ico=isPast?'✅':isCur?'⏳':'🔒';
    const col=isCur?'var(--nr)':isPast?'var(--vd)':'var(--t3)';
    const txt=isPast?(hasData?'Completada · Toca para ver/editar':'Pasada · Sin datos'):isCur?'Pendiente':'Próxima';
    const fecha=revFecha(rs);
    const clickable=isPast||isCur;
    histH+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 15px;border-bottom:1px solid var(--bor2);cursor:${clickable?'pointer':'default'}" ${isPast?'onclick="verRevAnterior('+rs+')"':isCur?'onclick="document.getElementById(\'rev-actual\').scrollIntoView({behavior:\'smooth\'})"':''}>
      <div>
        <div style="font-size:14px;font-weight:700;color:${col}">${ico} Semana ${rs} ${fecha?'· <span style="font-weight:400;font-size:12px;color:var(--t3)">~'+fecha+'</span>':''}</div>
        <div style="font-size:12px;color:var(--t3);margin-top:2px">${txt}</div>
      </div>
      ${clickable?`<span style="font-size:12px;color:var(--az2);font-weight:700">${isPast?(hasData?'Ver/Editar →':'Sin datos'):'Ir →'}</span>`:''}
    </div>`;
  });
  histH+='</div></div>';

  if(done)return histH+`<div class="sent" id="rev-actual"><div><b>✅ Revisión S${nextRev} enviada</b><small>Tu entrenador la revisará en breve</small></div><button class="btn btns btno" onclick="ST.rev.done=false;save();render()">Editar</button></div>`;

  // Steps
  const PP=tipo==='programa'?
    ['¿Cómo te sientes esta semana?','¿Cómo han ido los entrenamientos?','¿Cómo ha ido la nutrición?','¿Qué funcionó mejor?','¿Qué cambiarías?']:
    ['¿Cómo te sientes esta semana?','¿Cuáles fueron tus mayores éxitos?','¿Cómo te sentiste con ellos?','¿Qué tal los entrenamientos?','¿Qué tal la nutrición?','¿Qué mejorarías?','¿Algo más que quieras compartir?'];

  const POSES=['Frente','Perfil der.','Perfil izq.','Espalda'];
  const MEDS=[['hombros','Hombros','zona mas amplia'],['pecho','Pecho','zona mas amplia'],['brazoi','Brazo izq. contraído','contraído'],['brazod','Brazo dcho. contraído','contraído'],['cintura','Cintura ombligo','a la altura del ombligo'],['musloi','Muslo izq. relajado','relajado'],['muslod','Muslo dcho. relajado','relajado'],['gemeloi','Gemelo izq. contraído','contraído'],['gemelod','Gemelo dcho. contraído','contraído']];

  const stepLabels=['📸 Fotos','📏 Medidas','💬 Preguntas'];
  const stepsBar=stepLabels.map((l,i)=>`<div class="rev-step ${i<step?'rs-done':i===step?'rs-act':'rs-fut'}" onclick="ST.rev.step=${i};render()" title="${l}"></div>`).join('');

  let content='';
  if(step===0){
    // Fotos + cuerpo
    content=`<div style="font-size:13px;color:var(--t2);margin-bottom:12px">Sube 4 fotos comparativas: frente, dos perfiles y espalda.</div>`;
    content+=`<div class="rfg">`;
    POSES.forEach((pos,pi)=>{
      const f=fotos['rev_'+pi];
      content+=`<div class="rfb ${f?'done':''}" style="position:relative" onclick="${f?'':'triggerRF('+pi+')'}">
        ${f
          ?`<img src="${f}"><button onclick="event.stopPropagation();if(confirm('¿Borrar esta foto?')){delete ST.rev.fotos['rev_'+${pi}];save();render();}" style="position:absolute;top:4px;left:4px;background:rgba(220,30,30,.85);border:none;border-radius:50%;width:26px;height:26px;color:#fff;font-size:13px;cursor:pointer;z-index:3">🗑</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.45);color:#fff;font-size:10px;font-weight:600;text-align:center;padding:3px">${pos}</div>`
          :`<div onclick="triggerRF(${pi})" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer"><div style="font-size:24px">📷</div><div class="rfb-lbl">${pos}</div></div>`}
      </div>`;
    });
    content+=`</div><input type="file" accept="image/*" id="rfin" onchange="loadRF(this)">`;
    content+=`<button class="btn btnp btnf" onclick="ST.rev.step=1;render()">Siguiente → Medidas</button>`;
  }
  else if(step===1){
    content=`<div style="display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1">
        <div style="font-size:13px;color:var(--t2);margin-bottom:12px">Mídete en ayunas, sin ropa, con cinta métrica.</div>
        <div style="background:rgba(0,122,255,.08);border-radius:6px;padding:8px;margin-bottom:10px;font-size:11px;color:var(--az)">Mide en la zona mas amplia. Si pone contraido, aprieta el musculo al medir.</div>${MEDS.map(([k,l,desc])=>`<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:700;color:var(--t2);display:block;margin-bottom:1px">${l}</label><div style="font-size:10px;color:var(--t3);margin-bottom:3px">${desc||''}</div><input class="medin" type="number" inputmode="decimal" placeholder="—" value="${medidas[k]||''}" onchange="ST.rev.medidas['${k}']=this.value;save()" step="0.1"></div>`).join('')}
      </div>
      <img src="data:image/png;base64,${BODY_B64}" style="width:100px;flex-shrink:0;margin-top:32px;opacity:.85" alt="Guía de medidas">
    </div>`;
    content+=`<div style="display:flex;gap:8px">
      <button class="btn btno" style="flex:1" onclick="ST.rev.step=0;render()">← Atrás</button>
      <button class="btn btnp" style="flex:1" onclick="ST.rev.step=2;render()">Siguiente → Preguntas</button>
    </div>`;
  }
  else{
    content=PP.map((q,i)=>`<div style="margin-bottom:12px"><div style="font-size:13.5px;font-weight:600;margin-bottom:5px">${i+1}. ${q}</div><textarea class="preqa" placeholder="Tu respuesta..." onchange="ST.rev.preguntas[${i}]=this.value;save()">${preguntas[i]||''}</textarea></div>`).join('');
    content+=`<div style="display:flex;gap:8px">
      <button class="btn btno" style="flex:1" onclick="ST.rev.step=1;render()">← Atrás</button>
      <button class="btn btnp" style="flex:1" onclick="enviarRev()">Enviar ✓</button>
    </div>`;
  }

  return histH+`<div class="card" id="rev-actual">
    <div class="ch"><h2>📋 Revisión Semana ${nextRev}</h2><span class="badge bnr">Pendiente</span></div>
    <div class="cb">
      <div class="rev-steps" style="margin-bottom:14px">${stepsBar}</div>
      <div style="display:flex;gap:6px;margin-bottom:14px">
        ${stepLabels.map((l,i)=>`<div style="font-size:11px;font-weight:${i===step?'700':'400'};color:${i===step?'var(--nr)':i<step?'var(--vd)':'var(--t3)'};cursor:pointer;padding:4px 8px;border-radius:6px;background:${i===step?'var(--nr2)':i<step?'var(--vd2)':'var(--bg)'}" onclick="ST.rev.step=${i};render()">${i<step?'✓ ':i===step?'→ ':''}${l}</div>`).join('')}
      </div>
      ${content}
    </div>
  </div>`;
}

let _rfIdx=0;
function triggerRF(i){_rfIdx=i;document.getElementById('rfin').click();}
function loadRF(inp){
  const f=inp.files[0];if(!f)return;
  // Compress to max 1200px and <8MB before storing
  const img=new Image();
  const reader=new FileReader();
  reader.onload=e=>{
    img.onload=function(){
      const MAX=1200;
      let w=img.width,h=img.height;
      if(w>MAX||h>MAX){
        if(w>h){h=Math.round(h*MAX/w);w=MAX;}
        else{w=Math.round(w*MAX/h);h=MAX;}
      }
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      const compressed=canvas.toDataURL('image/jpeg',0.82);
      ST.rev.fotos['rev_'+_rfIdx]=compressed;
      save();render();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(f);
}
function enviarRev(){
  var fotos=ST.rev.fotos||{};
  var medidas=ST.rev.medidas||{};
  var preguntas=ST.rev.preguntas||{};
  var tipo=ST.u.tipo;
  var nFotos=Object.keys(fotos).filter(function(k){return k.startsWith('rev_');}).length;
  var nMeds=Object.keys(medidas).filter(function(k){return medidas[k];}).length;
  var PP=tipo==='programa'?5:7;
  var nPregs=Object.values(preguntas).filter(function(v){return v&&v.trim();}).length;
  // All required
  if(nFotos<4){toast('Sube las 4 fotos (frente, perfiles y espalda)','rj');ST.rev.step=0;render();return;}
  if(nMeds<9){toast('Rellena todas las medidas corporales','rj');ST.rev.step=1;render();return;}
  if(nPregs<PP){toast('Responde todas las preguntas','rj');ST.rev.step=2;render();return;}
  _doEnviarRev();
}
async function _doEnviarRev(){
  ST.rev.done=true;
  const {semana,tipo}=ST.u;
  const revSems=tipo==='programa'?[4,8,12]:[3,7,11];
  const nextRev=revSems.find(s=>s>=semana)||revSems[revSems.length-1];
  if(!ST.revHistorial)ST.revHistorial={};
  ST.revHistorial[nextRev]={fotos:{...ST.rev.fotos},medidas:{...ST.rev.medidas},preguntas:{...ST.rev.preguntas},fecha:new Date().toISOString().split('T')[0]};
  if(!Object.keys(ST.medidasIni).length&&Object.keys(ST.rev.medidas).length)ST.medidasIni={...ST.rev.medidas};
  save();render();toast('Subiendo fotos y guardando revisión...','');

  if(_tk){
    // Upload photos to Cloudinary
    const POSES=['frente','perfil_d','perfil_i','espalda'];
    const fotoUrls={};
    const fotosB64=ST.rev.fotos||{};
    for(let i=0;i<4;i++){
      const b64=fotosB64['rev_'+i];
      if(b64){
        try{
          const res=await api('POST','/api/entreno/upload-foto',{
            foto_b64:b64,
            pose:POSES[i],
            semana:nextRev
          });
          if(res.url)fotoUrls['rev_'+i]=res.url;
        }catch(e){
          console.warn('[Cloudinary] Error subiendo foto',i,e);
          fotoUrls['rev_'+i]=b64; // fallback to base64
        }
      }
    }
    // Save revision with photo URLs
    api('POST','/api/entreno/revision',{
      semana:nextRev,
      medidas:ST.rev.medidas||{},
      preguntas:ST.rev.preguntas||{},
      fotos:fotoUrls,
      estado:'revisada'
    }).then(function(){
      toast('Revisión S'+nextRev+' enviada ✓','vd');
      console.log('[BD] Revision S'+nextRev+' saved with photos');
    }).catch(function(e){
      console.warn('[BD] Revision save error:',e);
    });
  } else {
    toast('Revisión S'+nextRev+' guardada ✓','vd');
  }
}
function editarRevAnterior(sem){
  function doEdit(){
    ST._editandoRevSem=sem;
    S('revision');
  }
  if(_tk){
    api('GET','/api/entreno/revision/'+sem).then(function(d){
      if(!ST.revHistorial)ST.revHistorial={};
      var existing=ST.revHistorial[sem]||{};
      var fromBD=d||{medidas:{},fotos:{},preguntas:{}};
      // Preserve local fotos — BD doesn't have them yet (no Drive)
      ST.revHistorial[sem]={
        medidas:fromBD.medidas||existing.medidas||{},
        preguntas:fromBD.preguntas||existing.preguntas||{},
        fotos:Object.assign({},fromBD.fotos||{},existing.fotos||{})
      };
      doEdit();
    }).catch(function(){
      if(!ST.revHistorial)ST.revHistorial={};
      if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
      doEdit();
    });
  } else {
    if(!ST.revHistorial)ST.revHistorial={};
    if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
    doEdit();
  }
}
function verRevAnterior(sem){
  function show(){
    var hist=ST.revHistorial&&ST.revHistorial[sem];
    if(!hist){
      var html='<div style="text-align:center;padding:20px;color:var(--t3)">No hay datos para S'+sem+'</div>';
      html+='<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btno" style="flex:1" onclick="closeModal()">Cerrar</button><button class="btn btnp" style="flex:1" onclick="closeModal();editarRevAnterior('+sem+')">Añadir datos</button></div>';
      openModal('Revision S'+sem,html);return;
    }
    var POSES=['Frente','Perfil der.','Perfil izq.','Espalda'];
    var html='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">';
    POSES.forEach(function(pos,pi){
      var f=hist.fotos&&(hist.fotos['rev_'+pi]||hist.fotos['s'+sem+'_'+pi]);
      html+='<div style="aspect-ratio:3/5;border-radius:8px;overflow:hidden;background:var(--bg);border:1px solid var(--bor)">'+(f?'<img src="'+f+'" style="width:100%;height:100%;object-fit:cover">':'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:var(--t3);padding:4px;text-align:center">'+pos+'</div>')+'</div>';
    });
    html+='</div>';
    var meds=hist.medidas||{};
    var medE=Object.entries(meds);
    if(medE.length){
      html+='<div style="font-weight:700;font-size:13px;margin-bottom:8px">Medidas</div>';
      medE.forEach(function(e){
        var nom=e[0];var vals=e[1];
        var v=typeof vals==='object'?(vals['S'+sem]||vals['s'+sem]||Object.values(vals)[0]||''):vals;
        if(v)html+='<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--bor2);font-size:12px"><span style="color:var(--t2)">'+nom.split('(')[0].trim()+'</span><span style="font-weight:700">'+v+' cm</span></div>';
      });
    }
    var pregs=hist.preguntas||{};
    var pregE=Object.entries(pregs).filter(function(e){return e[1];});
    if(pregE.length){
      html+='<div style="font-weight:700;font-size:13px;margin:12px 0 8px">Respuestas</div>';
      pregE.forEach(function(e){html+='<div style="background:var(--bg);border-radius:8px;padding:8px;margin-bottom:6px;font-size:12px;color:var(--t2);border-left:3px solid var(--az2)">'+e[1]+'</div>';});
    }
    html+='<div style="display:flex;gap:8px;margin-top:14px"><button class="btn btno" style="flex:1" onclick="closeModal()">Cerrar</button><button class="btn btnp" style="flex:1" onclick="closeModal();editarRevAnterior('+sem+')">Editar</button></div>';
    openModal('Revision S'+sem,html);
  }
  if(_tk){
    api('GET','/api/entreno/revision/'+sem).then(function(d){
      if(!ST.revHistorial)ST.revHistorial={};
      var existing=ST.revHistorial[sem]||{};
      var fromBD=d||{medidas:{},fotos:{},preguntas:{}};
      ST.revHistorial[sem]={
        medidas:fromBD.medidas||existing.medidas||{},
        preguntas:fromBD.preguntas||existing.preguntas||{},
        fotos:Object.assign({},fromBD.fotos||{},existing.fotos||{})
      };
      show();
    }).catch(function(){
      if(!ST.revHistorial)ST.revHistorial={};
      if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
      show();
    });
    return;
  }
  show();
}


function renderRevisionEdit(sem){
  if(!ST.revHistorial)ST.revHistorial={};
  if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
  var hist=ST.revHistorial[sem];
  var POSES=['Frente','Perfil der.','Perfil izq.','Espalda'];
  var MEDS=[['hombros','Hombros'],['pecho','Pecho'],['brazoi','Brazo izq.'],['brazod','Brazo dcho.'],['cintura','Cintura ombligo'],['musloi','Muslo izq.'],['muslod','Muslo dcho.'],['gemeloi','Gemelo izq.'],['gemelod','Gemelo dcho.']];
  var h='<div style="padding:4px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><button class="btn bo bs" onclick="ST._editandoRevSem=null;render()">&#8592; Volver</button><div style="font-weight:700;font-size:15px">Revision S'+sem+'</div></div>';
  h+='<div class="card" style="margin-bottom:12px"><div class="ch"><h2>Fotos</h2></div><div class="cb"><div class="rfg">';
  POSES.forEach(function(pos,pi){
    var f=hist.fotos&&hist.fotos['rev_'+pi];
    h+='<div class="rfb '+(f?'done':'')+'" style="position:relative" onclick="triggerRevHistFoto('+sem+','+pi+')">'
      +(f?'<img src="'+f+'"><button data-sem="'+sem+'" data-pi="'+pi+'" onclick="event.stopPropagation();revHistDelFoto(this)" style="position:absolute;top:4px;left:4px;background:rgba(220,30,30,.85);border:none;border-radius:50%;width:24px;height:24px;color:#fff;font-size:11px;cursor:pointer;z-index:3">&#128465;</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.45);color:#fff;font-size:10px;text-align:center;padding:2px">'+pos+'</div>'
        :'<div style="font-size:24px">&#128247;</div><div style="font-size:10px;color:var(--t3)">'+pos+'</div>')
    +'</div>';
  });
  h+='</div></div></div>';
  var meds=hist.medidas||{};
  var dbE=Object.entries(meds);
  h+='<div class="card" style="margin-bottom:12px"><div class="ch"><h2>Medidas</h2></div><div class="cb">';
  if(dbE.length){
    dbE.forEach(function(e){
      var nom=e[0];var vals=e[1];
      var v=typeof vals==='object'?(vals['S'+sem]||Object.values(vals)[0]||''):vals;
      h+='<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--bor2);font-size:13px"><span style="color:var(--t2)">'+nom.split('(')[0].trim()+'</span><span style="font-weight:700">'+v+' cm</span></div>';
    });
    h+='<div style="font-size:11px;color:var(--t3);margin-top:8px">Para cambiar medidas contacta con tu entrenador.</div>';
  } else {
    MEDS.forEach(function(m){
      var k=m[0],l=m[1];
      h+='<div style="margin-bottom:8px"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:3px">'+l+'</label><input type="number" step="0.1" value="'+(meds[k]||'')+'" placeholder="--" data-sem="'+sem+'" data-k="'+k+'" style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:8px;font-size:14px;box-sizing:border-box" onchange="revHistMed(this)"></div>';
    });
  }
  h+='</div></div>';
  h+='<button class="btn bp" style="width:100%;padding:14px" onclick="guardarRevAnterior('+sem+')">Guardar y volver</button></div>';
  return h;
}

function triggerRevHistFoto(sem,pi){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      if(!ST.revHistorial)ST.revHistorial={};
      if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
      ST.revHistorial[sem].fotos['rev_'+pi]=ev.target.result;
      save();render();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function confirmarBorrarFoto(btn){
  var gi=parseInt(btn.dataset.gi),pi=parseInt(btn.dataset.pi);
  var rs=parseInt(btn.dataset.rs),isCur=btn.dataset.cur==='1';
  if(!confirm('¿Borrar esta foto?'))return;
  if(isCur){
    delete ST.rev.fotos['rev_'+pi];
    save();
  } else {
    if(ST.revHistorial&&ST.revHistorial[rs]&&ST.revHistorial[rs].fotos)
      delete ST.revHistorial[rs].fotos['rev_'+pi];
    save();
  }
  // Update progreso in-place without scroll
  var ct=document.getElementById('ct');
  if(ct&&SEC==='progreso'){var sp=ct.scrollTop;ct.innerHTML=renderProgreso();ct.scrollTop=sp;}
  else render();
}
function revHistDelFoto(btn){
  var sem=parseInt(btn.dataset.sem),pi=parseInt(btn.dataset.pi);
  if(!ST.revHistorial||!ST.revHistorial[sem])return;
  delete ST.revHistorial[sem].fotos['rev_'+pi];
  save();render();
}

function revHistMed(inp){
  var sem=parseInt(inp.dataset.sem),k=inp.dataset.k;
  if(!ST.revHistorial)ST.revHistorial={};
  if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
  var v=parseFloat(inp.value);
  if(!isNaN(v)&&v>0)ST.revHistorial[sem].medidas[k]=v;
  else delete ST.revHistorial[sem].medidas[k];
  save();
}

function guardarRevAnterior(sem){
  if(!ST.revHistorial)ST.revHistorial={};
  if(!ST.revHistorial[sem])ST.revHistorial[sem]={medidas:{},fotos:{},preguntas:{}};
  var hist=ST.revHistorial[sem];
  save();
  if(_tk){
    api('POST','/api/entreno/revision',{semana:sem,medidas:hist.medidas||{},preguntas:hist.preguntas||{},estado:'revisada'}).then(function(){
      toast('Revision S'+sem+' guardada','vd');
      ST._editandoRevSem=null;render();
    }).catch(function(e){toast('Error: '+e.message,'rj');});
  } else {
    toast('Guardado local','vd');
    ST._editandoRevSem=null;render();
  }
}


function logout(){
  _tk=null;
  localStorage.removeItem('ef_tk');
  localStorage.removeItem('ef_role');
  location.reload();
}

function renderPerfil(){
  const u=ST.u;
  const macro=ST.p.macro;
  const edad=u.dob?Math.floor((new Date()-new Date(u.dob))/31557600000):'—';
  const pesoAct=ST.pesos&&ST.pesos.length?ST.pesos[ST.pesos.length-1].v:(ST.pesoInicial||'—');
  const objPeso=ST.objPeso||'—';
  const altura=u.altura||'—';
  const diasEnt=u.diasEnt||DIAS.filter(d=>!d.rest).length||4;
  const FAQS=[
    {q:'¿Cómo caliento?',a:'El calentamiento es imprescindible. Al final añade series de aproximación: series ascendentes de peso para acercarte al peso de trabajo. <a href="https://youtu.be/_iYj9gAxjx4" target="_blank" style="color:var(--az)">Ver vídeo →</a>'},
    {q:'¿Qué es el RIR?',a:'Son las repeticiones que te dejas en recámara. RIR 2 con 12 reps significa que puedes hacer 14 pero paras en 12.'},
    {q:'¿Cómo escojo el peso?',a:'Usa las reps y el RIR marcados. Pregúntate: ¿qué peso necesito para hacer X reps dejándome Y en recámara?'},
    {q:'¿Cuánto descanso entre series?',a:'Ejercicios básicos: RIR 4 → 2-3 min · RIR 3 → 3 min · RIR 2 → 4 min · RIR 1 → 5 min. Multiarticulares máquina o menos demandantes: 2-3 min. Monoarticulares: 1-2 min.'},
    {q:'¿Cómo progreso?',a:'Durante el bloque no cambian los ejercicios, series, reps ni RIR. Lo que progresa semana a semana son los kilos. En ejercicios con rango de reps, también puedes progresar en repeticiones dentro del rango. No fuerces el progreso a costa del protocolo.'},
    {q:'¿Puedo entrenar con dolor?',a:'Máximo 4/10 en escala del 0 al 10. Si supera ese umbral, baja el peso hasta que el dolor baje.'},
    {q:'¿Cuándo y cómo pesarme?',a:'Mínimo 3 días a la semana en ayunas para tener una media fiable.'},
    {q:'¿Cómo funciona el plan nutricional?',a:'Escoge en cada comida un alimento de cada sección con sus respectivas cantidades.'},
    {q:'¿Cómo peso los alimentos?',a:'Durante la primera semana pesa los alimentos. Así te haces el ojo y en semanas siguientes no necesitarás pesar casi nada.'},
    {q:'Consejos nutricionales',a:'Prioriza comidas saciantes: patata, verduras, plancha o cocción. Bebe más agua entre comidas. La pasta o arroz de crudo a cocido multiplica x3 su peso.'},
    {q:'¿Puedo hacer ayuno intermitente?',a:'Si te sienta bien no desayunar, puedes practicar el ayuno y hacer tu primera comida a media mañana.'},
    {q:'¿Cuántas frutas y verduras?',a:'3-4 piezas al día sumando frutas y verduras.'},
  ];
  return`<div style="padding:16px">
    <button onclick="doLogout()" style="width:100%;padding:12px;border-radius:10px;border:none;background:#E74C3C;color:#fff;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;margin-bottom:12px">🚪 Cerrar sesión</button>
    <div class="card" style="margin-bottom:12px">
      <div class="ch" style="display:flex;align-items:center;justify-content:space-between">
        <h2>👤 Mi perfil</h2>
        <span style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;background:${{deficit:'rgba(29,158,117,.15)',reconstruccion:'rgba(26,43,90,.12)',superavit:'rgba(255,107,0,.12)'}[ST.p.fase||'deficit']};color:${{deficit:'var(--vd)',reconstruccion:'var(--az)',superavit:'#FF6B00'}[ST.p.fase||'deficit']}">${{deficit:'📉 Déficit',reconstruccion:'🔄 Reconstrucción',superavit:'📈 Superávit'}[ST.p.fase||'deficit']}</span>
      </div>
      <div class="cb">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          <div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:var(--az)">${pesoAct}kg</div>
            <div style="font-size:10px;color:var(--t3)">Peso actual</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:var(--vd)">${objPeso}kg</div>
            <div style="font-size:10px;color:var(--t3)">Objetivo</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:var(--az2)">${altura}cm</div>
            <div style="font-size:10px;color:var(--t3)">Altura</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:var(--nr)">${edad}</div>
            <div style="font-size:10px;color:var(--t3)">Edad</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          <div style="text-align:center;padding:8px;background:var(--az3);border-radius:6px">
            <div style="font-size:16px;font-weight:800;color:var(--az)">${macro.kcal}</div>
            <div style="font-size:9px;color:var(--t3)">kcal</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--az3);border-radius:6px">
            <div style="font-size:16px;font-weight:800;color:var(--az)">${macro.p}g</div>
            <div style="font-size:9px;color:var(--t3)">prot</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--az3);border-radius:6px">
            <div style="font-size:16px;font-weight:800;color:var(--az)">${macro.c}g</div>
            <div style="font-size:9px;color:var(--t3)">carbs</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--az3);border-radius:6px">
            <div style="font-size:16px;font-weight:800;color:var(--az)">${macro.g}g</div>
            <div style="font-size:9px;color:var(--t3)">grasa</div>
          </div>
        </div>
        ${u.lesiones?'<div style="background:rgba(255,200,0,.1);border:1px solid rgba(255,200,0,.3);border-radius:8px;padding:8px;font-size:12px;margin-bottom:8px">⚠️ <b>Lesiones:</b> '+u.lesiones+'</div>':''}
        <div style="font-size:11px;color:var(--t3);text-align:center">S${u.semana}/${u.semTotal} · ${diasEnt} días/sem · Bloque ${u.bloque||1}</div>
      </div>
    </div>
    <div class="card">
      <div class="ch"><h2>❓ Preguntas frecuentes</h2></div>
      <div class="cb" style="padding:0">
        ${FAQS.map(function(q){return'<div style="padding:12px 16px;border-bottom:1px solid var(--bor2);cursor:pointer" onclick="var a=this.querySelector(\'.faq-a\');a.style.display=a.style.display===\'none\'?\'block\':\'none\'"><div style="font-weight:600;font-size:13px">'+q.q+'</div><div class="faq-a" style="display:none;font-size:12px;color:var(--t2);margin-top:6px">'+q.a+'</div></div>';}).join('')}
      </div>
    </div>
    <div style="padding:16px">
      <button onclick="doLogout()" style="width:100%;padding:13px;border-radius:10px;border:1.5px solid #E74C3C;background:#fff;color:#E74C3C;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer">Cerrar sesión</button>
    </div>
  </div>`;
}



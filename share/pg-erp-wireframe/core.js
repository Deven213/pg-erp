// ---------- state, router, helpers ----------
const ST={role:'auth',prop:'all',stack:[{id:'splash',p:{}}],sheet:null,sheetP:{},dialog:null,mode:'normal',ui:{},f:{},err:{},intent:'owner'};
const S={}, A={}, SH={}, ORDER=[];
function def(id,m){m.id=id;S[id]=m;ORDER.push(id)}
const TABS={
  owner:[['oHome','home','Home'],['propList','bldg','Properties'],['resList','users','Residents'],['finHome','rupee','Finance'],['oMore','grid','More']],
  res:[['rHome','home','Home'],['rRent','rupee','Rent'],['rComplaints','wrench','Complaints'],['rNotices','mega','Notices'],['rProfile','user','Profile']],
  admin:[['aDash','chart','Dashboard'],['aBiz','bldg','Businesses'],['aSubs','star','Plans'],['aTickets','chat','Support'],['aMore','grid','More']]
};
const HOME={auth:'splash',owner:'oHome',res:'rHome',admin:'aDash'};
const ROLE_NAME={auth:'Login & signup',owner:'Owner app',res:'Resident app',admin:'Super Admin console'};
const cur=()=>ST.stack[ST.stack.length-1];
const U=(k,d)=>(k in ST.ui?ST.ui[k]:d);
const F=(k,d)=>(k in ST.f?ST.f[k]:d);

const K=k=>k+'@'+ST.stack.length;
function clrDepth(d){Object.keys(ST.ui).forEach(k=>{if(k.endsWith('@'+d))delete ST.ui[k]})}
function go(id,p){clrDepth(ST.stack.length+1);ST.stack.push({id,p:p||{}});closeOv();render(true)}
function rep(id,p){ST.stack[ST.stack.length-1]={id,p:p||{}};closeOv();render(true)}
function back(){if(ST.stack.length>1)ST.stack.pop();closeOv();render(true)}
function tab(id){for(let d=2;d<9;d++)clrDepth(d);ST.stack=[{id,p:{}}];closeOv();render(true)}
function closeOv(){ST.sheet=null;ST.dialog=null}
function setRole(r,id,p){ST.role=r;ST.stack=[{id:id||HOME[r],p:p||{}}];closeOv();ST.mode='normal';render(true)}
function sheet(name,p){ST.sheet=name;ST.sheetP=p||{};render()}
function confirmD(o){ST.dialog=o;render()}
function setF(o){Object.assign(ST.f,o)}
function clearF(prefix){Object.keys(ST.f).forEach(k=>{if(k.startsWith(prefix))delete ST.f[k]});Object.keys(ST.err).forEach(k=>{if(k.startsWith(prefix))delete ST.err[k]})}

// ---------- formatting ----------
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inr=n=>(n<0?'−':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
const lakh=n=>n>=100000?'₹'+(n/100000).toFixed(2).replace(/\.?0+$/,'')+'L':inr(n);
const pct=(a,b)=>b?Math.round(a*100/b):0;
const initials=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);

// ---------- data accessors ----------
const PR=id=>DB.props.find(x=>x.id===id);
const BL=id=>DB.blds.find(x=>x.id===id);
const RM=id=>DB.rooms.find(x=>x.id===id);
const BD=id=>DB.beds.find(x=>x.id===id);
const RS=id=>DB.res.find(x=>x.id===id);
const IV=id=>DB.inv.find(x=>x.id===id);
const ST_=id=>DB.staff.find(x=>x.id===id);
const ME=()=>RS(DB.me);
const inS=pid=>ST.prop==='all'||ST.prop===pid;
const sBeds=()=>DB.beds.filter(b=>inS(b.propId));
const sRes=()=>DB.res.filter(r=>inS(r.propId)&&r.status!=='Checked out');
const sInv=()=>DB.inv.filter(i=>inS(i.propId));
const sExp=()=>DB.exp.filter(e=>inS(e.propId));
const sComp=()=>DB.comp.filter(c=>inS(c.propId));
const resInv=rid=>DB.inv.find(i=>i.resId===rid);
const loc=r=>{const b=BD(r.bedId),R=RM(b.roomId);return `${PR(r.propId).short} · ${R.no} · Bed ${b.label}`};
const bedName=b=>{const R=RM(b.roomId);return `${R.no} · Bed ${b.label}`};
const resOnBed=bid=>DB.res.find(r=>r.bedId===bid&&r.status!=='Checked out');
const scopeName=()=>ST.prop==='all'?'All Properties':PR(ST.prop).name;
function stats(){
  const b=sBeds(), occ=b.filter(x=>x.status==='Occupied').length, inv=sInv();
  const billed=sum(inv,i=>i.total), paid=sum(inv,i=>i.paid);
  return {beds:b.length,occ,res:b.filter(x=>x.status==='Reserved').length,av:b.filter(x=>x.status==='Available').length,mn:b.filter(x=>x.status==='Maintenance').length,ina:b.filter(x=>x.status==='Inactive').length,
    billed,paid,pending:billed-paid,overdue:sum(inv.filter(i=>i.status==='Overdue'),i=>i.total-i.paid),odCount:inv.filter(i=>i.status==='Overdue').length,dueCount:inv.filter(i=>i.status!=='Paid').length,
    exp:sum(sExp(),e=>e.amt),rooms:DB.rooms.filter(r=>inS(r.propId)).length,blds:DB.blds.filter(x=>inS(x.propId)).length,
    open:sComp().filter(c=>!['Resolved','Closed'].includes(c.status)).length,unasg:sComp().filter(c=>c.status==='New').length,
    kyc:sRes().filter(r=>r.kyc!=='Verified').length,police:sRes().filter(r=>r.police!=='Verified').length,
    verify:DB.pay.filter(p=>p.status==='Verifying'&&inS(p.propId)).length,dep:sum(sRes(),r=>r.deposit)};
}

// ---------- UI atoms ----------
const ic=(n,c='')=>`<svg class="ico ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const bdg=(t,k='mute')=>`<span class="bdg b-${k}">${t}</span>`;
function at(o={}){let s='';if(o.go)s+=` data-go="${o.go}"`;if(o.p)s+=` data-p="${esc(typeof o.p==='string'?o.p:Object.entries(o.p).map(([k,v])=>k+':'+v).join(','))}"`;if(o.act)s+=` data-act="${o.act}"`;if(o.tab)s+=` data-tab="${o.tab}"`;if(o.back)s+=' data-back';if(o.close)s+=' data-close';if(o.go||o.act||o.tab||o.back||o.close)s+=' role="button" tabindex="0"';return s}
const btn=(label,o={})=>`<button class="btn ${o.k||'p'} ${o.sm?'sm':''} ${o.cls||''}"${at(o)}${o.style?` style="${o.style}"`:''}>${o.icon?ic(o.icon):''}${label}</button>`;
const card=(inner,cls='',o={})=>`<div class="card ${cls}"${at(o)}${o.style?` style="${o.style}"`:''}>${inner}</div>`;
const list=items=>`<div class="list">${items.join('')}</div>`;
function li(o){
  const lead=o.av?`<div class="av" style="${o.avs||''}">${o.av}</div>`:o.icon?`<div class="tile" style="background:${o.bg||'var(--slate-50)'};color:${o.fg||'var(--ink-2)'}">${ic(o.icon)}</div>`:(o.lead||'');
  const ch=(o.go||o.act)&&o.chev!==false&&!o.right?ic('right','sm mut2'):'';
  return `<div class="li ${o.cls||''}"${at(o)}${o.style?` style="${o.style}"`:''}>${lead}<div class="tx"><div>${o.title}</div>${o.sub?`<div class="t-s mut">${o.sub}</div>`:''}${o.sub2?`<div class="t-xs mut2">${o.sub2}</div>`:''}</div>${o.right?`<div class="r">${o.right}</div>`:''}${ch}</div>`;
}
const kv=rows=>`<div class="kv">${rows.filter(Boolean).map(([k,v])=>`<div><span>${k}</span><span>${v}</span></div>`).join('')}</div>`;
const sec=(t,link,o)=>`<div class="sec"><b>${t}</b>${link?`<span class="lnk"${at(o)}>${link}</span>`:''}</div>`;
const lbl=t=>`<div class="lbl">${t}</div>`;
const bar=(parts)=>`<div class="bar">${parts.map(([p,c])=>`<i style="width:${p}%;background:${c||'var(--blue)'}"></i>`).join('')}</div>`;
const stat=(l,v,s,c)=>card(`${lbl(l)}<div class="t-l w7 num" style="margin-top:3px;${c?'color:'+c:''}">${v}</div>${s?`<div class="t-xs mut" style="margin-top:2px">${s}</div>`:''}`);
const banner=(k,icon,html,o)=>`<div class="banner ${k}"${at(o||{})}>${ic(icon)}<div style="flex:1">${html}</div></div>`;
function chips(k,opts,def,o={}){const v=U(k,def);return `<div class="chips ${o.scroll?'scroll':''}">${opts.map(x=>{const [val,label,n]=Array.isArray(x)?x:[x,x];return `<button class="chip ${v===val?'on':''}" data-act="ui" data-p="k:${k},v:${val}">${label}${n!==undefined?` <span class="n">${n}</span>`:''}</button>`}).join('')}</div>`}
function seg(k,opts,def){const v=U(k,def);return `<div class="seg">${opts.map(x=>{const [val,label]=Array.isArray(x)?x:[x,x];return `<button class="${v===val?'on':''}" data-act="ui" data-p="k:${k},v:${val}">${label}</button>`}).join('')}</div>`}
function tabsBar(k,opts,def){const v=U(k,def);return `<div class="tabs">${opts.map(x=>{const [val,label]=Array.isArray(x)?x:[x,x];return `<button class="${v===val?'on':''}" data-act="ui" data-p="k:${k},v:${val}">${label}</button>`}).join('')}</div>`}
function pick(id,opts,o={}){if(!(id in ST.f)&&o.v!==undefined)ST.f[id]=Array.isArray(o.v)?[...o.v]:o.v;const v=F(id,o.v);const er=ST.err[id];return `<div class="fld">${o.l?`<span class="flab">${o.l}${o.req?' *':''}</span>`:''}<div class="chips ${er?'err':''}" id="${id}" ${o.req?'data-req':''} data-msg="${o.msg||'Choose one option'}">${opts.map(x=>{const [val,label]=Array.isArray(x)?x:[x,x];const on=o.multi?(v||[]).includes(val):v===val;return `<button class="chip ${on?'on':''}" data-act="${o.multi?'pickm':'pick'}" data-p="id:${id},v:${val}">${on&&o.multi?ic('check','sm'):''}${label}</button>`}).join('')}</div>${er?`<div class="help err">${ic('alert','sm')}${er}</div>`:(o.h?`<div class="help">${o.h}</div>`:'')}</div>`}
function inp(id,o={}){if(!(id in ST.f)&&o.v!==undefined&&o.v!==null&&o.v!=='')ST.f[id]=String(o.v);const v=F(id,o.v??'');const er=ST.err[id];
  return `<div class="fld">${o.l?`<label for="${id}">${o.l}${o.req?' *':''}</label>`:''}<div class="inp ${er?'err':''} ${o.ro?'ro':''}">${o.pre?`<span class="pre">${o.pre}</span>`:''}${o.icon?ic(o.icon,'sm mut2'):''}<input id="${id}" type="${o.type||'text'}" ${o.im?`inputmode="${o.im}"`:''} placeholder="${esc(o.ph||'')}" value="${esc(v)}" ${o.req?'data-req':''} ${o.pat?`data-pat="${esc(o.pat)}"`:''} data-msg="${esc(o.msg||'This field is required')}" ${o.ro?'readonly':''} ${o.max?`maxlength="${o.max}"`:''} ${o.live?'data-live':''} autocomplete="off">${o.suf||''}</div>${er?`<div class="help err">${ic('alert','sm')}${er}</div>`:(o.h?`<div class="help">${o.h}</div>`:'')}</div>`}
function sel(id,opts,o={}){if(!(id in ST.f)&&o.v!==undefined&&o.v!==null&&o.v!=='')ST.f[id]=String(o.v);const v=F(id,o.v??'');const er=ST.err[id];return `<div class="fld">${o.l?`<label for="${id}">${o.l}${o.req?' *':''}</label>`:''}<div class="inp ${er?'err':''}"><select id="${id}" ${o.req?'data-req':''} data-msg="${esc(o.msg||'Please choose an option')}" ${o.live?'data-live':''}>${o.ph?`<option value="">${o.ph}</option>`:''}${opts.map(x=>{const [val,label]=Array.isArray(x)?x:[x,x];return `<option value="${esc(val)}" ${String(v)===String(val)?'selected':''}>${label}</option>`}).join('')}</select>${ic('down','sm mut2')}</div>${er?`<div class="help err">${ic('alert','sm')}${er}</div>`:(o.h?`<div class="help">${o.h}</div>`:'')}</div>`}
function ta(id,o={}){if(!(id in ST.f)&&o.v!==undefined&&o.v!==null&&o.v!=='')ST.f[id]=String(o.v);const v=F(id,o.v??'');const er=ST.err[id];return `<div class="fld">${o.l?`<label for="${id}">${o.l}${o.req?' *':''}</label>`:''}<div class="inp ${er?'err':''}" style="align-items:flex-start"><textarea id="${id}" placeholder="${esc(o.ph||'')}" ${o.req?'data-req':''} data-msg="${esc(o.msg||'This field is required')}" ${o.min?`data-min="${o.min}"`:''}>${esc(v)}</textarea></div>${er?`<div class="help err">${ic('alert','sm')}${er}</div>`:(o.h?`<div class="help">${o.h}</div>`:'')}</div>`}
const tog=(id,def,o={})=>{const v=F(id,def);return `<button class="toggle ${v?'on':''}" data-act="tog" data-p="id:${id}" aria-pressed="${!!v}" aria-label="${esc(o.label||id)}"></button>`};
const togRow=(id,title,sub,def,icon)=>li({icon,title,sub,right:tog(id,def,{label:title}),chev:false});
const cbx=(id,def)=>{const v=F(id,def);return `<span class="cbx ${v?'on':''}" data-act="tog" data-p="id:${id}" role="checkbox" aria-checked="${!!v}" tabindex="0">${v?ic('check','sm'):''}</span>`};
const upl=(id,label,file)=>{const v=F(id,false);return `<div class="upl ${v?'done':''}" data-act="upl" data-p="id:${id},n:${file||'IMG_2026.jpg'}">${ic(v?'check':'upload','lg')}<b>${v?esc(v):label}</b><span class="t-xs">${v?'Tap to replace':'JPG, PNG or PDF · max 5 MB'}</span></div>`};
const stepper=(steps,i)=>`<div class="stepper">${steps.map((s,k)=>`<div class="${k<=i?'on':''}"><i>${k<i?ic('check','sm'):`<span class="t-xs">${k+1}</span>`}</i>${s}</div>`).join('')}</div>`;
const steps=(n,i)=>`<div class="steps">${Array.from({length:n},(_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>`;
const tl=items=>`<div class="tl">${items.map(([t,s,k])=>`<div><span class="dt ${k||''}">${ic(k==='ok'?'check':'clock','sm')}</span><div><div class="w6 t-m">${t}</div><div class="t-s mut">${s}</div></div></div>`).join('')}</div>`;
function emptyB(o){return `<div class="empty"><div class="big" style="background:${o.bg||'var(--blue-50)'};color:${o.fg||'var(--blue)'}">${ic(o.icon||'list','xl')}</div><div class="t-l w7">${o.title}</div><div class="mut" style="max-width:260px">${o.msg||''}</div>${o.cta?btn(o.cta,{go:o.go,act:o.act,p:o.p,style:'max-width:260px'}):''}</div>`}
const statusK={Paid:'ok',Partial:'warn',Due:'info',Overdue:'err',Verified:'ok',Submitted:'info',Pending:'warn',Rejected:'err',Active:'ok',Notice:'warn','Checked out':'mute',New:'err',Assigned:'info','In Progress':'warn',Resolved:'ok',Closed:'mute',Confirmed:'ok','Pending payment':'warn','Checked in':'navy',Cancelled:'mute',Approved:'ok',Success:'ok',Verifying:'warn',Failed:'err',Held:'navy','Refund due':'warn',Refunded:'ok',Occupied:'navy',Available:'ok',Reserved:'info',Maintenance:'warn',Inactive:'mute',Trial:'vio','Past due':'err',Suspended:'mute',Open:'err','Waiting on customer':'warn',Present:'ok',Absent:'err','On leave':'warn',Sent:'ok',Scheduled:'info',Draft:'mute',High:'err',Medium:'warn',Low:'mute'};
const sb=s=>bdg(s,statusK[s]||'mute');
const propTile=(P,sz=38)=>`<div class="tile" style="width:${sz}px;height:${sz}px;background:${P.bg};color:${P.fg};font-weight:700;font-size:12.5px">${P.code}</div>`;
function illus(P,h=120,over=''){const c=P?P.fg:'#0F2A5C';return `<div class="illus" style="height:${h}px"><svg viewBox="0 0 320 ${h}" width="100%" height="${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect x="40" y="${h-80}" width="70" height="66" fill="#fff" stroke="#C9D7F7"/><rect x="120" y="${h-104}" width="110" height="90" fill="#fff" stroke="#C9D7F7"/><rect x="238" y="${h-70}" width="50" height="56" fill="#fff" stroke="#C9D7F7"/>${[0,1,2].map(r=>[0,1,2,3].map(c2=>`<rect x="${132+c2*24}" y="${h-94+r*22}" width="14" height="12" fill="${(r+c2)%3?'#C9D7F7':'#FFD27A'}"/>`).join('')).join('')}${[0,1].map(r=>[0,1].map(c2=>`<rect x="${52+c2*28}" y="${h-70+r*22}" width="14" height="12" fill="#C9D7F7"/>`).join('')).join('')}<rect x="166" y="${h-36}" width="18" height="22" fill="${c}"/><rect x="0" y="${h-14}" width="320" height="14" fill="#D7DEE8"/></svg>${over?`<div class="ov">${over}</div>`:''}</div>`}
function bars(data,o={}){ // data: [{l, v, v2}]
  const W=300,H=o.h||130,pl=34,pb=18,max=o.max||Math.max(...data.map(d=>Math.max(d.v,d.v2||0)))*1.15,bw=Math.min(18,(W-pl)/data.length/(o.two?2.8:1.8));
  const y=v=>H-pb-(v/max)*(H-pb-8);const ticks=[0,max/2,max];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.label||'chart')}">${ticks.map(t=>`<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#E4E8F0"/><text x="${pl-5}" y="${y(t)+3}" font-size="9" text-anchor="end" fill="#8C97A8">${o.fmt?o.fmt(t):Math.round(t)}</text>`).join('')}${data.map((d,i)=>{const cx=pl+(i+.5)*(W-pl)/data.length;return (o.two?`<rect x="${cx-bw-1}" y="${y(d.v)}" width="${bw}" height="${H-pb-y(d.v)}" rx="3" fill="${o.c1||'#2457E6'}"/><rect x="${cx+1}" y="${y(d.v2)}" width="${bw}" height="${H-pb-y(d.v2)}" rx="3" fill="${o.c2||'#F2B45A'}"/>`:`<rect x="${cx-bw/2}" y="${y(d.v)}" width="${bw}" height="${H-pb-y(d.v)}" rx="3" fill="${i===data.length-1?(o.c1||'#2457E6'):(o.c0||'#9FB8F5')}"/>`)+`<text x="${cx}" y="${H-5}" font-size="9" text-anchor="middle" fill="#8C97A8">${d.l}</text>`}).join('')}</svg>${o.two?`<div class="row t-s mut" style="gap:14px"><span class="row" style="gap:5px"><i style="width:9px;height:9px;border-radius:2px;background:${o.c1||'#2457E6'};display:inline-block"></i>${o.n1}</span><span class="row" style="gap:5px"><i style="width:9px;height:9px;border-radius:2px;background:${o.c2||'#F2B45A'};display:inline-block"></i>${o.n2}</span></div>`:''}`}
function ring(p,label,sz=78,c='#2457E6'){const r=26,C=2*Math.PI*r;return `<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" role="img" aria-label="${p}% ${label||''}"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#EDF2FE" stroke-width="8"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*p/100} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" font-size="13" font-weight="700" fill="#111A2B">${p}%</text></svg>`}
const bedStack=b=>`<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px">${[['occ','var(--navy)'],['res','var(--blue)'],['av','var(--green)'],['mn','var(--amber)'],['ina','#C5CDDA']].map(([k,c])=>b[k]?`<i style="flex:${b[k]};background:${c}"></i>`:'').join('')}</div>`;
const fab=(label,o)=>`<button class="fab" style="bottom:${o.nav===false?20:86}px"${at(o)}>${ic('plus')}${label}</button>`;
function propChip(){if(DB.props.length<2)return '';return `<button class="chip" style="height:32px;font-size:13px;color:var(--ink);${ST.prop!=='all'?'border-color:var(--blue)':''}" data-act="sheet" data-p="s:propSwitch">${ST.prop==='all'?ic('layers','sm'):`<span style="width:8px;height:8px;border-radius:50%;background:var(--blue)"></span>`}${scopeName()}${ic('down','sm')}</button>`}

// ---------- page frame ----------
function page(o){
  const c=cur(),m=S[c.id],role=ST.role,isRoot=ST.stack.length===1&&!!m.tab;
  let body=o.body; const mode=ST.mode, mo=role!=='auth'&&mode!=='normal'&&!o.noMode;
  if(mo) body=modeBody(mode,m,o);
  const nav=(o.nav!==false&&isRoot&&TABS[role])?navBar(role,m.tab):'';
  const backB=(!isRoot&&o.back!==false&&ST.stack.length>1)?`<button class="ib" data-back aria-label="Back">${ic('back')}</button>`:(o.close?`<button class="ib" data-back aria-label="Close">${ic('x')}</button>`:'');
  const head=o.bar!==undefined?o.bar:`<div class="ab">${backB}<div style="flex:1;min-width:0">${o.pre||''}<h1>${o.title??m.t}</h1>${o.sub?`<div class="sub">${o.sub}</div>`:''}${o.chip?`<div style="margin-top:4px">${propChip()}</div>`:''}</div>${o.right||''}</div>`;
  const off=mode==='offline'&&role!=='auth'?`<div class="offbar">${ic('wifioff','sm')}Offline · showing data saved at 9:12 AM</div>`:'';
  return `<div class="sb ${o.dark?'dk':''}"><span>9:41</span><span>5G ▮▮▮ 82%</span></div>${off}<div class="scr" id="scr">${head}<div class="pg ${o.cls||''}" style="${o.style||''}">${body}</div></div>${o.fab&&!mo?fab(o.fab[0],{...o.fab[1],nav:nav?true:false}):''}${o.foot&&!mo?`<div class="foot">${o.foot}</div>`:''}${nav}`;
}
function navBar(role,active){const cnt={rNotices:DB.notices.filter(n=>(n.propId==='p1'||n.propId==='all')&&!n.read&&n.state==='Sent').length,rComplaints:0};
  return `<nav class="bn">${TABS[role].map(([id,icn,l])=>`<button class="${active===id?'on':''}" data-tab="${id}">${ic(icn)}${l}${cnt[id]?`<span class="cnt">${cnt[id]}</span>`:''}</button>`).join('')}</nav>`}
function modeBody(mode,m,o){
  if(mode==='offline') return o.body;
  if(mode==='loading') return `<div class="skel" style="height:110px;border-radius:14px"></div><div class="g2"><div class="skel" style="height:72px"></div><div class="skel" style="height:72px"></div></div>${[1,2,3,4].map(()=>`<div class="card row"><div class="skel" style="width:38px;height:38px;border-radius:50%"></div><div style="flex:1;display:grid;gap:6px"><div class="skel" style="height:11px;width:60%"></div><div class="skel" style="height:9px;width:40%"></div></div></div>`).join('')}`;
  if(mode==='empty') return emptyB(m.empty||{icon:'list',title:'Nothing here yet',msg:'Records will appear here as soon as they are added.'});
  if(mode==='error') return emptyB({icon:'alert',bg:'var(--red-50)',fg:'var(--red)',title:'Couldn’t load this page',msg:'The server didn’t respond. Your data is safe. Check your connection and try again.',cta:'Try again',act:'mode',p:{m:'normal'}});
  if(mode==='denied') return emptyB({icon:'lock',bg:'var(--slate-50)',fg:'var(--ink-2)',title:'You don’t have access',msg:ST.role==='owner'?'Your staff role (Manager · Royal PG) can’t open this page. Ask the owner, Deven Patel, to grant access.':'This page isn’t available for your account.',cta:'Request access',act:'toast',p:{m:'Access request sent to Deven Patel'}});
  if(mode==='noresults') return `<div class="inp">${ic('search','sm mut2')}<input value="Pratik Sonawane" aria-label="Search" readonly></div>`+emptyB({icon:'search',bg:'var(--slate-50)',fg:'var(--ink-2)',title:'No results for “Pratik Sonawane”',msg:'Check the spelling, or search by room number or mobile number.',cta:'Clear search',act:'mode',p:{m:'normal'}});
  return o.body;
}

// ---------- render ----------
let lastId=null;
function render(top){
  const el=document.getElementById('phone'), c=cur(), m=S[c.id];
  if(!m){console.warn('Missing screen',c.id);return}
  const ae=document.activeElement, aid=ae&&ae.id&&el.contains(ae)?ae.id:null, selS=aid&&ae.selectionStart;
  const oldScr=document.getElementById('scr'), st=oldScr?oldScr.scrollTop:0;
  let html; try{html=m.v(c.p||{})}catch(e){console.error(e);html=page({title:m.t,body:`<div class="banner err">${ic('alert')}<div>Render error: ${esc(e.message)}</div></div>`})}
  let ov='';
  if(ST.sheet&&SH[ST.sheet]) ov+=`<div class="scrim" data-close></div><div class="sheet" role="dialog"><div class="grab"></div>${SH[ST.sheet](ST.sheetP)}</div>`;
  if(ST.dialog){const d=ST.dialog;ov+=`<div class="scrim" data-close></div><div class="dialog" role="alertdialog">${d.icon?`<div class="tile" style="background:${d.danger?'var(--red-50)':'var(--blue-50)'};color:${d.danger?'var(--red)':'var(--blue)'}">${ic(d.icon)}</div>`:''}<b class="t-l">${d.title}</b><div class="mut">${d.msg}</div><div class="row">${btn(d.cancel||'Cancel',{k:'s',close:true})}${btn(d.ok,{k:d.danger?'d':'p',act:d.act,p:d.p})}</div></div>`}
  el.innerHTML=html+ov;
  const ns=document.getElementById('scr'); if(ns) ns.scrollTop=(top||lastId!==c.id)?0:st;
  lastId=c.id;
  if(aid){const n=document.getElementById(aid);if(n){n.focus();try{if(selS!=null)n.setSelectionRange(selS,selS)}catch(e){}}}
  if(m.after) m.after(c.p||{});
  panel();
}
let tT;
function toast(msg,kind){const d=document.getElementById('device');let t=d.querySelector('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast '+(kind==='err'?'err':'');t.setAttribute('role','status');t.innerHTML=`${ic(kind==='err'?'alert':'check')}<span>${msg}</span>`;d.appendChild(t);clearTimeout(tT);tT=setTimeout(()=>t.remove(),2600)}

// ---------- validation ----------
function validate(ids){let bad=0;ids.forEach(id=>{const e=document.getElementById(id);if(!e)return;let v=ST.f[id]??(e.value!==undefined?e.value:'');const req=e.hasAttribute('data-req'),pat=e.getAttribute('data-pat'),min=e.getAttribute('data-min');
  let msg=null; if(Array.isArray(v))v=v.length?v:''; if(req&&(v===''||v==null||v===false))msg=e.getAttribute('data-msg')||'This field is required';
  else if(v&&pat&&!new RegExp('^'+pat+'$').test(String(v).replace(/\s/g,'')))msg=e.getAttribute('data-msg');
  else if(v&&min&&String(v).trim().length<+min)msg=`Please write at least ${min} characters`;
  if(msg){ST.err[id]=msg;bad++}else delete ST.err[id]});
  if(bad){render();toast(bad===1?'Please fix the highlighted field':`Please fix ${bad} highlighted fields`,'err');return false}return true}

// ---------- generic actions ----------
A.ui=p=>{ST.ui[p.k]=p.v;render()};
A.pick=p=>{ST.f[p.id]=p.v;delete ST.err[p.id];render()};
A.pickm=p=>{const a=[...(ST.f[p.id]||[])];const i=a.indexOf(p.v);i>=0?a.splice(i,1):a.push(p.v);ST.f[p.id]=a;delete ST.err[p.id];render()};
A.tog=p=>{ST.f[p.id]=!F(p.id,document.querySelector(`[data-p="id:${p.id}"]`)?.classList.contains('on'));render()};
A.upl=p=>{ST.f[p.id]=p.n;delete ST.err[p.id];render();toast('File attached')};
A.sheet=p=>sheet(p.s,p);
A.close=()=>{closeOv();render()};
A.toast=p=>{closeOv();render();toast(p.m)};
A.mode=p=>{ST.mode=p.m;render()};
A.setProp=p=>{ST.prop=p.id;closeOv();const was=ST.mode;ST.mode='loading';render();setTimeout(()=>{ST.mode=was==='loading'?'normal':was;render();toast(p.id==='all'?'Showing all properties':'Showing '+PR(p.id).name)},450)};
A.logout=()=>{setRole('auth','mobile');toast('Logged out')};

SH.propSwitch=()=>`<div class="between"><b class="t-l">Switch property</b><button class="ib" data-close aria-label="Close">${ic('x')}</button></div>
 <div class="t-s mut">Everything in the app — residents, rent, expenses, reports — follows this choice.</div>
 ${list([li({lead:`<div class="tile" style="background:var(--navy);color:#fff">${ic('layers')}</div>`,title:'All Properties',sub:`${DB.props.length} properties · ${DB.beds.length} beds · consolidated`,right:ST.prop==='all'?ic('check','c-blue'):'',act:'setProp',p:{id:'all'},chev:false,style:ST.prop==='all'?'background:var(--blue-50)':''}),
 ...DB.props.map(P=>{const b=DB.beds.filter(x=>x.propId===P.id);return li({lead:propTile(P),title:P.name,sub:`${P.city} · ${P.gender} · ${pct(b.filter(x=>x.status==='Occupied').length,b.length)}% occupied`,right:ST.prop===P.id?ic('check','c-blue'):'',act:'setProp',p:{id:P.id},chev:false,style:ST.prop===P.id?'background:var(--blue-50)':''})})])}
 ${btn('Add property',{k:'s',icon:'plus',go:'propForm'})}`;

// ---------- events ----------
function parseP(s){const o={};if(!s)return o;s.split(/,(?=[a-zA-Z0-9_]+:)/).forEach(x=>{const i=x.indexOf(':');if(i>0)o[x.slice(0,i)]=x.slice(i+1)});return o}
function onAct(el){
  const p=parseP(el.dataset.p);
  if(el.hasAttribute('data-back'))return back();
  if(el.dataset.tab)return tab(el.dataset.tab);
  if(el.dataset.go)return go(el.dataset.go,p);
  if(el.hasAttribute('data-close')){closeOv();return render()}
  if(el.dataset.act){const f=A[el.dataset.act];if(f)f(p,el);else toast('Action: '+el.dataset.act)}
}
function boot(){
  const ph=document.getElementById('phone');
  ph.addEventListener('click',e=>{const el=e.target.closest('[data-go],[data-back],[data-tab],[data-act],[data-close]');if(!el||!ph.contains(el))return;e.preventDefault();onAct(el)});
  ph.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button],[role=checkbox]')){e.preventDefault();onAct(e.target)}});
  const upd=e=>{const t=e.target;if(!t.id)return;ST.f[t.id]=t.value;if(ST.err[t.id]){delete ST.err[t.id];const box=t.closest('.inp');box&&box.classList.remove('err');const h=box&&box.parentElement.querySelector('.help.err');h&&h.remove()}if(t.hasAttribute('data-live'))render()};
  ph.addEventListener('input',e=>{if(e.target.tagName!=='SELECT')upd(e)});
  ph.addEventListener('change',e=>{if(e.target.tagName==='SELECT')upd(e)});
  document.getElementById('roles').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const r=b.dataset.role;setRole(r,r==='auth'?'splash':undefined)});
  document.getElementById('idxq').addEventListener('input',()=>panel(true));
  document.getElementById('idx').addEventListener('click',e=>{const b=e.target.closest('button[data-s]');if(b)openScreen(b.dataset.s)});
  document.getElementById('info').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mode){ST.mode=b.dataset.mode;render()}if(b.dataset.reset!==undefined){DB=buildDB();ST.ui={};ST.f={};ST.err={};ST.prop='all';render(true);toast('Demo data reset')}});
  setRole('owner');
}
function openScreen(id){const m=S[id];ST.role=m.r;ST.mode='normal';closeOv();
  if(m.r==='auth'){ST.stack=[{id,p:m.dp||{}}]}
  else{const root=m.tab||HOME[m.r];ST.stack=[{id:root,p:{}}];if(id!==root)ST.stack.push({id,p:{...(m.dp||{})}})}
  if(m.pre)m.pre();
  render(true);if(innerWidth<780)document.getElementById('device').scrollIntoView({behavior:'smooth',block:'start'})}

// ---------- side panels ----------
let idxBuilt=false;
function panel(rebuild){
  const c=cur(),m=S[c.id];
  document.querySelectorAll('#roles button').forEach(b=>b.classList.toggle('on',b.dataset.role===ST.role));
  const q=(document.getElementById('idxq').value||'').toLowerCase();
  const groups={};ORDER.forEach(id=>{const s=S[id];if(s.hide)return;if(q&&!(s.t+' '+s.m).toLowerCase().includes(q))return;const g=ROLE_NAME[s.r]+' · '+s.m;(groups[g]=groups[g]||[]).push(s)});
  const idx=document.getElementById('idx');
  const roleOrder=['owner','res','admin','auth'];
  const keys=Object.keys(groups).sort((a,b)=>{const ra=roleOrder.indexOf(groups[a][0].r),rb=roleOrder.indexOf(groups[b][0].r);return ra-rb});
  const total=ORDER.filter(id=>!S[id].hide).length;
  idx.innerHTML=`<div class="t-xs" style="color:var(--muted);padding:2px 8px">${total} screens · tap any to open it</div>`+keys.map(g=>`<h5><span>${g}</span><span>${groups[g].length}</span></h5>${groups[g].map(s=>`<button data-s="${s.id}" class="${s.id===c.id?'on':''}">${s.t}<i>${s.code||''}</i></button>`).join('')}`).join('')||'<p style="padding:8px;color:var(--muted)">No screen matches.</p>';
  if(!rebuild){const on=idx.querySelector('button.on');if(on){const r=on.getBoundingClientRect(),ir=idx.getBoundingClientRect();if(r.top<ir.top||r.bottom>ir.bottom)on.scrollIntoView({block:'nearest'})}}
  const path=ST.stack.map(s=>S[s.id].t);
  document.getElementById('crumbs').innerHTML=`<span>${ROLE_NAME[ST.role]}${ST.role==='owner'?' · '+scopeName():''}</span><span>›</span>`+path.map((t,i)=>i===path.length-1?`<b>${t}</b>`:`<span>${t}</span><span>›</span>`).join('');
  const modes=[['normal','Normal'],['loading','Loading'],['empty','Empty'],['error','Error'],['offline','No internet'],['denied','Permission denied'],['noresults','No search results']];
  document.getElementById('info').innerHTML=`<div class="mod">${ROLE_NAME[m.r]} · ${m.m}</div><h2>${m.t}</h2><p>${m.d||''}</p>
   ${m.try?`<h4>Try this</h4><ul>${m.try.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
   ${m.r!=='auth'?`<h4>Preview other states of this screen</h4><div class="states">${modes.map(([k,l])=>`<button data-mode="${k}" class="${ST.mode===k?'on':''}">${l}</button>`).join('')}</div><p style="font-size:12px">Form validation, success and confirmation states are shown by using the forms and buttons inside the phone.</p>`:''}
   ${m.data?`<h4>Data &amp; rules</h4><p style="font-size:12.5px">${m.data}</p>`:''}
   <h4>Bed status colours</h4><div class="legend"><span><i style="background:var(--navy)"></i>Occupied</span><span><i style="background:var(--blue)"></i>Reserved</span><span><i style="background:var(--green)"></i>Available</span><span><i style="background:var(--amber)"></i>Maintenance</span><span><i style="background:#C5CDDA"></i>Inactive</span></div>
   <button class="reset" data-reset>Reset demo data</button>`;
}

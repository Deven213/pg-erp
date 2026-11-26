// ---------- AUTH & ONBOARDING ----------
const AM='Authentication & onboarding';
def('splash',{t:'Splash',m:AM,r:'auth',code:'A-01',d:'First thing the user sees. Checks for a saved session: valid session goes straight to that role’s Home, otherwise to language selection.',try:['Wait a second — it moves on by itself, or tap anywhere.'],
 v:()=>page({bar:'',dark:true,noMode:true,body:`<div data-go="lang" style="min-height:690px;margin:0 -16px -24px;background:var(--navy);color:#fff;display:grid;place-content:center;justify-items:center;gap:12px;text-align:center"><div style="width:84px;height:84px;border-radius:24px;background:#fff;color:var(--navy);display:grid;place-items:center">${ic('bed','xl')}</div><div style="font-size:28px;font-weight:700">PG ERP</div><div style="color:#B9C6E4">Run your PG from your phone</div><div style="margin-top:120px;color:#8EA0C8;font-size:11px">v1.0 · Made for Indian PGs</div></div>`}),
 after:()=>{clearTimeout(window._sp);window._sp=setTimeout(()=>{if(cur().id==='splash')rep('lang')},1600)}});

def('lang',{t:'Choose language',m:AM,r:'auth',code:'A-02',d:'Language is chosen once on first launch and can be changed later from Settings. All text comes from translation files; layouts allow for longer Hindi and Gujarati text.',try:['Pick हिन्दी or ગુજરાતી to see the selection change, then Continue.'],
 v:()=>{const v=F('lang','en');return page({bar:'',noMode:true,style:'padding-top:40px',body:`<div class="tile" style="width:48px;height:48px;background:var(--blue-50);color:var(--blue)">${ic('globe','lg')}</div><div><div class="t-xl w7">${v==='hi'?'अपनी भाषा चुनें':v==='gu'?'તમારી ભાષા પસંદ કરો':'Choose your language'}</div><div class="mut">You can change this later in Settings.</div></div>
 ${list([['en','English','English'],['hi','<span class="ind">हिन्दी</span>','Hindi'],['gu','<span class="guj">ગુજરાતી</span>','Gujarati']].map(([k,t,s])=>li({title:t,sub:s,right:`<span class="radio ${v===k?'on':''}"></span>`,act:'pick',p:{id:'lang',v:k}})))}`,foot:btn(v==='hi'?'आगे बढ़ें':v==='gu'?'આગળ વધો':'Continue',{go:'welcome'})})}});

def('welcome',{t:'Welcome',m:AM,r:'auth',code:'A-03',d:'Asks how the person will use the app. This only changes the wording on the next screens; the real role is decided by the server after OTP, so a resident can never make themselves an owner.',try:['Choose “I stay in a PG” to follow the resident login journey.'],
 v:()=>{const v=F('intent','owner');return page({bar:'',noMode:true,style:'padding-top:20px',body:`${illus(null,150)}<div><div class="t-xl w7">Welcome to PG ERP</div><div class="mut">How will you use the app?</div></div>
 ${card(`<div class="row">${`<div class="tile" style="background:var(--navy);color:#fff">${ic('bldg')}</div>`}<div style="flex:1"><div class="w7">I own or manage a PG</div><div class="t-s mut">Properties, residents, rent, staff, reports</div></div><span class="radio ${v==='owner'?'on':''}"></span></div>`,'',{act:'pick',p:{id:'intent',v:'owner'},style:v==='owner'?'border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-50)':''})}
 ${card(`<div class="row"><div class="tile" style="background:var(--blue-50);color:var(--blue)">${ic('bed')}</div><div style="flex:1"><div class="w7">I stay in a PG</div><div class="t-s mut">Pay rent, raise complaints, see notices</div></div><span class="radio ${v==='res'?'on':''}"></span></div>`,'',{act:'pick',p:{id:'intent',v:'res'},style:v==='res'?'border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-50)':''})}
 <div class="t-s mut" style="text-align:center">Residents can only join through an invite from their PG.</div>`,foot:btn('Continue with mobile number',{go:'mobile'})})}});

def('mobile',{t:'Mobile number',m:AM,r:'auth',code:'A-04',d:'Mobile number with +91 is the main login for everyone. Owners can log in or register here; residents can only log in if their PG has already added them.',try:['Tap “Get OTP” with the box empty to see validation.','Type a number starting with 5 to see the format error.','Switch to “Register” to start the owner onboarding journey.'],data:'Valid Indian mobile: 10 digits starting 6–9. Terms consent is required.',
 v:()=>{const own=F('intent','owner')==='owner',mode=U('authMode','login');return page({title:'',noMode:true,body:`
 ${own?seg('authMode',[['login','Log in'],['reg','Register new PG']],'login'):''}
 <div><div class="t-xl w7">${own&&mode==='reg'?'Create your owner account':'Enter your mobile number'}</div><div class="mut">We’ll send a 6-digit OTP by SMS${own?'':'. Use the number your PG manager registered'}.</div></div>
 ${inp('mob',{l:'Mobile number',pre:'🇮🇳 +91',ph:'98250 41736',im:'numeric',max:11,req:true,pat:'[6-9][0-9]{9}',msg:'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9'})}
 <div class="row t-s" style="align-items:flex-start">${cbx('terms',true)}<span class="mut" id="termsT">I agree to the <span class="c-blue w6">Terms of Use</span> and <span class="c-blue w6">Privacy Policy</span>, and allow SMS/WhatsApp messages about my account.</span></div>
 ${own&&mode==='login'?`<div class="t-s mut" style="text-align:center">Prefer a password? <span class="lnk" data-go="pwLogin">Log in with password</span></div>`:''}`,
 foot:btn('Get OTP',{act:'sendOtp'})})}});
A.sendOtp=()=>{if(!validate(['mob']))return;if(!F('terms',true)){toast('Please accept the Terms to continue','err');return}go('otp')};

def('otp',{t:'OTP verification',m:AM,r:'auth',code:'A-05',d:'Verifies the phone number. Android auto-reads the SMS. After 3 wrong attempts OTP login pauses for 10 minutes (enforced on the server). WhatsApp OTP is offered as a fallback.',try:['Type any 6 digits to continue.','Type 000000 to see the wrong-code error state.'],
 v:()=>{const e=U('otpErr',0),mob=F('mob','9825041736').replace(/\s/g,'');return page({title:'',noMode:true,body:`<div><div class="t-xl w7">Verify your number</div><div class="mut">Code sent to <b class="num">+91 ${mob.slice(0,5)} ${mob.slice(5)}</b> <span class="lnk" data-back>Edit</span></div></div>
 <div class="otp ${e?'e':''}" id="otpbox">${[0,1,2,3,4,5].map(i=>`<input id="o${i}" inputmode="numeric" maxlength="1" aria-label="Digit ${i+1}" value="${esc(F('o'+i,''))}">`).join('')}</div>
 ${e?`<div class="help err" style="font-size:12px">${ic('alert','sm')}That code is incorrect. ${3-e} attempt${3-e===1?'':'s'} left.</div>`:''}
 <div class="between t-s"><span class="mut">${ic('phone','sm')} Auto-reading SMS…</span><span class="mut">Resend in <b class="num">0:24</b></span></div>
 ${e?banner('warn','lock','After 3 wrong attempts, OTP login is paused for 10 minutes to protect your account.'):''}
 <div class="t-s mut" style="text-align:center">Didn’t get it? <span class="lnk" style="color:#1DA851" data-act="toast" data-p="m:OTP sent on WhatsApp to your number">Get OTP on WhatsApp</span></div>
 ${banner('info','help','Demo: any 6 digits work. Enter 000000 to see the error state.')}`,foot:btn('Verify',{act:'verifyOtp'})})},
 after:()=>{const ins=[...document.querySelectorAll('#otpbox input')];ins.forEach((x,i)=>{x.addEventListener('input',()=>{x.value=x.value.replace(/\D/g,'').slice(-1);ST.f['o'+i]=x.value;if(x.value&&ins[i+1])ins[i+1].focus();if(ins.every(y=>y.value))A.verifyOtp()});x.addEventListener('keydown',ev=>{if(ev.key==='Backspace'&&!x.value&&ins[i-1])ins[i-1].focus()})});const f=ins.find(x=>!x.value);if(f&&!document.activeElement.closest('#otpbox'))f.focus()}});
A.verifyOtp=()=>{const code=[0,1,2,3,4,5].map(i=>F('o'+i,'')).join('');if(code.length<6){toast('Enter all 6 digits','err');return}
  [0,1,2,3,4,5].forEach(i=>delete ST.f['o'+i]);
  if(code==='000000'){ST.ui.otpErr=Math.min(2,U('otpErr',0)+1);render();return}
  ST.ui.otpErr=0;
  if(F('intent','owner')==='res'){if(U('fromInvite',0)){ST.ui.fromInvite=0;setRole('res');toast('Account activated · Welcome, Rohan');return}go('accountPick');return}
  if(U('authMode','login')==='reg'){go('regProfile');return}
  setRole('owner');toast('Welcome back, Deven')};

def('pwLogin',{t:'Password login',m:AM,r:'auth',code:'A-06',d:'Optional for owners who set a password during setup — useful when SMS is slow. Residents always use OTP.',try:['Tap “Log in” with an empty password to see validation.','Tap “Forgot password?” for the reset flow.'],
 v:()=>page({title:'Log in with password',noMode:true,body:`${inp('mob',{l:'Mobile number',pre:'+91',ph:'98250 41736',im:'numeric',req:true,pat:'[6-9][0-9]{9}',msg:'Enter a valid 10-digit mobile number'})}
 ${inp('pw',{l:'Password',type:'password',ph:'Your password',req:true,msg:'Enter your password'})}<div class="t-s" style="text-align:right"><span class="lnk" data-go="forgotPw">Forgot password?</span></div>`,foot:btn('Log in',{act:'pwIn'})})});
A.pwIn=()=>{if(!validate(['mob','pw']))return;setRole('owner');toast('Welcome back, Deven')};

def('forgotPw',{t:'Reset password',m:AM,r:'auth',code:'A-07',d:'Password reset always starts with OTP to the registered mobile. Saving a new password signs the account out of all other devices.',try:['Type a short password to see the strength rules update.','Make the two passwords different to see the mismatch error.'],
 v:()=>{const pw=F('npw','');const rules=[[pw.length>=8,'At least 8 characters'],[/\d/.test(pw),'One number'],[/[^A-Za-z0-9]/.test(pw),'One symbol (! @ # ₹)']];const sc=rules.filter(r=>r[0]).length;
 return page({title:'Reset password',noMode:true,body:`${banner('ok','check','Mobile +91 98250 41736 verified with OTP')}
 ${inp('npw',{l:'New password',type:'password',ph:'Create a password',live:true,req:true,msg:'Create a new password'})}
 <div class="stack" style="gap:5px">${bar([[sc*33.4,sc<2?'var(--red)':sc<3?'var(--amber)':'var(--green)']])}<div class="t-s w6 ${sc<2?'c-err':sc<3?'c-warn':'c-ok'}">${['Too weak','Weak','Medium','Strong'][sc]}</div></div>
 <div class="t-s stack" style="gap:4px">${rules.map(([ok,t])=>`<div class="row ${ok?'c-ok':'mut2'}" style="gap:6px">${ic(ok?'check':'x','sm')}${t}</div>`).join('')}</div>
 ${inp('npw2',{l:'Confirm password',type:'password',ph:'Type it again',req:true,msg:'Confirm your password'})}`,foot:btn('Save password',{act:'savePw'})})}});
A.savePw=()=>{if(!validate(['npw','npw2']))return;if(F('npw')!==F('npw2')){ST.err.npw2='Passwords don’t match';render();return}if(F('npw').length<8){ST.err.npw='Use at least 8 characters';render();return}setRole('owner');toast('Password updated. Other devices signed out.')};

// owner registration
const regSteps=['Profile','Business','Property','Rooms'];
def('regProfile',{t:'Owner profile',m:AM,r:'auth',code:'A-08',d:'Step 1 of owner onboarding. The verified mobile is locked. Email is used for receipts and subscription invoices. A password is optional.',try:['Tap Next without a name to see validation.'],
 v:()=>page({title:'Your profile',sub:'Step 1 of 4',noMode:true,body:`${stepper(regSteps,0)}
 <div class="row">${card(`${ic('cam','lg')}`,'',{style:'width:64px;height:64px;border-radius:50%;display:grid;place-items:center;padding:0;color:var(--blue);background:var(--blue-50)',act:'toast',p:{m:'Camera / gallery picker opens'}})}<div><div class="w6">Add photo</div><div class="t-s mut">Optional</div></div></div>
 ${inp('rName',{l:'Full name',ph:'Deven Patel',req:true,msg:'Enter your full name'})}
 ${inp('rEmail',{l:'Email',ph:'you@example.com',type:'email',pat:'[^@]+@[^@]+\\.[a-z]{2,}',msg:'Enter a valid email address',h:'Receipts and subscription invoices are sent here'})}
 ${inp('rMob',{l:'Mobile',pre:'+91',v:'98250 41736',ro:true,suf:ic('shield','sm c-ok'),h:'Verified'})}
 ${list([togRow('rSetPw','Also set a password','Log in without OTP when SMS is slow',false,'lock')])}`,foot:btn('Next: your business',{act:'reg1'})})});
A.reg1=()=>{if(validate(['rName','rEmail']))go('regBiz')};

def('regBiz',{t:'Create PG business',m:AM,r:'auth',code:'A-09',d:'Step 2. Creates the PG business — the tenant. Every record you add later (properties, residents, money) is tied to this business and isolated from other businesses on the platform.',try:['Skip the business name and tap Next.'],
 v:()=>page({title:'Your PG business',sub:'Step 2 of 4',noMode:true,body:`${stepper(regSteps,1)}
 ${inp('bName',{l:'Business name',ph:'Deven PG Group',req:true,msg:'Enter your business name',h:'Shown on receipts and invoices'})}
 ${pick('bCount',['1','2–5','6–20','20+'],{l:'How many PGs do you run?',req:true,v:'2–5'})}
 ${sel('bCity',['Vadodara','Ahmedabad','Surat','Rajkot','Pune','Bengaluru','Indore','Jaipur','Other'],{l:'Head office city',v:'Vadodara',req:true})}
 ${inp('bGst',{l:'GSTIN (optional)',ph:'24ABCDE1234F1Z5',pat:'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]',msg:'GSTIN format looks wrong (15 characters)'})}
 ${sel('bDue',['1st','5th','7th','10th'],{l:'Rent due day',v:'5th',h:'You can change this per property later'})}`,foot:btn('Next: first property',{act:'reg2'})})});
A.reg2=()=>{if(validate(['bName','bCount','bGst']))go('regProp')};

def('regProp',{t:'Add first property',m:AM,r:'auth',code:'A-10',d:'Step 3. Only the essentials. Amenities, photos, documents and rules are added later from Property details.',try:['Enter a 5-digit PIN code to see the PIN validation.'],
 v:()=>page({title:'First property',sub:'Step 3 of 4',noMode:true,body:`${stepper(regSteps,2)}
 ${inp('fpName',{l:'Property name',ph:'Sunrise Boys PG',req:true,msg:'Enter the property name'})}
 ${pick('fpG',['Boys','Girls','Co-living'],{l:'Who is it for?',req:true})}
 ${inp('fpAddr',{l:'Address',ph:'House no., society, area',req:true,msg:'Enter the address'})}
 <div class="g2">${inp('fpCity',{l:'City',v:'Vadodara',req:true})}${inp('fpPin',{l:'PIN code',ph:'390007',im:'numeric',max:6,req:true,pat:'[1-9][0-9]{5}',msg:'PIN code must be 6 digits'})}</div>
 <div class="map">${ic('pin','lg pin')}<span class="bdg b-mute" style="position:absolute;left:8px;bottom:8px;background:#fff">${ic('pin','sm')}Drag pin to the gate</span></div>
 ${inp('fpPh',{l:'Contact number',pre:'+91',v:'98250 41736'})}`,foot:btn('Next: rooms and beds',{act:'reg3'})})});
A.reg3=()=>{if(validate(['fpName','fpG','fpAddr','fpCity','fpPin']))go('regBeds')};

def('regBeds',{t:'Quick rooms & beds setup',m:AM,r:'auth',code:'A-11',d:'Step 4. Creates Building → Floors → Rooms → Beds in one go so a new owner isn’t typing 45 beds by hand. Every room and bed can be edited later.',try:['Use − and + to change floors and rooms; the preview updates live.'],
 v:()=>{const fl=+F('qbF',3),rp=+F('qbR',5),sh=+F('qbS','3'),beds=fl*rp*sh;return page({title:'Rooms and beds',sub:'Step 4 of 4',noMode:true,body:`${stepper(regSteps,3)}<div class="t-s mut">Set up one building quickly. You can add more buildings and edit each room afterwards.</div>
 ${inp('qbN',{l:'Building name',v:'Block A'})}
 <div class="g2">${[['qbF','Floors',fl],['qbR','Rooms per floor',rp]].map(([k,l,v])=>`<div class="fld"><span class="flab">${l}</span><div class="inp between"><button class="ib" style="width:30px;height:30px" data-act="qb" data-p="k:${k},d:-1" aria-label="Less">−</button><b class="num t-l">${v}</b><button class="ib" style="width:30px;height:30px" data-act="qb" data-p="k:${k},d:1" aria-label="More">+</button></div></div>`).join('')}</div>
 ${pick('qbS',['1','2','3','4','6'],{l:'Beds per room (sharing)',v:'3'})}
 ${inp('qbRent',{l:'Default rent per bed',pre:'₹',v:'7,500',im:'numeric'})}
 ${card(`${lbl('Preview')}<div class="w7 t-l" style="margin-top:3px">${fl} floors · ${fl*rp} rooms · ${beds} beds</div><div class="t-s mut">Rooms A-101 to A-${fl}${String(rp).padStart(2,'0')} · Beds ${'ABCDEF'.slice(0,sh).split('').join(', ')}</div>`,'',{style:'background:var(--blue-50);border-color:#CFDCFB'})}`,
 foot:btn(`Create ${beds} beds`,{go:'regDone'})})}});
A.qb=p=>{const v=+F(p.k,p.k==='qbF'?3:5)+(+p.d);ST.f[p.k]=Math.max(1,Math.min(p.k==='qbF'?20:15,v));render()};

def('regDone',{t:'Setup complete',m:AM,r:'auth',code:'A-12',d:'Success state for onboarding. A short checklist guides the next steps. The 14-day trial starts here.',
 v:()=>page({bar:'',noMode:true,body:`<div class="empty" style="padding-top:60px"><div class="big" style="background:var(--green-50);color:var(--green);border-radius:50%">${ic('check','xl')}</div><div class="t-xl w7">${esc(F('fpName','Sunrise Boys PG'))} is ready</div><div class="mut">1 building · ${F('qbF',3)*F('qbR',5)} rooms · ${F('qbF',3)*F('qbR',5)*F('qbS',3)} beds created. Your 14-day Professional trial has started.</div></div>
 ${list([li({icon:'check',fg:'var(--green)',bg:'var(--green-50)',title:'Property, rooms and beds'}),li({icon:'users',title:'Add your first resident',sub:'Takes about 2 minutes'}),li({icon:'rupee',title:'Connect UPI to collect rent',sub:'Money goes straight to your bank'}),li({icon:'file',title:'Set PG rules & curfew'})])}`,foot:btn('Go to dashboard',{act:'enterOwner'})})});
A.enterOwner=()=>{setRole('owner');toast('Welcome to PG ERP, '+F('rName','Deven').split(' ')[0])};

def('invite',{t:'Resident invitation',m:AM,r:'auth',code:'A-13',d:'Residents never self-register. The owner adds the resident, and the resident gets a WhatsApp/SMS link. The OTP must match the mobile number the owner entered, which links the login to that resident record.',try:['Tap “Verify mobile to activate” to finish activation and land in the Resident app.'],
 v:()=>page({bar:'',noMode:true,style:'padding-top:16px',body:`${card(`<div class="row t-s w7" style="color:#1DA851">${ic('whats','sm')}WhatsApp · Sunrise Boys PG</div><div class="t-s" style="margin-top:6px">Hi Rohan, you’ve been added to <b>Sunrise Boys PG</b>, Room A-201, Bed B. Activate your resident account: <span class="c-blue">pgerp.in/i/7KQ2</span></div>`,'',{style:'background:#E7F7EC;border-color:#CBEBD5'})}
 <div class="t-xs mut2" style="text-align:center">Opening the link launches the app ↓</div>${illus(PR('p1'),110)}
 <div><div class="t-xl w7">You’re invited</div><div class="mut">Sunrise Boys PG · Alkapuri, Vadodara</div></div>
 ${card(kv([['Room / Bed','A-201 · Bed B'],['Check-in','1 Jul 2025'],['Monthly rent','₹8,000'],['Registered mobile','+91 ••••• •2207']]))}
 ${banner('info','shield','If the number is wrong, ask your PG manager to update it. You can’t change it here.')}`,foot:btn('Verify mobile to activate',{act:'invGo'})})});
A.invGo=()=>{ST.f.intent='res';ST.ui.fromInvite=1;ST.f.mob='9876512207';go('otp')};

def('accountPick',{t:'Choose account',m:AM,r:'auth',code:'A-14',d:'Shown only when one mobile number is linked to more than one permitted account (for example a resident who is also staff at another PG). Each account opens its own app with its own permissions.',try:['Pick the Resident account and Continue.'],
 v:()=>{const v=F('acct','res');const opt=(k,icon,bg,fg,t,s,b,dis)=>card(`<div class="row"><div class="tile" style="background:${bg};color:${fg}">${ic(icon)}</div><div style="flex:1"><div class="w7">${t}</div><div class="t-s mut">${s}</div></div>${b}</div>`,'',{act:dis?'toast':'pick',p:dis?{m:'Past stays are view-only. Contact Krishna PG for old receipts.'}:{id:'acct',v:k},style:(v===k?'border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-50);':'')+(dis?'opacity:.6':'')});
 return page({bar:'',noMode:true,style:'padding-top:36px',body:`<div><div class="t-xl w7">Choose an account</div><div class="mut">+91 98765 12207 is linked to more than one account.</div></div>
 ${opt('res','bed','var(--blue-50)','var(--blue)','Resident · Sunrise Boys PG','A-201, Bed B · Vadodara',bdg('Active','ok'))}
 ${opt('staff','badge','var(--navy)','#fff','Staff · Green Valley PG','Night warden · Ahmedabad',bdg('Staff','mute'))}
 ${opt('old','bed','var(--slate-50)','var(--ink-3)','Resident · Krishna PG','Checked out 30 Jun 2025 · view only','',true)}
 <div class="t-s mut" style="text-align:center">You can switch accounts later from Profile.</div>`,foot:btn('Continue',{act:'acctGo'})})}});
A.acctGo=()=>{if(F('acct','res')==='staff'){toast('Staff accounts open the Owner app with limited access');setRole('owner');return}setRole('res');toast('Welcome back, Rohan')};

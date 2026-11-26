// Sample data for Deven PG Group. Demo "today" is 2 Dec 2026.
const TODAY = '2 Dec 2026';
function mkRng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const POOL={
  boy:['Aarav','Kunal','Harsh','Yash','Parth','Dhruv','Vivek','Nikhil','Rahul','Amit','Karan','Jay','Meet','Siddharth','Aditya','Pranav','Mihir','Tushar','Varun','Sahil','Ankit','Deep','Ritesh','Manav','Arjun','Hardik','Chirag','Om','Raj','Keval'],
  girl:['Sneha','Priya','Riya','Khushi','Ananya','Pooja','Nidhi','Krupa','Isha','Diya','Mansi','Aditi','Shruti','Komal','Janvi','Neha','Tanvi','Hetal','Bhumi','Payal','Dhruvi','Kavya','Nisha','Zeel'],
  last:['Sharma','Patel','Mehta','Shah','Joshi','Desai','Trivedi','Pandya','Verma','Gupta','Iyer','Nair','Reddy','Singh','Chauhan','Rathod','Bhatt','Kapoor','Agarwal','Jain','Soni','Mishra','Yadav','Parekh'],
  org:['MSU Baroda','Parul University','L&T Technology Services','TCS','Infosys','Nirma University','GTU','Amazon','Deloitte','SVNIT Surat','VNSGU','Adani Group','Ahmedabad University','Bank of Baroda','Torrent Pharma','HDFC Bank','CEPT University','Accenture'],
  town:['Indore','Jaipur','Udaipur','Patna','Rajkot','Bhopal','Nagpur','Jodhpur','Kota','Bhavnagar','Junagadh','Ujjain','Lucknow','Nashik','Ranchi','Jamnagar'],
  rel:['Father','Mother','Brother','Uncle']
};
const PCONF=[
 {id:'p1',name:'Sunrise Boys PG',short:'Sunrise',code:'SB',city:'Vadodara',state:'Gujarat',pin:'390007',area:'Alkapuri',addr:'14, Shreeji Society, Alkapuri',gender:'Boys',ptype:'PG',occ:.9,phone:'+91 98250 41736',email:'sunrise@devenpg.in',bg:'#DCE7FA',fg:'#0F2A5C',mess:true,curfew:'10:30 PM',base:0,
  amen:['Wi-Fi','AC rooms','RO water','Washing machine','Power backup','CCTV','Meals','Housekeeping','Geyser','Parking (2-wheeler)'],
  blds:[{code:'A',name:'Block A',floors:3,pat:[3,3,2,4,3]},{code:'B',name:'Block B',floors:2,pat:[3,3,2,4,3]}],
  desc:'Boys PG 5 minutes from MSU Faculty of Technology. Veg meals, high-speed Wi-Fi and daily housekeeping.'},
 {id:'p2',name:'Royal PG',short:'Royal',code:'RP',city:'Ahmedabad',state:'Gujarat',pin:'380009',area:'Navrangpura',addr:'B-7, Shivalik Complex, Navrangpura',gender:'Co-living',ptype:'Co-living',occ:.76,phone:'+91 99099 23415',email:'royal@devenpg.in',bg:'#FDE7E7',fg:'#9B1C1C',mess:false,curfew:'11:00 PM',base:500,
  amen:['Wi-Fi','AC rooms','Gym','Lift','Power backup','CCTV','Housekeeping','Common kitchen','Biometric entry'],
  blds:[{code:'T1',name:'Tower 1',floors:4,pat:[2,2,3,1]},{code:'T2',name:'Tower 2',floors:3,pat:[2,2,3,1]}],
  desc:'Premium co-living for working professionals near CG Road. Separate floors for men and women.'},
 {id:'p3',name:'Krishna PG',short:'Krishna',code:'KP',city:'Surat',state:'Gujarat',pin:'395007',area:'Vesu',addr:'21, Raghuvir Residency, Vesu',gender:'Girls',ptype:'PG',occ:.72,phone:'+91 97277 61820',email:'krishna@devenpg.in',bg:'#FFF1D6',fg:'#8A5300',mess:true,curfew:'9:30 PM',base:-500,
  amen:['Wi-Fi','RO water','Meals','CCTV','Lady warden','Washing machine','Power backup','Housekeeping'],
  blds:[{code:'K',name:'Main Building',floors:3,pat:[3,2,3,2,4]}],
  desc:'Safe girls PG near SVNIT and VNSGU with lady warden, CCTV and home-style Gujarati meals.'}
];
const RENT={1:12000,2:9500,3:8000,4:6500};
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildDB(){
  const r=mkRng(20261202), pick=a=>a[Math.floor(r()*a.length)], rnd=(a,b)=>a+Math.floor(r()*(b-a+1));
  const mob=()=>`+91 ${pick(['98','97','99','90','88','70','63','82'])}${rnd(100,999)} ${rnd(10000,99999)}`;
  const D={props:[],blds:[],rooms:[],beds:[],res:[],inv:[],pay:[],resv:[],wait:[],exp:[],comp:[],staff:[],notices:[],notifs:[],visitors:[],hist:[],me:null};
  PCONF.forEach(c=>{
    const P={...c,status:'Active',amen:[...c.amen]}; D.props.push(P);
    c.blds.forEach((b,bi)=>{
      const B={id:P.id+'b'+bi,propId:P.id,code:b.code,name:b.name,floors:b.floors}; D.blds.push(B);
      for(let f=1;f<=b.floors;f++) b.pat.forEach((sh,ri)=>{
        const no=`${b.code}-${f}${String(ri+1).padStart(2,'0')}`, ac=f>=2||sh===1;
        const R={id:'rm'+D.rooms.length,propId:P.id,bldId:B.id,floor:f,no,share:sh,ac,bath:sh<=2?'Attached':'Common',rent:RENT[sh]+P.base-(ac?0:1000),status:'Active',type:sh===1?'Single':sh+' sharing',meterPrev:rnd(4200,9800)};
        R.meterCur=R.meterPrev+rnd(140,420); D.rooms.push(R);
        for(let k=0;k<sh;k++){const x=r();const st=x<P.occ?'Occupied':x<P.occ+.05?'Reserved':x<P.occ+.08?'Maintenance':'Available';
          D.beds.push({id:'bd'+D.beds.length,roomId:R.id,propId:P.id,bldId:B.id,label:'ABCD'[k],status:st});}
      });
    });
  });
  const roomBy=no=>D.rooms.find(x=>x.no===no&&x.propId==='p1');
  const bedAt=(no,l)=>D.beds.find(b=>b.roomId===roomBy(no).id&&b.label===l);
  bedAt('A-201','B').status='Occupied'; bedAt('B-104','A').status='Occupied'; bedAt('A-101','C').status='Available';
  const inactive=D.beds.find(b=>b.propId==='p2'&&b.status==='Available'); if(inactive) inactive.status='Inactive';

  let n=1, ivn=1041, pn=8801;
  D.beds.filter(b=>b.status==='Occupied').forEach(b=>{
    const P=D.props.find(p=>p.id===b.propId), R=D.rooms.find(x=>x.id===b.roomId);
    const g=P.gender==='Boys'?'M':P.gender==='Girls'?'F':(R.floor%2?'M':'F');
    const first=pick(g==='M'?POOL.boy:POOL.girl), last=pick(POOL.last), mo=rnd(1,22);
    const jd=new Date(2026,11-mo,rnd(1,10));
    const stu=r()<.55, k=r();
    const res={id:'r'+(n++),name:first+' '+last,first,gender:g==='M'?'Male':'Female',mobile:mob(),email:(first+'.'+last).toLowerCase()+rnd(1,99)+'@gmail.com',
      dob:`${rnd(1,28)} ${MONTHS[rnd(0,11)]} ${stu?rnd(2003,2006):rnd(1994,2002)}`,occ:stu?'Student':'Working professional',org:pick(POOL.org),home:pick(POOL.town),
      guardian:{name:pick(POOL.boy.slice(0,12))+' '+last,rel:pick(POOL.rel),mobile:mob()},emergency:{name:pick(POOL.boy)+' '+pick(POOL.last),rel:'Cousin',mobile:mob()},
      bedId:b.id,propId:P.id,rent:R.rent,deposit:R.rent,join:`${jd.getDate()} ${MONTHS[jd.getMonth()]} ${jd.getFullYear()}`,months:mo,
      kyc:k<.86?'Verified':k<.94?'Submitted':'Pending',kycDoc:pick(['Aadhaar (DigiLocker)','Aadhaar (DigiLocker)','PAN card','Passport','Driving licence']),police:'Verified',status:'Active',mess:P.mess&&r()<.6,
      depStatus:'Held',addr:`${rnd(2,180)}, ${pick(['Shanti Nagar','Gandhi Colony','Station Road','Civil Lines','Nehru Park'])}, ${pick(POOL.town)}`};
    if(res.kyc!=='Verified') res.police='Pending'; else if(r()<.08) res.police='Pending';
    const el=Math.round(rnd(260,880)/10)*10;
    const items=[{n:'Rent · Dec 2026',a:res.rent},{n:'Electricity · Nov meter share',a:el}];
    if(res.mess) items.push({n:'Food · Full veg meal plan',a:3200});
    const x=r(); let st=x<.6?'Paid':x<.68?'Partial':x<.92?'Due':'Overdue';
    let month='Dec 2026', due='5 Dec 2026';
    if(st==='Overdue'){month='Nov 2026';due='5 Nov 2026';items[0].n='Rent · Nov 2026';items[1].n='Electricity · Oct meter share';items.push({n:'Late fee (after 5-day grace)',a:500});}
    const total=items.reduce((s,i)=>s+i.a,0);
    const inv={id:'INV-'+(ivn++),resId:res.id,propId:P.id,month,due,items,total,paid:0,status:st,issued:st==='Overdue'?'25 Oct 2026':'25 Nov 2026'};
    if(st==='Paid'||st==='Partial'){
      inv.paid=st==='Paid'?total:Math.round(total*.5/100)*100;
      const m=pick(['UPI','UPI','UPI','UPI','Cash','Card']);
      D.pay.push({id:'PAY-'+(pn++),invId:inv.id,resId:res.id,propId:P.id,amt:inv.paid,method:m,ref:m==='Cash'?'Collected by '+(P.id==='p1'?'Ramesh Parmar':P.id==='p2'?'Imran Shaikh':'Kavita Patel'):m==='Card'?'Razorpay · pay_N'+rnd(1000,9999)+'Kd':'UTR 4'+rnd(10000,99999)+rnd(10000,99999),date:`${pick(['25 Nov','27 Nov','29 Nov','1 Dec','1 Dec','2 Dec'])} 2026`,time:`${rnd(8,21)}:${String(rnd(0,59)).padStart(2,'0')}`,status:'Success',app:m==='UPI'?pick(['Google Pay','PhonePe','Paytm','BHIM']):''});
    } else if(st==='Due'&&r()<.18){
      D.pay.push({id:'PAY-'+(pn++),invId:inv.id,resId:res.id,propId:P.id,amt:total,method:'UPI',ref:'UTR 4'+rnd(10000,99999)+rnd(10000,99999),date:'2 Dec 2026',time:`${rnd(8,11)}:${String(rnd(0,59)).padStart(2,'0')}`,status:'Verifying',app:'Direct UPI to owner',shot:true});
    }
    D.inv.push(inv); D.res.push(res);
  });
  // Rohan Sharma — the demo resident
  const rb=bedAt('A-201','B'), me=D.res.find(x=>x.bedId===rb.id);
  Object.assign(me,{name:'Rohan Sharma',first:'Rohan',gender:'Male',mobile:'+91 98765 12207',email:'rohan.sharma@gmail.com',dob:'14 Mar 2001',occ:'Working professional',org:'L&T Technology Services',home:'Indore',rent:8000,deposit:10000,join:'1 Jul 2025',months:17,kyc:'Verified',kycDoc:'Aadhaar (DigiLocker)',police:'Verified',mess:false,status:'Active',
    guardian:{name:'Suresh Sharma',rel:'Father',mobile:'+91 94251 33870'},emergency:{name:'Ankit Verma',rel:'Friend',mobile:'+91 99263 40518'},addr:'42, Saket Nagar, Indore, Madhya Pradesh 452018'});
  const mi=D.inv.find(i=>i.resId===me.id);
  D.pay=D.pay.filter(p=>p.resId!==me.id);
  const mr=D.rooms.find(x=>x.id===rb.roomId);mr.meterPrev=5228;mr.meterCur=5320;
Object.assign(mi,{month:'Dec 2026',due:'5 Dec 2026',items:[{n:'Rent · Dec 2026',a:8000},{n:'Electricity · Nov meter share',a:414}],total:8414,paid:0,status:'Due',issued:'25 Nov 2026'});
  D.me=me.id;
  // Kunal Mehta — on notice period, checking out
  const kb=bedAt('B-104','A'), ku=D.res.find(x=>x.bedId===kb.id);
  Object.assign(ku,{name:'Kunal Mehta',first:'Kunal',gender:'Male',status:'Notice',checkout:'5 Dec 2026',rent:6500,deposit:10000,join:'3 Aug 2025',kyc:'Verified',police:'Verified'});
  const ki=D.inv.find(i=>i.resId===ku.id); Object.assign(ki,{items:[{n:'Rent · Dec 2026',a:6500},{n:'Electricity · Nov meter share',a:510}],total:7010,paid:0,status:'Due',month:'Dec 2026',due:'5 Dec 2026'}); D.pay=D.pay.filter(p=>p.resId!==ku.id);
  // a couple more on notice
  D.res.filter(x=>x.propId==='p2').slice(3,5).forEach((x,i)=>{x.status='Notice';x.checkout=['12 Dec 2026','31 Dec 2026'][i]});
  // past invoices for history (resident app)
  ['Nov','Oct','Sep','Aug','Jul','Jun'].forEach((m,i)=>D.hist.push({id:'INV-'+(1000-i*37),resId:me.id,month:m+' 2026',total:8000+[390,460,520,610,580,430][i],paidOn:`${[3,4,2,5,1,3][i]} ${m} 2026`,method:['UPI','UPI','Cash','UPI','UPI','Card'][i],pay:'PAY-'+(7700-i*41)}));

  // Reservations from reserved beds
  const pros=[['Harsh Vyas','+91 98980 22314'],['Sakshi Nair','+91 90990 66102'],['Arjun Rathod','+91 97140 88213'],['Meera Iyer','+91 99789 10432'],['Dev Chauhan','+91 81280 77341'],['Tanya Kapoor','+91 70435 20917'],['Rajat Soni','+91 63520 41188'],['Ishita Desai','+91 95101 33072']];
  let rv=301;
  D.beds.filter(b=>b.status==='Reserved').forEach((b,i)=>{const p=pros[i%pros.length];const d=3+i*2;
    D.resv.push({id:'RSV-'+(rv++),name:p[0],mobile:p[1],bedId:b.id,propId:b.propId,from:`${Math.min(d,28)} Dec 2026`,fromN:Math.min(d,28),to:'31 May 2027',toN:150,advance:[2000,3000,2000,5000][i%4],adv:i%5===3?'Pending':'Paid',status:i%5===3?'Pending payment':'Confirmed',note:i%2?'Joining after semester exams':'Office joining on check-in date',created:`${20+i%9} Nov 2026`});});
  D.resv.push({id:'RSV-298',name:'Nirav Bhatt',mobile:'+91 98251 77120',bedId:D.beds.find(b=>b.propId==='p1'&&b.status==='Occupied').id,propId:'p1',from:'1 Sep 2026',to:'—',advance:2000,adv:'Adjusted',status:'Checked in',created:'18 Aug 2026',fromN:-90,toN:400});
  D.resv.push({id:'RSV-296',name:'Pallavi Joshi',mobile:'+91 97236 50118',bedId:D.beds.find(b=>b.propId==='p3'&&b.status==='Available').id,propId:'p3',from:'15 Nov 2026',to:'—',advance:2000,adv:'Refunded',status:'Cancelled',created:'2 Nov 2026',fromN:-17,toN:-17});
  D.wait=[{id:'W1',name:'Yash Malhotra',mobile:'+91 98987 11420',propId:'p1',pref:'Single or 2 sharing, AC',since:'26 Nov 2026',budget:10000},{id:'W2',name:'Ritika Sen',mobile:'+91 99251 40387',propId:'p3',pref:'2 sharing, attached bath',since:'28 Nov 2026',budget:9000},{id:'W3',name:'Mohit Agarwal',mobile:'+91 90330 21549',propId:'p2',pref:'Single room',since:'30 Nov 2026',budget:12500}];

  D.staff=[
    {id:'s1',name:'Ramesh Parmar',role:'Manager',props:['p1'],mobile:'+91 98240 11223',salary:22000,shift:'Day · 9 AM–7 PM',join:'Apr 2022',today:'Present',access:'Manager (no reports)',skills:['Wi-Fi','Other']},
    {id:'s2',name:'Mahesh Solanki',role:'Warden',props:['p1'],mobile:'+91 97245 63018',salary:15000,shift:'Night · 8 PM–8 AM',join:'Jan 2024',today:'Present',access:'Warden',skills:['Security']},
    {id:'s3',name:'Lakshmi Ben Vaghela',role:'Cook',props:['p1'],mobile:'+91 99790 21456',salary:14000,shift:'Kitchen · 6 AM–9 PM',join:'Jun 2023',today:'Present',access:'No app access',skills:[]},
    {id:'s4',name:'Raju Prajapati',role:'Electrician',props:['p1','p2','p3'],mobile:'+91 98795 40221',salary:18000,shift:'On call · 10 AM–6 PM',join:'Sep 2023',today:'Present',access:'Maintenance',skills:['Electricity','AC','Furniture']},
    {id:'s5',name:'Imran Shaikh',role:'Manager',props:['p2'],mobile:'+91 90999 18765',salary:24000,shift:'Day · 9 AM–7 PM',join:'Feb 2023',today:'On leave',access:'Manager (no reports)',skills:['Wi-Fi','Other']},
    {id:'s6',name:'Sunita Devi',role:'Housekeeping',props:['p2'],mobile:'+91 70160 33219',salary:11000,shift:'Morning · 7 AM–3 PM',join:'May 2024',today:'Present',access:'Maintenance',skills:['Cleaning','Bathroom']},
    {id:'s7',name:'Bhavesh Rana',role:'Security',props:['p2'],mobile:'+91 63540 90127',salary:13000,shift:'Night · 8 PM–8 AM',join:'Jul 2024',today:'Absent',access:'Visitor entry only',skills:['Security']},
    {id:'s8',name:'Kavita Patel',role:'Warden',props:['p3'],mobile:'+91 98988 77610',salary:16000,shift:'Day · 9 AM–9 PM',join:'Mar 2023',today:'Present',access:'Manager (no reports)',skills:['Other','Security']},
    {id:'s9',name:'Geeta Ben Rathod',role:'Cook',props:['p3'],mobile:'+91 97378 55402',salary:13000,shift:'Kitchen · 6 AM–9 PM',join:'Aug 2023',today:'Present',access:'No app access',skills:[]},
    {id:'s10',name:'Dinesh Plumber Works',role:'Plumber (vendor)',props:['p1','p2','p3'],mobile:'+91 98250 66314',salary:0,shift:'On call',join:'Vendor',today:'—',access:'Maintenance',skills:['Plumbing','Bathroom']}
  ];
  const rp=(pid,no,l)=>{const R=D.rooms.find(x=>x.propId===pid&&x.no===no)||D.rooms.find(x=>x.propId===pid);const b=D.beds.find(x=>x.roomId===R.id&&x.status==='Occupied')||D.beds.find(x=>x.roomId===R.id);const re=D.res.find(x=>x.bedId===b.id);return{room:R.no,resId:re?re.id:null}};
  const C=(id,pid,no,cat,title,desc,status,pri,created,asg,extra={})=>{const x=rp(pid,no);D.comp.push({id,propId:pid,room:x.room,resId:x.resId,cat,title,desc,status,pri,created,assignee:asg,notes:[],photos:2,rating:null,...extra})};
  C('CMP-1188','p2','T1-302','AC','AC not cooling','AC runs but only blows normal air since last night. Remote display shows 18°C.','New','High','2 Dec 2026 · 8:59 AM',null);
  C('CMP-1187','p1','A-201','Wi-Fi','Wi-Fi very slow on 2nd floor','Speed drops below 2 Mbps after 8 PM. Can’t attend office calls.','In Progress','Medium','1 Dec 2026 · 9:40 PM','s1',{notes:[{by:'Ramesh Parmar',t:'2 Dec, 10:15 AM',x:'Called JioFiber. Technician visit booked for 3 Dec, 11 AM.'}]});
  C('CMP-1185','p1','B-104','Bathroom','Geyser not heating','Common bathroom geyser on 1st floor of Block B trips the switch.','Assigned','High','1 Dec 2026 · 7:05 AM','s4');
  C('CMP-1181','p3','K-203','Plumbing','Tap leaking in bathroom','Wash basin tap keeps dripping, water collecting on floor.','Resolved','Low','29 Nov 2026 · 6:30 PM','s10',{resolution:'Replaced tap cartridge and washer. Checked for leaks after 1 hour.',resolvedOn:'30 Nov 2026 · 12:40 PM',cost:350});
  C('CMP-1179','p2','T2-101','Furniture','Cupboard lock broken','Wardrobe lock does not close. Need it fixed for safety of belongings.','New','Medium','28 Nov 2026 · 11:20 AM',null);
  C('CMP-1176','p1','A-305','Cleaning','Room cleaning missed for 2 days','Housekeeping did not come on 26 and 27 Nov.','Closed','Low','27 Nov 2026 · 8:00 PM','s1',{resolution:'Cleaning schedule corrected; room cleaned on 28 Nov.',resolvedOn:'28 Nov 2026',rating:4,feedback:'Cleaned well, please keep timing regular.'});
  C('CMP-1172','p3','K-301','Security','Main gate light not working','Light near the main gate is off; area is dark after 8 PM.','In Progress','High','26 Nov 2026 · 9:10 PM','s4');
  C('CMP-1160','p1','A-201','Electricity','Tube light flickering','Room tube light flickers continuously.','Closed','Low','14 Nov 2026 · 7:45 PM','s4',{resolution:'Replaced choke and tube light.',resolvedOn:'15 Nov 2026',rating:5,feedback:'Quick fix, thanks!'});

  const E=(pid,cat,vendor,desc,amt,date,status,rec,bill,mode)=>D.exp.push({id:'EXP-'+(2400+D.exp.length),propId:pid,cat,vendor,desc,amt,date,status,rec,bill,mode:mode||'Bank transfer',by:pid==='p1'?'Ramesh Parmar':pid==='p2'?'Imran Shaikh':'Kavita Patel'});
  E('p1','Electricity','MGVCL','Electricity bill · 28 Oct–27 Nov',38200,'28 Nov 2026','Approved',true,true,'UPI');
  E('p1','Food & groceries','Shree Krishna Kirana Store','Monthly groceries & vegetables',41500,'1 Dec 2026','Approved',false,true,'Cash');
  E('p1','Internet','JioFiber Business','1 Gbps business plan · Dec',4720,'1 Dec 2026','Approved',true,true,'Auto-debit');
  E('p1','Staff salaries','Staff payroll','November salaries (4 staff)',69000,'30 Nov 2026','Approved',true,false);
  E('p1','Repairs','Patel Electricals','Geyser thermostat replacement B-104',1850,'2 Dec 2026','Pending',false,true,'Cash');
  E('p2','Electricity','Torrent Power','Electricity bill · Nov',44600,'27 Nov 2026','Approved',true,true,'UPI');
  E('p2','Rent','Bharat Shah (landlord)','Building lease · Dec 2026',85000,'1 Dec 2026','Approved',true,false);
  E('p2','Cleaning','SparkleCare Services','Housekeeping contract · Dec',12000,'1 Dec 2026','Approved',true,true);
  E('p2','Maintenance','CoolAir Services','AC servicing (8 units)',6400,'2 Dec 2026','Pending',false,true,'UPI');
  E('p2','Internet','Airtel Xstream Fiber','500 Mbps plan · Dec',5900,'1 Dec 2026','Approved',true,true,'Auto-debit');
  E('p3','Electricity','DGVCL','Electricity bill · Nov',29800,'29 Nov 2026','Approved',true,true,'UPI');
  E('p3','Food & groceries','Surat Fresh Mart','Groceries, milk & vegetables',33400,'1 Dec 2026','Approved',false,true,'UPI');
  E('p3','Water','Surat Municipal Corporation','Water tanker × 4 (supply cut)',3200,'25 Nov 2026','Approved',false,true,'Cash');
  E('p3','Staff salaries','Staff payroll','November salaries (2 staff)',29000,'30 Nov 2026','Approved',true,false);
  E('p3','Other','Pest Control India','Quarterly pest control',2800,'2 Dec 2026','Pending',false,false,'UPI');

  D.notices=[
    {id:'N1',propId:'p1',type:'Maintenance',title:'Water supply off on 4 Dec, 10 AM–2 PM',body:'Overhead tank cleaning is scheduled for Thursday, 4 December, 10 AM to 2 PM. Please store water in advance. Bathrooms on all floors will be affected.',date:'1 Dec 2026',read:false,channels:['Push','WhatsApp'],reads:58,aud:'Sunrise Boys PG · all residents',state:'Sent'},
    {id:'N2',propId:'all',type:'Important',title:'December rent due by 5 Dec',body:'December rent invoices are now available in the app. Pay by 5 December to avoid the ₹500 late fee. UPI, cards and cash at the office are accepted.',date:'1 Dec 2026',read:false,channels:['Push','WhatsApp','SMS'],reads:121,aud:'All properties',state:'Sent'},
    {id:'N3',propId:'p1',type:'Announcement',title:'New Wi-Fi password from 1 Dec',body:'Network: Sunrise_5G · Password is shared at the front desk and in the Profile → My PG section. Please do not share it with visitors.',date:'30 Nov 2026',read:true,channels:['Push'],reads:61,aud:'Sunrise Boys PG · all residents',state:'Sent'},
    {id:'N4',propId:'p1',type:'Maintenance',title:'Pest control on Sunday, 7 Dec',body:'Pest control will be done in all rooms from 11 AM. Please keep food items packed and vacate rooms for 2 hours.',date:'29 Nov 2026',read:true,channels:['Push','WhatsApp'],reads:55,aud:'Sunrise Boys PG · all residents',state:'Sent'},
    {id:'N5',propId:'p1',type:'Rule',title:'Visitor policy updated',body:'Visitors are allowed in the common area only, between 9 AM and 8 PM. Overnight guests are not permitted. All visitors must sign in at the security desk with a photo ID.',date:'20 Nov 2026',read:true,channels:['Push'],reads:63,aud:'Sunrise Boys PG · all residents',state:'Sent'},
    {id:'N6',propId:'p1',type:'Announcement',title:'December mess menu is live',body:'Sunday special: Gujarati thali. Thursday dinner: paneer & jeera rice. Check the full menu in the app.',date:'28 Nov 2026',read:true,channels:['Push'],reads:44,aud:'Sunrise Boys PG · meal plan residents',state:'Sent'},
    {id:'N7',propId:'all',type:'Important',title:'Reminder: rent due in 1 day',body:'Automatic WhatsApp reminder to residents with unpaid December rent.',date:'4 Dec 2026 · 9:00 AM',read:true,channels:['WhatsApp'],reads:0,aud:'Residents with unpaid rent',state:'Scheduled'},
    {id:'N8',propId:'p3',type:'Announcement',title:'Navratri garba night — 3 Dec',body:'Draft announcement for the garba night on the terrace.',date:'Draft',read:true,channels:['Push'],reads:0,aud:'Krishna PG',state:'Draft'}
  ];
  D.notifs=[
    {id:'O1',type:'pay',title:'Payment received',text:'₹8,350 by UPI from a Sunrise resident',time:'10 min ago',read:false,go:'payList'},
    {id:'O2',type:'comp',title:'New complaint · AC not cooling',text:'Royal PG · T1-302 · High priority',time:'42 min ago',read:false,go:'compDetail',p:{id:'CMP-1188'}},
    {id:'O3',type:'upi',title:'UPI payments to verify',text:'Residents shared UTR numbers for direct UPI payments',time:'1 hr ago',read:false,go:'upiVerify'},
    {id:'O4',type:'kyc',title:'KYC submitted',text:'Documents uploaded and waiting for your review',time:'3 hr ago',read:true,go:'resList',p:{f:'kyc'}},
    {id:'O5',type:'resv',title:'Reservation confirmed',text:'Advance ₹2,000 received for a Sunrise bed',time:'Yesterday',read:true,go:'resvList'},
    {id:'O6',type:'out',title:'Check-out in 3 days',text:'Kunal Mehta · Sunrise B-104 · 5 Dec',time:'Yesterday',read:true,go:'resList'},
    {id:'O7',type:'doc',title:'Document expiring',text:'Fire NOC for Royal PG expires on 15 Jan 2027',time:'2 days ago',read:true,go:'propDetail',p:{id:'p2',t:'docs'}},
    {id:'O8',type:'sub',title:'Subscription renews in 43 days',text:'Professional plan · ₹2,499/month',time:'3 days ago',read:true,go:'sub'}
  ];
  D.visitors=[
    {id:'V1',name:'Suresh Sharma',mobile:'+91 94251 33870',rel:'Parent',resId:me.id,propId:'p1',in:'2 Dec · 11:10 AM',out:null,idType:'Aadhaar (last 4: 4821)'},
    {id:'V2',name:'Swiggy delivery',mobile:'+91 70123 88410',rel:'Delivery',resId:null,propId:'p1',in:'2 Dec · 1:05 PM',out:'2 Dec · 1:08 PM',idType:'—'},
    {id:'V3',name:'Neel Joshi',mobile:'+91 98765 99012',rel:'Friend',resId:D.res.find(x=>x.propId==='p1'&&x.id!==me.id).id,propId:'p1',in:'1 Dec · 6:20 PM',out:'1 Dec · 7:45 PM',idType:'Driving licence'},
    {id:'V4',name:'Urban Company technician',mobile:'+91 88661 20341',rel:'Service',resId:null,propId:'p2',in:'2 Dec · 10:30 AM',out:null,idType:'Company ID'},
    {id:'V5',name:'Hema Desai',mobile:'+91 99250 31187',rel:'Parent',resId:D.res.find(x=>x.propId==='p3').id,propId:'p3',in:'1 Dec · 4:00 PM',out:'1 Dec · 6:30 PM',idType:'Aadhaar (last 4: 0937)'}
  ];
  return D;
}
let DB=buildDB();

const PLANS=[
  {id:'basic',name:'Basic',m:999,y:9990,props:'1 property',beds:'Up to 50 beds',staff:'2 staff logins',f:{'Rent & invoices':1,'UPI payments':1,'Resident app':1,'Complaints':1,'Expenses':1,'WhatsApp reminders':0,'Reports & analytics':'Basic','Multi-property dashboard':0,'Staff attendance & salary':0,'Food & mess':0,'Custom roles':0,'Priority support':0}},
  {id:'pro',name:'Professional',m:2499,y:24990,props:'Up to 5 properties',beds:'Up to 300 beds',staff:'10 staff logins',f:{'Rent & invoices':1,'UPI payments':1,'Resident app':1,'Complaints':1,'Expenses':1,'WhatsApp reminders':1,'Reports & analytics':'Full','Multi-property dashboard':1,'Staff attendance & salary':1,'Food & mess':1,'Custom roles':0,'Priority support':0}},
  {id:'ent',name:'Enterprise',m:5999,y:59990,props:'Unlimited properties',beds:'Unlimited beds',staff:'Unlimited staff',f:{'Rent & invoices':1,'UPI payments':1,'Resident app':1,'Complaints':1,'Expenses':1,'WhatsApp reminders':1,'Reports & analytics':'Full + export API','Multi-property dashboard':1,'Staff attendance & salary':1,'Food & mess':1,'Custom roles':1,'Priority support':1}}
];
const SUB={plan:'pro',cycle:'Monthly',since:'14 Jan 2026',renews:'14 Jan 2027',days:43,staffUsed:9,
  inv:[['SUB-2611','Dec 2026','₹2,948.82','Paid','14 Nov 2026'],['SUB-2510','Nov 2026','₹2,948.82','Paid','14 Oct 2026'],['SUB-2409','Oct 2026','₹2,948.82','Paid','14 Sep 2026'],['SUB-2308','Sep 2026','₹2,948.82','Paid','14 Aug 2026'],['SUB-1102','Feb 2026','₹1,178.82','Paid','14 Jan 2026']]};

const MENU={
  Mon:['Poha, jalebi, tea','Dal, rice, bhindi sabzi, roti, salad','Rajma chawal, roti, raita'],
  Tue:['Upma, banana, tea','Gujarati dal, rice, aloo sabzi, roti','Chole, puri, jeera rice'],
  Wed:['Aloo paratha, curd','Kadhi, khichdi, papad, roti','Mix veg, dal fry, roti, rice'],
  Thu:['Idli sambhar, tea','Dal, rice, cabbage sabzi, roti','Paneer butter masala, jeera rice, roti'],
  Fri:['Thepla, chhundo, tea','Sev tameta, dal, rice, roti','Pav bhaji, pulao'],
  Sat:['Methi thepla, tea','Undhiyu, puri, shrikhand','Dal baati, churma'],
  Sun:['Chole bhature','Gujarati thali (special)','Light dinner: khichdi, kadhi']
};
const MEALPLANS=[['Full veg plan','Breakfast, lunch, dinner',3200,41],['Lunch + dinner','For working professionals',2600,12],['Dinner only','Evening meals',1500,6],['No meal plan','Common kitchen access',0,15]];

const ADMIN={
  biz:[
    {id:'B1',name:'Deven PG Group',owner:'Deven Patel',mobile:'+91 98250 41736',email:'deven.patel@gmail.com',city:'Vadodara',plan:'Professional',status:'Active',props:3,beds:173,res:0,mrr:2499,since:'14 Jan 2026',last:'2 min ago'},
    {id:'B2',name:'Shree Sai Ladies Hostel',owner:'Sunita Kulkarni',mobile:'+91 98220 41190',email:'saihostel.pune@gmail.com',city:'Pune',plan:'Basic',status:'Active',props:1,beds:42,res:39,mrr:999,since:'3 Mar 2026',last:'1 hr ago'},
    {id:'B3',name:'Comfort Stay Co-living',owner:'Arvind Reddy',mobile:'+91 99001 22345',email:'ops@comfortstay.in',city:'Bengaluru',plan:'Enterprise',status:'Active',props:14,beds:1120,res:1012,mrr:5999,since:'11 Aug 2025',last:'5 min ago'},
    {id:'B4',name:'Om Boys PG',owner:'Rakesh Jain',mobile:'+91 98930 55120',email:'ompg.indore@gmail.com',city:'Indore',plan:'Professional',status:'Trial',props:2,beds:64,res:20,mrr:0,since:'24 Nov 2026',last:'Yesterday',trialEnds:'8 Dec 2026'},
    {id:'B5',name:'Galaxy PG & Hostel',owner:'Srinivas Rao',mobile:'+91 90000 78123',email:'galaxypg@gmail.com',city:'Hyderabad',plan:'Professional',status:'Past due',props:4,beds:210,res:188,mrr:2499,since:'2 Feb 2026',last:'3 days ago',due:'₹2,948.82 since 26 Nov'},
    {id:'B6',name:'Annapurna PG',owner:'Mahesh Sharma',mobile:'+91 94140 33781',email:'annapurnapg@yahoo.com',city:'Jaipur',plan:'Basic',status:'Suspended',props:1,beds:30,res:0,mrr:0,since:'9 Sep 2025',last:'21 days ago'},
    {id:'B7',name:'Nest Living',owner:'Karan Malhotra',mobile:'+91 98111 40236',email:'karan@nestliving.co',city:'Noida',plan:'Enterprise',status:'Active',props:9,beds:740,res:688,mrr:5999,since:'1 Jun 2025',last:'12 min ago'},
    {id:'B8',name:'Green Valley PG',owner:'Hiral Shah',mobile:'+91 97250 66014',email:'greenvalleypg@gmail.com',city:'Ahmedabad',plan:'Professional',status:'Active',props:3,beds:156,res:141,mrr:2499,since:'19 Apr 2026',last:'40 min ago'}
  ],
  tickets:[
    {id:'TCK-5521',biz:'B5',sub:'Razorpay settlement not received',pri:'High',status:'Open',time:'35 min ago',from:'Srinivas Rao',msgs:[['Srinivas Rao','Rent collected via app on 28 Nov but settlement not in my bank yet.','10:12 AM'],['Support · Neha','Checking with Razorpay. Can you share the payment ID?','10:20 AM']]},
    {id:'TCK-5519',biz:'B1',sub:'How to split electricity by meter?',pri:'Low',status:'Waiting on customer',time:'2 hr ago',from:'Deven Patel',msgs:[['Deven Patel','Can the app split each room meter bill among beds automatically?','8:40 AM'],['Support · Aman','Yes — Finance → Electricity. Enter readings and tap "Add to invoices".','9:02 AM']]},
    {id:'TCK-5517',biz:'B3',sub:'Need custom role for accountant',pri:'Medium',status:'Open',time:'Yesterday',from:'Arvind Reddy',msgs:[['Arvind Reddy','Our accountant should see finance only, not residents.','Yesterday']]},
    {id:'TCK-5509',biz:'B2',sub:'OTP not received on Jio number',pri:'High',status:'Resolved',time:'2 days ago',from:'Sunita Kulkarni',msgs:[['Sunita Kulkarni','Residents say OTP SMS is not coming.','30 Nov'],['Support · Neha','SMS provider issue fixed. WhatsApp OTP fallback is enabled.','30 Nov']]}
  ],
  audit:[
    ['2 Dec 2026, 11:42 AM','neha@pgerp.in','Viewed business','Galaxy PG & Hostel'],
    ['2 Dec 2026, 10:05 AM','aman@pgerp.in','Extended trial by 7 days','Om Boys PG'],
    ['1 Dec 2026, 6:18 PM','system','Subscription marked past due','Galaxy PG & Hostel'],
    ['1 Dec 2026, 3:02 PM','vikram@pgerp.in','Updated plan price','Enterprise yearly ₹59,990'],
    ['30 Nov 2026, 9:15 AM','vikram@pgerp.in','Changed SMS provider','MSG91 → fallback WhatsApp OTP'],
    ['11 Nov 2026, 12:00 PM','neha@pgerp.in','Suspended business','Annapurna PG · non-payment 60 days']
  ],
  admins:[['Vikram Desai','vikram@pgerp.in','Super Admin','Active'],['Neha Kapoor','neha@pgerp.in','Support Lead','Active'],['Aman Gupta','aman@pgerp.in','Support Agent','Active'],['Ritu Bansal','ritu@pgerp.in','Finance','Active'],['Farhan Ali','farhan@pgerp.in','Support Agent','Disabled']]
};

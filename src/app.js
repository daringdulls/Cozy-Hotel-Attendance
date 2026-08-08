import './styles.css';

const staff = [
  { id: 1, name: 'Sample Staff 01', role: 'Front Office', initials: 'S1', off: 'Friday', rate: 52, color: '#d87e5f' },
  { id: 2, name: 'Sample Staff 02', role: 'Operations', initials: 'S2', off: 'Monday', rate: 58, color: '#73907f' },
  { id: 3, name: 'Sample Staff 03', role: 'Housekeeping', initials: 'S3', off: 'Tuesday', rate: 48, color: '#c49a50' },
  { id: 4, name: 'Sample Staff 04', role: 'Food & Beverage', initials: 'S4', off: 'Thursday', rate: 50, color: '#6e89a8' },
  { id: 5, name: 'Sample Staff 05', role: 'Finance', initials: 'S5', off: 'Saturday', rate: 62, color: '#9c7b9f' },
];

const records = {
  1: ['09:02', '17:18'], 2: ['08:54', '17:03'], 3: ['09:21', '17:05'], 4: ['08:45', '18:02'], 5: ['09:00', null]
};
let selected = 1;
let signed = JSON.parse(localStorage.getItem('clockwise-signed') || '{}');
let sickLeaves = JSON.parse(localStorage.getItem('clockwise-sick-leaves') || '[{"staffId":3,"date":"2026-08-08","days":1,"paid":true,"note":"Medical leave"}]');

const app = document.querySelector('#app');
const icon = (name) => ({ grid:'&#9638;', team:'&#9823;', calendar:'&#9636;', report:'&#9635;', settings:'&#9881;', bell:'&#9675;', search:'&#8981;', plus:'+', arrow:'&#8594;', check:'&#10003;' }[name]);

function hours(rec) {
  if (!rec?.[1]) return 0;
  const [h1,m1]=rec[0].split(':').map(Number), [h2,m2]=rec[1].split(':').map(Number);
  return ((h2*60+m2-h1*60-m1)/60);
}

function render(view='dashboard') {
  const total = staff.reduce((n,s)=>n+hours(records[s.id]),0);
  app.innerHTML = `
    <div class="shell">
      <aside>
        <div class="brand"><span class="brandmark"><i></i><i></i><i></i></span><b>clockwise</b></div>
        <nav>
          ${nav('dashboard','grid','Overview',view)}${nav('attendance','calendar','Attendance',view)}${nav('people','team','Staff',view)}${nav('register','report','Monthly register',view)}${nav('payroll','report','Payroll',view)}
        </nav>
        <div class="aside-bottom">
          <button class="nav-item">${icon('settings')}<span>Settings</span></button>
          <div class="profile"><span class="avatar small">DA</span><div><b>Demo Admin</b><small>Administrator</small></div><button>â€¢â€¢â€¢</button></div>
        </div>
      </aside>
      <main>
        <header><button class="mobile-menu" aria-label="Open menu">â˜°</button><div class="search">${icon('search')}<input aria-label="Search" placeholder="Search staff or records" /></div><button class="round" aria-label="Notifications">${icon('bell')}<em></em></button></header>
        ${view === 'payroll' ? payrollView() : view === 'register' ? registerView() : dashboardView()}
      </main>
    </div>
    <div id="modal"></div>`;
  bind();
}

function nav(id,ico,label,current){ return `<button class="nav-item ${id===current?'active':''}" data-view="${id}"><span>${icon(ico)}</span>${label}</button>`; }

function dashboardView(){
  const sickToday = new Set(sickLeaves.filter(l=>l.date==='2026-08-08').map(l=>l.staffId));
  return `<section class="content">
    <div class="eyebrow">SATURDAY, 08 AUGUST</div>
    <div class="title-row"><div><h1>Good morning.</h1><p>Here is how your team is doing today.</p></div><div class="title-actions"><button class="secondary" id="addSick">Record sick leave</button><button class="primary" id="addStaff">${icon('plus')} Add staff member</button></div></div>
    <div class="metrics">
      ${metric('Today attendance',`${5-sickToday.size} / 5`,`${Math.round((5-sickToday.size)/5*100)}% available`,'up')}
      ${metric('On time','3','1 late arrival','warn')}
      ${metric('Hours logged','34h 27m','of 40h scheduled','neutral')}
      ${metric('Sick leave',String(sickToday.size),sickToday.size?'recorded today':'none today','warn')}
    </div>
    <div class="grid-two">
      <article class="card attendance-card">
        <div class="card-head"><div><h2>Todayâ€™s attendance</h2><p>Saturday, 08 August</p></div><button class="text-btn" data-view="attendance">View all ${icon('arrow')}</button></div>
        <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th></tr></thead><tbody>
        ${staff.map(s=>{const r=records[s.id], h=hours(r), sick=sickToday.has(s.id); return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td><td>${sick?'--':r[0]}</td><td>${sick?'--':(r[1]||'--')}</td><td>${sick?'--':(h?h.toFixed(1)+'h':'--')}</td><td>${sick?'<span class="pill sick">Sick leave</span>':s.id===5?'<span class="pill working">Working</span>':s.id===3?'<span class="pill late">Late</span>':'<span class="pill present">Present</span>'}</td></tr>`}).join('')}
        </tbody></table></div>
      </article>
      <aside class="side-stack">
        <article class="card schedule"><div class="card-head"><div><h2>Weekly schedule</h2><p>03 â€“ 09 August</p></div></div>
          <div class="week"><div><b>Mon</b><span>03</span></div><div><b>Tue</b><span>04</span></div><div><b>Wed</b><span>05</span></div><div><b>Thu</b><span>06</span></div><div><b>Fri</b><span>07</span></div><div class="today"><b>Sat</b><span>08</span></div><div><b>Sun</b><span>09</span></div></div>
          <div class="off-list"><div><span class="avatar small" style="--avatar:#d87e5f">S1</span><p><b>Sample Staff 01</b><small>Day off Â· Friday</small></p><span class="tag">OFF</span></div><div><span class="avatar small" style="--avatar:#6e89a8">S4</span><p><b>Sample Staff 04</b><small>Day off Â· Thursday</small></p><span class="tag">OFF</span></div></div>
        </article>
        <article class="card payroll-nudge"><div class="nudge-icon">${icon('report')}</div><div><h3>August payroll</h3><p>${Object.keys(signed).length} of 5 staff have signed their attendance.</p><div class="progress"><i style="width:${Object.keys(signed).length*20}%"></i></div><button class="text-btn" data-view="payroll">Review monthly attendance ${icon('arrow')}</button></div></article>
      </aside>
    </div>
  </section>`;
}

function metric(label,value,sub,tone){return `<article class="metric"><div class="metric-top"><span>${label}</span><i class="dot ${tone}"></i></div><strong>${value}</strong><small>${sub}</small></article>`}

function registerView(department='All departments'){
  const days=Array.from({length:31},(_,i)=>i+1);
  const departments=['All departments',...new Set(staff.map(s=>s.role))];
  const shown=department==='All departments'?staff:staff.filter(s=>s.role===department);
  const offIndex={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  const status=(s,day)=>{
    const iso=`2026-08-${String(day).padStart(2,'0')}`;
    if(sickLeaves.some(l=>l.staffId===s.id&&l.date===iso)) return 'S';
    if(new Date(2026,7,day).getDay()===offIndex[s.off]) return 'O';
    return 'P';
  };
  return `<section class="content register-view"><div class="register-toolbar no-print"><div><div class="eyebrow">MONTHLY ATTENDANCE REGISTER</div><h1>August 2026</h1><p>Department register with daily status and month-end signatures.</p></div><div class="register-actions"><label>Department<select id="departmentFilter">${departments.map(d=>`<option ${d===department?'selected':''}>${d}</option>`).join('')}</select></label><button class="primary" id="printRegister">Print / Save PDF</button></div></div>
  <article class="register-sheet"><div class="sheet-heading"><div><span class="sheet-mark"><i></i><i></i><i></i></span><div><h2>COZY HOTEL</h2><p>Staff monthly attendance register</p></div></div><dl><div><dt>Month</dt><dd>August 2026</dd></div><div><dt>Department</dt><dd>${department}</dd></div><div><dt>Working day</dt><dd>8 hours</dd></div></dl></div>
  <div class="register-scroll"><table class="matrix"><thead><tr><th class="staff-col">Staff member</th>${days.map(d=>`<th><b>${d}</b><small>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(2026,7,d).getDay()]}</small></th>`).join('')}<th class="total-col">P</th><th class="total-col">S</th><th class="total-col">O</th><th class="signature-col">Staff signature</th></tr></thead><tbody>${shown.map(s=>{const codes=days.map(d=>status(s,d));return `<tr><td class="staff-col"><b>${s.name}</b><small>${s.role}</small></td>${codes.map(c=>`<td><span class="code code-${c.toLowerCase()}">${c}</span></td>`).join('')}<td class="total-col">${codes.filter(c=>c==='P').length}</td><td class="total-col">${codes.filter(c=>c==='S').length}</td><td class="total-col">${codes.filter(c=>c==='O').length}</td><td class="signature-col">${signed[s.id]?'<span class="signed-inline">Signed</span>':'<span class="signature-line"></span>'}</td></tr>`}).join('')}</tbody></table></div>
  <div class="register-legend"><b>Codes</b><span><i class="code-p">P</i> Present</span><span><i class="code-s">S</i> Sick leave</span><span><i class="code-o">O</i> Weekly off</span></div>
  <div class="sheet-approvals"><div><span></span><b>Department head</b><small>Name, signature & date</small></div><div><span></span><b>HR / Administration</b><small>Name, signature & date</small></div><div><span></span><b>Payroll verified by</b><small>Name, signature & date</small></div></div></article></section>`;
}
function payrollView(){
  const signedCount=Object.keys(signed).length;
  return `<section class="content payroll-view"><div class="eyebrow">AUGUST 2026 Â· PAYROLL CYCLE</div><div class="title-row"><div><h1>Attendance sign-off</h1><p>Every staff member must confirm their monthly attendance before payroll runs.</p></div><button class="primary ${signedCount<5?'disabled':''}" ${signedCount<5?'disabled':''}>Run payroll</button></div>
  <div class="approval-banner"><div class="ring" style="--p:${signedCount*72}deg"><span>${signedCount}/5</span></div><div><h2>${signedCount===5?'Ready for payroll':'Waiting for staff signatures'}</h2><p>${5-signedCount} signature${5-signedCount===1?'':'s'} remaining Â· Deadline 31 August, 6:00 PM</p></div><div class="legend"><span><i class="green"></i>Signed</span><span><i></i>Pending</span></div></div>
  <article class="card"><div class="card-head"><div><h2>Monthly attendance summary</h2><p>Calculated on 8 working hours per day and one weekly day off.</p></div><button class="secondary" id="exportBtn">Export summary</button></div>
  <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Days present</th><th>Sick leave</th><th>Days off</th><th>Payable hours</th><th>Estimated pay</th><th>Approval</th></tr></thead><tbody>
  ${staff.map((s,i)=>{const sick=sickLeaves.filter(l=>l.staffId===s.id).reduce((n,l)=>n+l.days,0), paidSick=sickLeaves.filter(l=>l.staffId===s.id&&l.paid).reduce((n,l)=>n+l.days,0), days=21-(i%2)-sick, hrs=days*8+paidSick*8+(i===1?3.5:i===3?1.25:0); return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td><td>${days}</td><td><span class="sick-count">${sick}</span></td><td>4</td><td>${hrs.toFixed(1)}h</td><td>MVR ${(hrs*s.rate).toLocaleString()}</td><td>${signed[s.id]?`<span class="signed">${icon('check')} Signed</span>`:`<button class="sign-btn" data-sign="${s.id}">Request signature</button>`}</td></tr>`}).join('')}
  </tbody></table></div></article></section>`;
}

function bind(){
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view));
  document.querySelector('#addStaff')?.addEventListener('click',()=>toast('Staff invitation form is ready for connection.'));
  document.querySelector('#addSick')?.addEventListener('click',openSickLeave);
  document.querySelector('#exportBtn')?.addEventListener('click',exportCSV);
  document.querySelector('#printRegister')?.addEventListener('click',()=>window.print());
  document.querySelector('#departmentFilter')?.addEventListener('change',e=>{document.querySelector('main').innerHTML=`<header><button class="mobile-menu" aria-label="Open menu">&#9776;</button><div class="search">${icon('search')}<input aria-label="Search" placeholder="Search staff or records" /></div><button class="round" aria-label="Notifications">${icon('bell')}<em></em></button></header>${registerView(e.target.value)}`;bind()});
  document.querySelectorAll('[data-sign]').forEach(b=>b.onclick=()=>openSignature(Number(b.dataset.sign)));
  document.querySelector('.mobile-menu')?.addEventListener('click',()=>document.querySelector('.shell').classList.toggle('menu-open'));
}

function openSickLeave(){
  const modal=document.querySelector('#modal');
  modal.innerHTML=`<div class="modal-backdrop"><form class="dialog sick-dialog"><button type="button" class="close" aria-label="Close">×</button><div class="seal sick-seal">+</div><h2>Record sick leave</h2><p>Add a medical absence to attendance and the monthly payroll summary.</p><label for="sickStaff">Staff member</label><select id="sickStaff" required>${staff.map(s=>`<option value="${s.id}">${s.name} · ${s.role}</option>`).join('')}</select><div class="form-grid"><div><label for="sickDate">Start date</label><input id="sickDate" type="date" value="2026-08-08" required></div><div><label for="sickDays">Number of days</label><input id="sickDays" type="number" min="1" max="30" value="1" required></div></div><label for="sickNote">Note</label><textarea id="sickNote" rows="3" placeholder="Medical certificate or internal note"></textarea><label class="check-row"><input id="sickPaid" type="checkbox" checked> Include as paid sick leave</label><div class="dialog-actions"><button type="button" class="secondary cancel">Cancel</button><button class="primary">Save sick leave</button></div></form></div>`;
  const close=()=>modal.innerHTML=''; modal.querySelector('.close').onclick=close; modal.querySelector('.cancel').onclick=close;
  modal.querySelector('form').onsubmit=e=>{e.preventDefault();sickLeaves.push({staffId:Number(modal.querySelector('#sickStaff').value),date:modal.querySelector('#sickDate').value,days:Number(modal.querySelector('#sickDays').value),paid:modal.querySelector('#sickPaid').checked,note:modal.querySelector('#sickNote').value.trim()});localStorage.setItem('clockwise-sick-leaves',JSON.stringify(sickLeaves));render();toast('Sick leave recorded successfully.')};
}
function openSignature(id){
  selected=id; const s=staff.find(x=>x.id===id); const modal=document.querySelector('#modal');
  modal.innerHTML=`<div class="modal-backdrop"><div class="dialog"><button class="close" aria-label="Close">Ã—</button><div class="seal">${icon('check')}</div><h2>Confirm monthly attendance</h2><p>I, <b>${s.name}</b>, confirm that the attendance and hours shown for August 2026 are correct.</p><label>Draw signature</label><canvas width="560" height="170"></canvas><small class="hint">Use your mouse or finger to sign in the box.</small><div class="dialog-actions"><button class="secondary" id="clear">Clear</button><button class="primary" id="confirm">Sign & confirm</button></div></div></div>`;
  const canvas=modal.querySelector('canvas'), ctx=canvas.getContext('2d'); let drawing=false, hasInk=false;
  const point=e=>{const r=canvas.getBoundingClientRect(), t=e.touches?.[0]||e; return [(t.clientX-r.left)*(canvas.width/r.width),(t.clientY-r.top)*(canvas.height/r.height)]};
  const start=e=>{drawing=true;hasInk=true;ctx.beginPath();ctx.moveTo(...point(e));e.preventDefault()};
  const move=e=>{if(!drawing)return;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.strokeStyle='#173e35';ctx.lineTo(...point(e));ctx.stroke();e.preventDefault()};
  ['mousedown','touchstart'].forEach(x=>canvas.addEventListener(x,start,{passive:false})); ['mousemove','touchmove'].forEach(x=>canvas.addEventListener(x,move,{passive:false})); ['mouseup','mouseleave','touchend'].forEach(x=>canvas.addEventListener(x,()=>drawing=false));
  modal.querySelector('.close').onclick=()=>modal.innerHTML=''; modal.querySelector('#clear').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);hasInk=false};
  modal.querySelector('#confirm').onclick=()=>{if(!hasInk){toast('Please add your signature first.');return;} signed[id]={at:new Date().toISOString(),signature:canvas.toDataURL()};localStorage.setItem('clockwise-signed',JSON.stringify(signed));render('payroll');toast(`${s.name} signed successfully.`)};
}

function exportCSV(){
  const rows=[['Staff','Role','Days present','Sick leave','Days off','Payable hours','Rate','Estimated pay','Signed'],...staff.map((s,i)=>{const sick=sickLeaves.filter(l=>l.staffId===s.id).reduce((n,l)=>n+l.days,0),paidSick=sickLeaves.filter(l=>l.staffId===s.id&&l.paid).reduce((n,l)=>n+l.days,0),d=21-(i%2)-sick,h=d*8+paidSick*8+(i===1?3.5:i===3?1.25:0);return[s.name,s.role,d,sick,4,h,s.rate,(h*s.rate).toFixed(2),signed[s.id]?'Yes':'No']})];
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='attendance-august-2026.csv';a.click();URL.revokeObjectURL(a.href);
}
function toast(msg){let t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2800)}
render();


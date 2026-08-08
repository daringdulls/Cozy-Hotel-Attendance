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
let dailyAttendance = JSON.parse(localStorage.getItem('clockwise-daily-attendance') || '{"2026-08-08":{"1":{"status":"Present","in":"09:02","out":"17:18"},"2":{"status":"Present","in":"08:54","out":"17:03"},"3":{"status":"Sick leave","in":"","out":""},"4":{"status":"Present","in":"08:45","out":"18:02"},"5":{"status":"Working","in":"09:00","out":""}}}');
let attendanceDate='2026-08-08', attendanceDepartment='All departments', timesheetDepartment='All departments';
let timesheets=JSON.parse(localStorage.getItem('clockwise-timesheets')||'{}');

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
          ${nav('dashboard','grid','Overview',view)}${nav('attendance','calendar','Attendance',view)}${nav('timesheet','calendar','Timesheets',view)}${nav('people','team','Staff',view)}${nav('register','report','Monthly register',view)}${nav('payroll','report','Payroll',view)}
        </nav>
        <div class="aside-bottom">
          <button class="nav-item">${icon('settings')}<span>Settings</span></button>
          <div class="profile"><span class="avatar small">DA</span><div><b>Demo Admin</b><small>Administrator</small></div><button aria-label="Profile menu">...</button></div>
        </div>
      </aside>
      <main>
        <header><button class="mobile-menu" aria-label="Open menu">&#9776;</button><div class="search">${icon('search')}<input aria-label="Search" placeholder="Search staff or records" /></div><button class="round" aria-label="Notifications">${icon('bell')}<em></em></button></header>
        ${view === 'payroll' ? payrollView() : view === 'register' ? registerView() : view === 'attendance' ? attendanceView() : view === 'timesheet' ? timesheetView() : view === 'people' ? staffView() : dashboardView()}
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
        <div class="card-head"><div><h2>Today's attendance</h2><p>Saturday, 08 August</p></div><button class="text-btn" data-view="attendance">View all ${icon('arrow')}</button></div>
        <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th></tr></thead><tbody>
        ${staff.map(s=>{const r=records[s.id], h=hours(r), sick=sickToday.has(s.id); return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td><td>${sick?'--':r[0]}</td><td>${sick?'--':(r[1]||'--')}</td><td>${sick?'--':(h?h.toFixed(1)+'h':'--')}</td><td>${sick?'<span class="pill sick">Sick leave</span>':s.id===5?'<span class="pill working">Working</span>':s.id===3?'<span class="pill late">Late</span>':'<span class="pill present">Present</span>'}</td></tr>`}).join('')}
        </tbody></table></div>
      </article>
      <aside class="side-stack">
        <article class="card schedule"><div class="card-head"><div><h2>Weekly schedule</h2><p>03 - 09 August</p></div></div>
          <div class="week"><div><b>Mon</b><span>03</span></div><div><b>Tue</b><span>04</span></div><div><b>Wed</b><span>05</span></div><div><b>Thu</b><span>06</span></div><div><b>Fri</b><span>07</span></div><div class="today"><b>Sat</b><span>08</span></div><div><b>Sun</b><span>09</span></div></div>
          <div class="off-list"><div><span class="avatar small" style="--avatar:#d87e5f">S1</span><p><b>Sample Staff 01</b><small>Day off  Friday</small></p><span class="tag">OFF</span></div><div><span class="avatar small" style="--avatar:#6e89a8">S4</span><p><b>Sample Staff 04</b><small>Day off  Thursday</small></p><span class="tag">OFF</span></div></div>
        </article>
        <article class="card payroll-nudge"><div class="nudge-icon">${icon('report')}</div><div><h3>August payroll</h3><p>${Object.keys(signed).length} of 5 staff have signed their attendance.</p><div class="progress"><i style="width:${Object.keys(signed).length*20}%"></i></div><button class="text-btn" data-view="payroll">Review monthly attendance ${icon('arrow')}</button></div></article>
      </aside>
    </div>
  </section>`;
}

function metric(label,value,sub,tone){return `<article class="metric"><div class="metric-top"><span>${label}</span><i class="dot ${tone}"></i></div><strong>${value}</strong><small>${sub}</small></article>`}

function minutesWorked(start,end,breakMins){if(!start||!end)return 0;const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);return Math.max(0,(eh*60+em)-(sh*60+sm)-Number(breakMins||0))}
function hoursLabel(mins){const sign=mins<0?'-':'';const n=Math.abs(Math.round(mins));return `${sign}${Math.floor(n/60)}h ${n%60}m`}
function timesheetView(){
  const week=['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07','2026-08-08','2026-08-09'];
  const labels=['Mon 03','Tue 04','Wed 05','Thu 06','Fri 07','Sat 08','Sun 09'];
  const departments=['All departments',...new Set(staff.map(s=>s.role))],shown=timesheetDepartment==='All departments'?staff:staff.filter(s=>s.role===timesheetDepartment);
  const defaultShift=(s,date,i)=>{const off=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(2026,7,3+i).getDay()]===s.off;return off?{off:true,in:'',out:'',break:0}:{off:false,in:i===5?'09:00':'08:30',out:i===5?'17:30':'17:00',break:30}};
  return `<section class="content timesheet-view"><div class="eyebrow">WEEKLY DETAIL</div><div class="title-row"><div><h1>Staff timesheets</h1><p>Actual office hours after deducting recorded break time.</p></div><button class="primary" id="saveTimesheets">Save timesheets</button></div><div class="filter-bar"><label>Week commencing<input type="date" value="2026-08-03" disabled></label><label>Department<select id="timesheetDepartment">${departments.map(d=>`<option ${d===timesheetDepartment?'selected':''}>${d}</option>`).join('')}</select></label><div class="filter-summary"><b>${shown.length}</b><span>staff shown</span></div></div><article class="card"><div class="timesheet-scroll"><table class="timesheet-table"><thead><tr><th class="ts-staff">Staff member</th>${labels.map(x=>`<th>${x}<small>In / Out / Break</small></th>`).join('')}<th class="ts-total">Worked</th><th class="ts-total">Contracted</th><th class="ts-total">Overtime</th></tr></thead><tbody>${shown.map(s=>{let total=0;const cells=week.map((date,i)=>{const shift=timesheets[date]?.[s.id]||defaultShift(s,date,i);const mins=shift.off?0:minutesWorked(shift.in,shift.out,shift.break);total+=mins;return `<td class="shift-cell ${shift.off?'shift-off':''}" data-shift data-staff="${s.id}" data-date="${date}">${shift.off?'<span class="off-label">Weekly off</span>':`<div class="time-pair"><label>IN<input class="shift-in" type="time" value="${shift.in}"></label><label>OUT<input class="shift-out" type="time" value="${shift.out}"></label></div><label class="break-input">Break <input class="shift-break" type="number" min="0" max="240" step="5" value="${shift.break}"> min</label><b class="day-total">${hoursLabel(mins)}</b>`}</td>`}).join('');const contracted=48*60,delta=total-contracted;return `<tr><td class="ts-staff"><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td>${cells}<td class="ts-total week-worked">${hoursLabel(total)}</td><td class="ts-total">48h 0m</td><td class="ts-total week-delta ${delta>=0?'positive':'negative'}">${hoursLabel(delta)}</td></tr>`}).join('')}</tbody></table></div></article><div class="timesheet-note"><b>How hours are calculated</b><span>Clock out - clock in - break = actual worked hours. Weekly target is 48 hours based on six 8-hour working days.</span></div></section>`;
}
function attendanceView(){
  const days=Array.from({length:31},(_,i)=>i+1);
  const departments=['All departments',...new Set(staff.map(s=>s.role))];
  const shown=attendanceDepartment==='All departments'?staff:staff.filter(s=>s.role===attendanceDepartment);
  const offIndex={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  const codeFor=(s,day)=>{const iso=`2026-08-${String(day).padStart(2,'0')}`,saved=dailyAttendance[iso]?.[s.id]?.status;if(saved)return {'Present':'P','Working':'P','Late':'L','Sick leave':'S','Weekly off':'O','Absent':'A','Not recorded':'-'}[saved]||'-';if(sickLeaves.some(l=>l.staffId===s.id&&l.date===iso))return 'S';return new Date(2026,7,day).getDay()===offIndex[s.off]?'O':'P'};
  const options=['P','S','L','A','O','-'];
  return `<section class="content attendance-matrix-view"><div class="eyebrow">EDITABLE MONTHLY ATTENDANCE</div><div class="title-row"><div><h1>August 2026 attendance</h1><p>Select any daily cell to update attendance, then save the register.</p></div><button class="primary" id="saveAttendance">Save monthly attendance</button></div><div class="filter-bar"><label>Department<select id="attendanceDepartment">${departments.map(d=>`<option ${d===attendanceDepartment?'selected':''}>${d}</option>`).join('')}</select></label><div class="filter-summary"><b>${shown.length}</b><span>staff shown</span></div><div class="edit-hint">Click a code to change it</div></div><article class="register-sheet editable-sheet"><div class="sheet-heading"><div><span class="sheet-mark"><i></i><i></i><i></i></span><div><h2>COZY HOTEL</h2><p>Editable staff monthly attendance</p></div></div><dl><div><dt>Month</dt><dd>August 2026</dd></div><div><dt>Department</dt><dd>${attendanceDepartment}</dd></div><div><dt>Working day</dt><dd>8 hours</dd></div></dl></div><div class="register-scroll"><table class="matrix editable-matrix"><thead><tr><th class="staff-col">Staff member</th>${days.map(d=>`<th><b>${d}</b><small>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(2026,7,d).getDay()]}</small></th>`).join('')}<th class="total-col">P</th><th class="total-col">S</th><th class="total-col">O</th><th class="signature-col">Staff signature</th></tr></thead><tbody>${shown.map(s=>{const codes=days.map(d=>codeFor(s,d));return `<tr><td class="staff-col"><b>${s.name}</b><small>${s.role}</small></td>${days.map((d,i)=>{const iso=`2026-08-${String(d).padStart(2,'0')}`,c=codes[i];return `<td><select aria-label="${s.name}, August ${d}" class="matrix-select code-${c.toLowerCase()}" data-staff="${s.id}" data-date="${iso}">${options.map(o=>`<option ${o===c?'selected':''}>${o}</option>`).join('')}</select></td>`}).join('')}<td class="total-col row-p">${codes.filter(c=>c==='P').length}</td><td class="total-col row-s">${codes.filter(c=>c==='S').length}</td><td class="total-col row-o">${codes.filter(c=>c==='O').length}</td><td class="signature-col">${signed[s.id]?'<span class="signed-inline">Signed</span>':'<span class="signature-line"></span>'}</td></tr>`}).join('')}</tbody></table></div><div class="register-legend"><b>Codes</b><span><i class="code-p">P</i> Present</span><span><i class="code-s">S</i> Sick leave</span><span><i class="code-l">L</i> Late</span><span><i class="code-a">A</i> Absent</span><span><i class="code-o">O</i> Weekly off</span><span><i>-</i> Not recorded</span></div></article></section>`;
}

function staffView(){
  return `<section class="content management-view"><div class="eyebrow">TEAM DIRECTORY</div><div class="title-row"><div><h1>Staff</h1><p>Department assignments, work rules, and month-end approval status.</p></div><button class="primary" id="addStaff">${icon('plus')} Add staff member</button></div><div class="metrics staff-metrics">${metric('Total staff',String(staff.length),'active employees','up')}${metric('Departments',String(new Set(staff.map(s=>s.role)).size),'operational teams','neutral')}${metric('Standard day','8 hours','per staff member','neutral')}${metric('Signed this month',`${Object.keys(signed).length} / ${staff.length}`,'payroll approvals','up')}</div><article class="card"><div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Department</th><th>Weekly day off</th><th>Hourly rate</th><th>August sick leave</th><th>Month-end signature</th></tr></thead><tbody>${staff.map(s=>{const sick=sickLeaves.filter(l=>l.staffId===s.id).reduce((n,l)=>n+l.days,0);return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>Staff ID: CH-${String(s.id).padStart(3,'0')}</small></div></div></td><td>${s.role}</td><td>${s.off}</td><td>MVR ${s.rate.toFixed(2)}</td><td>${sick} day${sick===1?'':'s'}</td><td>${signed[s.id]?'<span class="signed">Signed</span>':'<span class="pending-sign">Pending</span>'}</td></tr>`}).join('')}</tbody></table></div></article></section>`;
}
function registerView(department='All departments'){
  const days=Array.from({length:31},(_,i)=>i+1);
  const departments=['All departments',...new Set(staff.map(s=>s.role))];
  const shown=department==='All departments'?staff:staff.filter(s=>s.role===department);
  const offIndex={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  const status=(s,day)=>{
    const iso=`2026-08-${String(day).padStart(2,'0')}`;
    const saved=dailyAttendance[iso]?.[s.id]?.status;
    if(saved){return {'Present':'P','Working':'P','Late':'L','Sick leave':'S','Weekly off':'O','Absent':'A','Not recorded':'-'}[saved]||'-'}
    if(sickLeaves.some(l=>l.staffId===s.id&&l.date===iso)) return 'S';
    if(new Date(2026,7,day).getDay()===offIndex[s.off]) return 'O';
    return 'P';
  };
  return `<section class="content register-view"><div class="register-toolbar no-print"><div><div class="eyebrow">MONTHLY ATTENDANCE REGISTER</div><h1>August 2026</h1><p>Department register with daily status and month-end signatures.</p></div><div class="register-actions"><label>Department<select id="departmentFilter">${departments.map(d=>`<option ${d===department?'selected':''}>${d}</option>`).join('')}</select></label><button class="primary" id="printRegister">Print / Save PDF</button></div></div>
  <article class="register-sheet"><div class="sheet-heading"><div><span class="sheet-mark"><i></i><i></i><i></i></span><div><h2>COZY HOTEL</h2><p>Staff monthly attendance register</p></div></div><dl><div><dt>Month</dt><dd>August 2026</dd></div><div><dt>Department</dt><dd>${department}</dd></div><div><dt>Working day</dt><dd>8 hours</dd></div></dl></div>
  <div class="register-scroll"><table class="matrix"><thead><tr><th class="staff-col">Staff member</th>${days.map(d=>`<th><b>${d}</b><small>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(2026,7,d).getDay()]}</small></th>`).join('')}<th class="total-col">P</th><th class="total-col">S</th><th class="total-col">O</th><th class="signature-col">Staff signature</th></tr></thead><tbody>${shown.map(s=>{const codes=days.map(d=>status(s,d));return `<tr><td class="staff-col"><b>${s.name}</b><small>${s.role}</small></td>${codes.map(c=>`<td><span class="code code-${c.toLowerCase()}">${c}</span></td>`).join('')}<td class="total-col">${codes.filter(c=>c==='P').length}</td><td class="total-col">${codes.filter(c=>c==='S').length}</td><td class="total-col">${codes.filter(c=>c==='O').length}</td><td class="signature-col">${signed[s.id]?'<span class="signed-inline">Signed</span>':'<span class="signature-line"></span>'}</td></tr>`}).join('')}</tbody></table></div>
  <div class="register-legend"><b>Codes</b><span><i class="code-p">P</i> Present</span><span><i class="code-s">S</i> Sick leave</span><span><i class="code-l">L</i> Late</span><span><i class="code-a">A</i> Absent</span><span><i class="code-o">O</i> Weekly off</span></div>
  <div class="sheet-approvals"><div><span></span><b>Department head</b><small>Name, signature & date</small></div><div><span></span><b>HR / Administration</b><small>Name, signature & date</small></div><div><span></span><b>Payroll verified by</b><small>Name, signature & date</small></div></div></article></section>`;
}
function payrollView(){
  const signedCount=Object.keys(signed).length;
  return `<section class="content payroll-view"><div class="eyebrow">AUGUST 2026 - PAYROLL CYCLE</div><div class="title-row"><div><h1>Attendance sign-off</h1><p>Every staff member must confirm their monthly attendance before payroll runs.</p></div><button class="primary ${signedCount<5?'disabled':''}" ${signedCount<5?'disabled':''}>Run payroll</button></div>
  <div class="approval-banner"><div class="ring" style="--p:${signedCount*72}deg"><span>${signedCount}/5</span></div><div><h2>${signedCount===5?'Ready for payroll':'Waiting for staff signatures'}</h2><p>${5-signedCount} signature${5-signedCount===1?'':'s'} remaining  Deadline 31 August, 6:00 PM</p></div><div class="legend"><span><i class="green"></i>Signed</span><span><i></i>Pending</span></div></div>
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
  document.querySelector('#attendanceDate')?.addEventListener('change',e=>{attendanceDate=e.target.value;render('attendance')});
  document.querySelector('#attendanceDepartment')?.addEventListener('change',e=>{attendanceDepartment=e.target.value;render('attendance')});
  document.querySelector('#timesheetDepartment')?.addEventListener('change',e=>{timesheetDepartment=e.target.value;render('timesheet')});
  document.querySelectorAll('[data-shift] input').forEach(input=>input.addEventListener('input',()=>{const cell=input.closest('[data-shift]'),mins=minutesWorked(cell.querySelector('.shift-in').value,cell.querySelector('.shift-out').value,cell.querySelector('.shift-break').value);cell.querySelector('.day-total').textContent=hoursLabel(mins);const row=cell.closest('tr'),total=[...row.querySelectorAll('[data-shift]:not(.shift-off)')].reduce((n,c)=>n+minutesWorked(c.querySelector('.shift-in').value,c.querySelector('.shift-out').value,c.querySelector('.shift-break').value),0);row.querySelector('.week-worked').textContent=hoursLabel(total);const delta=total-2880,d=row.querySelector('.week-delta');d.textContent=hoursLabel(delta);d.className=`ts-total week-delta ${delta>=0?'positive':'negative'}`}));
  document.querySelector('#saveTimesheets')?.addEventListener('click',()=>{document.querySelectorAll('[data-shift]:not(.shift-off)').forEach(cell=>{timesheets[cell.dataset.date]||={};timesheets[cell.dataset.date][cell.dataset.staff]={in:cell.querySelector('.shift-in').value,out:cell.querySelector('.shift-out').value,break:Number(cell.querySelector('.shift-break').value),off:false}});localStorage.setItem('clockwise-timesheets',JSON.stringify(timesheets));toast('Timesheets saved successfully.')});
  document.querySelectorAll('.matrix-select').forEach(cell=>cell.addEventListener('change',()=>{cell.className=`matrix-select code-${cell.value.toLowerCase()}`;const row=cell.closest('tr'),codes=[...row.querySelectorAll('.matrix-select')].map(x=>x.value);row.querySelector('.row-p').textContent=codes.filter(x=>x==='P').length;row.querySelector('.row-s').textContent=codes.filter(x=>x==='S').length;row.querySelector('.row-o').textContent=codes.filter(x=>x==='O').length}));
  document.querySelector('#saveAttendance')?.addEventListener('click',()=>{const statusMap={P:'Present',S:'Sick leave',L:'Late',A:'Absent',O:'Weekly off','-':'Not recorded'};document.querySelectorAll('.matrix-select').forEach(cell=>{dailyAttendance[cell.dataset.date] ||= {};const previous=dailyAttendance[cell.dataset.date][cell.dataset.staff]||{};dailyAttendance[cell.dataset.date][cell.dataset.staff]={...previous,status:statusMap[cell.value]}});localStorage.setItem('clockwise-daily-attendance',JSON.stringify(dailyAttendance));toast('Monthly attendance saved successfully.')});
  document.querySelector('#departmentFilter')?.addEventListener('change',e=>{document.querySelector('main').innerHTML=`<header><button class="mobile-menu" aria-label="Open menu">&#9776;</button><div class="search">${icon('search')}<input aria-label="Search" placeholder="Search staff or records" /></div><button class="round" aria-label="Notifications">${icon('bell')}<em></em></button></header>${registerView(e.target.value)}`;bind()});
  document.querySelectorAll('[data-sign]').forEach(b=>b.onclick=()=>openSignature(Number(b.dataset.sign)));
  document.querySelector('.mobile-menu')?.addEventListener('click',()=>document.querySelector('.shell').classList.toggle('menu-open'));
}

function openSickLeave(){
  const modal=document.querySelector('#modal');
  modal.innerHTML=`<div class="modal-backdrop"><form class="dialog sick-dialog"><button type="button" class="close" aria-label="Close">&times;</button><div class="seal sick-seal">+</div><h2>Record sick leave</h2><p>Add a medical absence to attendance and the monthly payroll summary.</p><label for="sickStaff">Staff member</label><select id="sickStaff" required>${staff.map(s=>`<option value="${s.id}">${s.name} - ${s.role}</option>`).join('')}</select><div class="form-grid"><div><label for="sickDate">Start date</label><input id="sickDate" type="date" value="2026-08-08" required></div><div><label for="sickDays">Number of days</label><input id="sickDays" type="number" min="1" max="30" value="1" required></div></div><label for="sickNote">Note</label><textarea id="sickNote" rows="3" placeholder="Medical certificate or internal note"></textarea><label class="check-row"><input id="sickPaid" type="checkbox" checked> Include as paid sick leave</label><div class="dialog-actions"><button type="button" class="secondary cancel">Cancel</button><button class="primary">Save sick leave</button></div></form></div>`;
  const close=()=>modal.innerHTML=''; modal.querySelector('.close').onclick=close; modal.querySelector('.cancel').onclick=close;
  modal.querySelector('form').onsubmit=e=>{e.preventDefault();sickLeaves.push({staffId:Number(modal.querySelector('#sickStaff').value),date:modal.querySelector('#sickDate').value,days:Number(modal.querySelector('#sickDays').value),paid:modal.querySelector('#sickPaid').checked,note:modal.querySelector('#sickNote').value.trim()});localStorage.setItem('clockwise-sick-leaves',JSON.stringify(sickLeaves));render();toast('Sick leave recorded successfully.')};
}
function openSignature(id){
  selected=id; const s=staff.find(x=>x.id===id); const modal=document.querySelector('#modal');
  modal.innerHTML=`<div class="modal-backdrop"><div class="dialog"><button class="close" aria-label="Close">&times;</button><div class="seal">${icon('check')}</div><h2>Confirm monthly attendance</h2><p>I, <b>${s.name}</b>, confirm that the attendance and hours shown for August 2026 are correct.</p><label>Draw signature</label><canvas width="560" height="170"></canvas><small class="hint">Use your mouse or finger to sign in the box.</small><div class="dialog-actions"><button class="secondary" id="clear">Clear</button><button class="primary" id="confirm">Sign & confirm</button></div></div></div>`;
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


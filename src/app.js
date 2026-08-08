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

const app = document.querySelector('#app');
const icon = (name) => ({ grid:'â–¦', team:'â™™', calendar:'â–¤', report:'â—«', settings:'âš™', bell:'â—Œ', search:'âŒ•', plus:'ï¼‹', arrow:'â†’', check:'âœ“' }[name]);

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
          ${nav('dashboard','grid','Overview',view)}${nav('attendance','calendar','Attendance',view)}${nav('people','team','Staff',view)}${nav('payroll','report','Payroll',view)}
        </nav>
        <div class="aside-bottom">
          <button class="nav-item">${icon('settings')}<span>Settings</span></button>
          <div class="profile"><span class="avatar small">DA</span><div><b>Demo Admin</b><small>Administrator</small></div><button>â€¢â€¢â€¢</button></div>
        </div>
      </aside>
      <main>
        <header><button class="mobile-menu" aria-label="Open menu">â˜°</button><div class="search">${icon('search')}<input aria-label="Search" placeholder="Search staff or records" /></div><button class="round" aria-label="Notifications">${icon('bell')}<em></em></button></header>
        ${view === 'payroll' ? payrollView() : dashboardView()}
      </main>
    </div>
    <div id="modal"></div>`;
  bind();
}

function nav(id,ico,label,current){ return `<button class="nav-item ${id===current?'active':''}" data-view="${id}"><span>${icon(ico)}</span>${label}</button>`; }

function dashboardView(){
  return `<section class="content">
    <div class="eyebrow">SATURDAY, 08 AUGUST</div>
    <div class="title-row"><div><h1>Good morning.</h1><p>Hereâ€™s how your team is doing today.</p></div><button class="primary" id="addStaff">${icon('plus')} Add staff member</button></div>
    <div class="metrics">
      ${metric('Todayâ€™s attendance','4 / 5','80% present','up')}
      ${metric('On time','3','1 late arrival','warn')}
      ${metric('Hours logged','34h 27m','of 40h scheduled','neutral')}
      ${metric('Payroll status','In progress','5 days remaining','neutral')}
    </div>
    <div class="grid-two">
      <article class="card attendance-card">
        <div class="card-head"><div><h2>Todayâ€™s attendance</h2><p>Saturday, 08 August</p></div><button class="text-btn" data-view="attendance">View all ${icon('arrow')}</button></div>
        <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th></tr></thead><tbody>
        ${staff.map(s=>{const r=records[s.id], h=hours(r); return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td><td>${r[0]}</td><td>${r[1]||'â€”'}</td><td>${h?h.toFixed(1)+'h':'â€”'}</td><td>${s.id===5?'<span class="pill working">Working</span>':s.id===3?'<span class="pill late">Late</span>':'<span class="pill present">Present</span>'}</td></tr>`}).join('')}
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

function payrollView(){
  const signedCount=Object.keys(signed).length;
  return `<section class="content payroll-view"><div class="eyebrow">AUGUST 2026 Â· PAYROLL CYCLE</div><div class="title-row"><div><h1>Attendance sign-off</h1><p>Every staff member must confirm their monthly attendance before payroll runs.</p></div><button class="primary ${signedCount<5?'disabled':''}" ${signedCount<5?'disabled':''}>Run payroll</button></div>
  <div class="approval-banner"><div class="ring" style="--p:${signedCount*72}deg"><span>${signedCount}/5</span></div><div><h2>${signedCount===5?'Ready for payroll':'Waiting for staff signatures'}</h2><p>${5-signedCount} signature${5-signedCount===1?'':'s'} remaining Â· Deadline 31 August, 6:00 PM</p></div><div class="legend"><span><i class="green"></i>Signed</span><span><i></i>Pending</span></div></div>
  <article class="card"><div class="card-head"><div><h2>Monthly attendance summary</h2><p>Calculated on 8 working hours per day and one weekly day off.</p></div><button class="secondary" id="exportBtn">Export summary</button></div>
  <div class="table-wrap"><table><thead><tr><th>Staff member</th><th>Days present</th><th>Days off</th><th>Hours</th><th>Estimated pay</th><th>Approval</th></tr></thead><tbody>
  ${staff.map((s,i)=>{const days=21-(i%2), hrs=days*8+(i===1?3.5:i===3?1.25:0); return `<tr><td><div class="person"><span class="avatar" style="--avatar:${s.color}">${s.initials}</span><div><b>${s.name}</b><small>${s.role}</small></div></div></td><td>${days}</td><td>4</td><td>${hrs.toFixed(1)}h</td><td>MVR ${(hrs*s.rate).toLocaleString()}</td><td>${signed[s.id]?`<span class="signed">${icon('check')} Signed</span>`:`<button class="sign-btn" data-sign="${s.id}">Request signature</button>`}</td></tr>`}).join('')}
  </tbody></table></div></article></section>`;
}

function bind(){
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view==='payroll'?'payroll':'dashboard'));
  document.querySelector('#addStaff')?.addEventListener('click',()=>toast('Staff invitation form is ready for connection.'));
  document.querySelector('#exportBtn')?.addEventListener('click',exportCSV);
  document.querySelectorAll('[data-sign]').forEach(b=>b.onclick=()=>openSignature(Number(b.dataset.sign)));
  document.querySelector('.mobile-menu')?.addEventListener('click',()=>document.querySelector('.shell').classList.toggle('menu-open'));
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
  const rows=[['Staff','Role','Days present','Days off','Hours','Rate','Estimated pay','Signed'],...staff.map((s,i)=>{const d=21-(i%2),h=d*8+(i===1?3.5:i===3?1.25:0);return[s.name,s.role,d,4,h,s.rate,(h*s.rate).toFixed(2),signed[s.id]?'Yes':'No']})];
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='attendance-august-2026.csv';a.click();URL.revokeObjectURL(a.href);
}
function toast(msg){let t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2800)}
render();


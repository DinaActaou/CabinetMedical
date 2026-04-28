
const mockUsers = [
  { initials: 'JM', name: 'Dr. Ayman', role: 'Cardiologist', email: 'ayman@medical.com', phone: '+212 6 23 45 67 89' },
  { initials: 'SB', name: 'Dr. Sami', role: 'General Practitioner', email: 'sami@medical.com', phone: '+212 6 23 45 67 90' },
  { initials: 'CL', name: 'Dr. Lina', role: 'Orthopedic Surgeon', email: 'lina@medical.com', phone: '+212 6 23 45 67 91' },
  { initials: 'MD', name: 'Dr. Chada', role: 'Pediatrician', email: 'chada@medical.com', phone: '+212 6 23 45 67 92' }
];

const mockServices = [
  { icon: 'heart', title: 'Cardiology', desc: 'Heart health monitoring and cardiovascular disease treatment', bg: 'cardiology-bg' },
  { icon: 'stethoscope', title: 'General Medicine', desc: 'Comprehensive health checkups and routine medical care', bg: 'medicine-bg' },
  { icon: 'brain', title: 'Neurology', desc: 'Diagnosis and treatment of nervous system disorders', bg: 'neurology-bg' },
  { icon: 'bone', title: 'Orthopedics', desc: 'Bone, joint, and musculoskeletal system treatment', bg: 'ortho-bg' },
  { icon: 'baby', title: 'Pediatrics', desc: 'Specialized medical care for infants, children, and adolescents', bg: 'pediatrics-bg' },
  { icon: 'eye', title: 'Ophthalmology', desc: 'Eye care and vision correction services', bg: 'ophthalmology-bg' },
  { icon: 'droplet', title: 'Dermatology', desc: 'Skin, hair, and nail care and treatment', bg: 'derma-bg' },
  { icon: 'pill', title: 'Pharmacy', desc: 'Prescription management and medication consultation', bg: 'pharmacy-bg' }
];

const mockAppointments = [
  { patient: 'Marie Dubois', doc: 'Dr. Jean Martin', service: 'Cardiology', date: '2026-04-23', time: '09:00 AM', status: 'Confirmed', badge: 'success' },
  { patient: 'Pierre Laurent', doc: 'Dr. Sophie Bernard', service: 'General Checkup', date: '2026-04-23', time: '10:30 AM', status: 'Pending', badge: 'warning' },
  { patient: 'Anne Petit', doc: 'Dr. Jean Martin', service: 'Dermatology', date: '2026-04-23', time: '11:00 AM', status: 'Confirmed', badge: 'success' },
  { patient: 'Lucas Moreau', doc: 'Dr. Claire Leroy', service: 'Orthopedics', date: '2026-04-24', time: '14:00 PM', status: 'Pending', badge: 'warning' },
  { patient: 'Emma Bernard', doc: 'Dr. Sophie Bernard', service: 'Pediatrics', date: '2026-04-24', time: '15:30 PM', status: 'Confirmed', badge: 'success' }
];

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  
 
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
    
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      link.classList.add('active');
      
      const target = link.getAttribute('data-target');
      if (target) {
        document.querySelectorAll('.dashboard-page').forEach(page => page.classList.add('hidden'));
        document.getElementById(`${target}-content`)?.classList.remove('hidden');
      }
    });
  });


  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      document.getElementById(modalId)?.classList.add('active');
    });
  });

  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('active');
    });
  });


  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  
  renderDashboardList();
  renderAppointmentsTable();
  renderServices();
  renderUsers();
});

function renderDashboardList() {
  const container = document.getElementById('dashboard-today-list');
  if(!container) return;
  container.innerHTML = mockAppointments.slice(0, 3).map(app => `
    <div class="list-item">
      <div class="list-item-left">
        <div class="list-patient-avatar"><i data-lucide="user" style="width:20px;height:20px;"></i></div>
        <div>
          <div style="font-weight:600; font-size:0.875rem; color:var(--text-main); margin-bottom:0.1rem;">${app.patient}</div>
          <div style="font-size:0.75rem; color:var(--text-body);">${app.service}</div>
        </div>
      </div>
      <div class="list-item-right" style="gap:2rem;">
        <div style="text-align:right;">
          <div style="font-weight:500; font-size:0.875rem; color:var(--text-main);"><i data-lucide="stethoscope" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:0.25rem;"></i>${app.doc}</div>
          <div style="font-size:0.75rem; color:var(--text-body);"><i data-lucide="clock" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:0.25rem;"></i>${app.time}</div>
        </div>
        <span class="badge badge-${app.badge}">
          ${app.status === 'Confirmed' ? 'Confirmed' : 'Pending'}
        </span>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function renderAppointmentsTable() {
  const tbody = document.getElementById('tbody-appointments');
  if(!tbody) return;
  tbody.innerHTML = mockAppointments.map(app => `
    <tr>
      <td style="font-weight:500; color:var(--text-main);">${app.patient}</td>
      <td>${app.doc}</td>
      <td>${app.service}</td>
      <td>${app.date} at ${app.time}</td>
      <td><span class="badge badge-${app.badge}">${app.status}</span></td>
      <td class="text-right">
        <button class="btn-icon"><i data-lucide="pencil" style="width:16px;height:16px"></i></button>
        <button class="btn-icon delete"><i data-lucide="trash-2" style="width:16px;height:16px;color:#EF4444"></i></button>
      </td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function renderServices() {
  const grid = document.getElementById('services-grid');
  if(!grid) return;
  grid.innerHTML = mockServices.map(s => `
    <div class="grid-card">
      <div class="service-icon-circle ${s.bg}">
        <i data-lucide="${s.icon}" style="width:24px;height:24px;"></i>
      </div>
      <h3 style="font-size:1.125rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-main);">${s.title}</h3>
      <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5;">${s.desc}</p>
    </div>
  `).join('');
  lucide.createIcons();
}

function renderUsers() {
  const grid = document.getElementById('users-grid');
  if(!grid) return;
  grid.innerHTML = mockUsers.map(u => `
    <div class="grid-card user-card">
      <div class="user-avatar-lg">${u.initials}</div>
      <div class="user-info">
        <h3 style="font-size:1rem; font-weight:600; color:var(--text-main);">${u.name}</h3>
        <p><i data-lucide="shield" style="width:14px;height:14px"></i> ${u.role}</p>
        <p><i data-lucide="mail" style="width:14px;height:14px"></i> ${u.email}</p>
        <p><i data-lucide="phone" style="width:14px;height:14px"></i> ${u.phone}</p>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function saveAppointment(e) {
  e.preventDefault();
  document.getElementById('modal-appointment').classList.remove('active');
  alert('New appointment saved!');
}

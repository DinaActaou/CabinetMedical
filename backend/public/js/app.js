// === API CONFIG ===
const API_BASE_URL = '/api';

// === STATE ===
let currentUser = null;
let token = localStorage.getItem('auth_token');
let currentLang = (document.documentElement.lang || 'en').substring(0, 2);

// Booking State
let bookingData = { serviceId: null, doctorId: null, date: null, time: null };

// === AXIOS CONFIG ===
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            if (!error.config.url.includes('/logout')) logout();
        }
        return Promise.reject(error);
    }
);

async function apiFetch(endpoint, options = {}) {
    const config = {
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : null,
        params: options.params || null
    };
    const response = await axios(config);
    return response.data;
}

function t(key) {
    if (!window.translations || !window.translations[currentLang]) return key;
    return window.translations[currentLang][key] || key;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Avatar Helpers
function getGenderedAvatar(gender, index) {
    const type = (gender === 'female' || gender === 'girl') ? 'women' : 'men';
    const id = type === 'women' ? (index + 20) : (index + 30);
    return `https://randomuser.me/api/portraits/med/${type}/${id}.jpg`;
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        lucide.createIcons();
        if (!token) {
            showLogin();
        } else {
            currentUser = await apiFetch('/user');
            if (currentUser) {
                showDashboard();
                loadInitialData();
            } else {
                showLogin();
            }
        }
    } catch (err) {
        console.error('Initialization error:', err);
        showLogin();
    } finally {
        setupEventListeners();
    }
}

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-item');
        if (!link || link.id === 'btn-logout') return;
        e.preventDefault();
        const target = link.getAttribute('data-target');
        if (target) switchScreen(target);
    });

    const searchInput = document.getElementById('search-appointments');
    if (searchInput) {
        const debouncedSearch = debounce((query) => loadAppointments(query), 300);
        searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }

    document.getElementById('form-login')?.addEventListener('submit', handleLogin);
    document.getElementById('form-register')?.addEventListener('submit', handleRegister);
    
    document.getElementById('link-to-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('screen-login').classList.add('hidden');
        document.getElementById('screen-register').classList.remove('hidden');
    });
    
    document.getElementById('link-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('screen-register').classList.add('hidden');
        document.getElementById('screen-login').classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-logout') || e.target.closest('#btn-logout-header')) logout();
    });

    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                if (modalId === 'modal-appointment') {
                    resetAppointmentModal();
                    prepareAppointmentModal();
                }
                modal.classList.add('active');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal-close') || e.target.closest('.modal-cancel')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        }
    });

    document.getElementById('form-appointment')?.addEventListener('submit', handleSaveAppointment);

    const notifTrigger = document.getElementById('notification-trigger');
    const notifPanel = document.getElementById('notifications-panel');
    if (notifTrigger && notifPanel) {
        notifTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!notifPanel.contains(e.target) && !notifTrigger.contains(e.target)) {
                notifPanel.classList.remove('active');
            }
        });
    }
}

function switchScreen(target) {
    if (!currentUser) return;

    if (currentUser.role === 'patient') {
        const allowed = ['screen-patient-home', 'screen-appointments', 'screen-settings', 'screen-book-appointment'];
        if (!allowed.includes(target)) target = 'screen-patient-home';
    } else if (currentUser.role === 'doctor') {
        const allowed = ['screen-dashboard', 'screen-appointments', 'screen-doctor-patients', 'screen-settings'];
        if (!allowed.includes(target)) target = 'screen-dashboard';
    }

    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.getAttribute('data-target') === target);
    });
    
    document.querySelectorAll('.dashboard-page').forEach(page => page.classList.add('hidden'));
    const targetEl = document.getElementById(`${target}-content`);
    if (targetEl) {
        targetEl.classList.remove('hidden');
        localStorage.setItem('active_screen', target);
        
        if (target === 'screen-dashboard') loadDashboardStats();
        if (target === 'screen-patient-home') loadPatientHome();
        if (target === 'screen-appointments') loadAppointments();
        if (target === 'screen-services') loadServices();
        if (target === 'screen-users') loadUsers();
        if (target === 'screen-book-appointment') initBookingProcess();
        if (target === 'screen-doctor-patients') loadDoctorPatients();
    }
}

function showPortalSelection() {
    document.getElementById('screen-portal-selection').classList.remove('hidden');
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.add('hidden');
}

function showRoleRegister(role) {
    document.getElementById('screen-portal-selection').classList.add('hidden');
    document.getElementById('screen-register').classList.remove('hidden');
    
    const roleSelect = document.getElementById('reg-role');
    if (roleSelect) {
        roleSelect.value = role;
    }
}

function showRoleLogin(role) {
    document.getElementById('screen-portal-selection').classList.add('hidden');
    document.getElementById('screen-login').classList.remove('hidden');
    
    const title = document.getElementById('login-role-title');
    const emailInput = document.getElementById('login-email');
    
    if (role === 'admin') {
        title.textContent = t('Administrator Login');
        emailInput.value = 'admin@medibook.com';
    } else {
        title.textContent = t(role.charAt(0).toUpperCase() + role.slice(1) + ' Login');
    }
}

function showLogin() {
    showPortalSelection();
}

function updateSidebarLinks() {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    let links = '';
    if (currentUser.role === 'doctor') {
        links = `
            <a href="#" data-target="screen-dashboard" class="nav-item">
              <i data-lucide="layout-grid" style="width: 18px; height: 18px;"></i> <span>${t('Dashboard')}</span>
            </a>
            <a href="#" data-target="screen-appointments" class="nav-item">
              <i data-lucide="calendar" style="width: 18px; height: 18px;"></i> <span>${t('My Appointments')}</span>
            </a>
            <a href="#" data-target="screen-doctor-patients" class="nav-item">
              <i data-lucide="users" style="width: 18px; height: 18px;"></i> <span>${t('My Patients')}</span>
            </a>
            <a href="#" data-target="screen-settings" class="nav-item">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i> <span>${t('My Profile')}</span>
            </a>
        `;
    } else {
        links = `
            <a href="#" data-target="screen-dashboard" class="nav-item">
              <i data-lucide="layout-grid" style="width: 18px; height: 18px;"></i> <span>${t('Dashboard')}</span>
            </a>
            <a href="#" data-target="screen-appointments" class="nav-item">
              <i data-lucide="calendar" style="width: 18px; height: 18px;"></i> <span>${t('Appointments')}</span>
            </a>
            <a href="#" data-target="screen-services" class="nav-item">
              <i data-lucide="stethoscope" style="width: 18px; height: 18px;"></i> <span>${t('Services')}</span>
            </a>
            <a href="#" data-target="screen-users" class="nav-item">
              <i data-lucide="users" style="width: 18px; height: 18px;"></i> <span>${t('Users')}</span>
            </a>
            <a href="#" data-target="screen-settings" class="nav-item">
              <i data-lucide="settings" style="width: 18px; height: 18px;"></i> <span>${t('Settings')}</span>
            </a>
        `;
    }

    sidebarNav.innerHTML = links;
    lucide.createIcons();
}

function showDashboard() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('screen-portal-selection').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.remove('hidden');
    
    updateSidebarLinks();

    if (currentUser.role === 'patient') {
        document.body.classList.add('is-patient');
        document.body.classList.remove('is-doctor');
        document.getElementById('patient-welcome-name').textContent = currentUser.name.split(' ')[0];
        document.getElementById('patient-appointments-list').classList.remove('hidden');
        document.getElementById('admin-appointments-table').classList.add('hidden');
        
        let target = localStorage.getItem('active_screen') || 'screen-patient-home';
        if (target === 'screen-dashboard' || target === 'screen-portal-selection') target = 'screen-patient-home';
        switchScreen(target);
    } else if (currentUser.role === 'doctor') {
        document.body.classList.add('is-doctor');
        document.body.classList.remove('is-patient');
        document.getElementById('dashboard-welcome-text').textContent = `${t('Welcome back, Dr.')} ${currentUser.name}`;
        document.getElementById('patient-appointments-list').classList.add('hidden');
        document.getElementById('admin-appointments-table').classList.remove('hidden');
        
        const headerAvatar = document.getElementById('current-user-avatar');
        if (headerAvatar) {
            headerAvatar.innerHTML = `<img src="${getGenderedAvatar(currentUser.gender, currentUser.id)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            headerAvatar.classList.add('has-img');
        }
        
        let target = localStorage.getItem('active_screen') || 'screen-dashboard';
        if (target === 'screen-patient-home' || target === 'screen-portal-selection') target = 'screen-dashboard';
        switchScreen(target);
    } else {
        document.body.classList.remove('is-patient', 'is-doctor');
        document.getElementById('dashboard-welcome-text').textContent = t('Welcome back!');
        document.getElementById('patient-appointments-list').classList.add('hidden');
        document.getElementById('admin-appointments-table').classList.remove('hidden');
        switchScreen(localStorage.getItem('active_screen') || 'screen-dashboard');
    }
    
    if (currentUser) {
        document.getElementById('current-user-name').textContent = currentUser.name;
        
        if (document.getElementById('settings-name')) document.getElementById('settings-name').value = currentUser.name;
        if (document.getElementById('settings-email')) document.getElementById('settings-email').value = currentUser.email;
        if (document.getElementById('profile-name-title')) document.getElementById('profile-name-title').textContent = currentUser.name;
        if (document.getElementById('profile-role-title')) document.getElementById('profile-role-title').textContent = t(currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1));
        
        const settingsAvatar = document.getElementById('settings-avatar-placeholder');
        if (settingsAvatar) {
            const avatarImg = getGenderedAvatar(currentUser.gender, currentUser.id);
            settingsAvatar.innerHTML = `<img src="${avatarImg}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (data && data.access_token) {
            token = data.access_token;
            localStorage.setItem('auth_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            currentUser = data.user;
            localStorage.removeItem('active_screen');
            showToast(t('Login successful'));
            setTimeout(() => window.location.reload(), 500);
        }
    } catch (err) { alert('Login failed: ' + (err.response?.data?.message || err.message)); }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;
    const password_confirmation = document.getElementById('reg-password-confirm').value;
    if (password !== password_confirmation) { alert(t('pass_mismatch')); return; }
    try {
        const data = await apiFetch('/register', { method: 'POST', body: JSON.stringify({ name, email, role, password, password_confirmation }) });
        if (data && data.access_token) {
            token = data.access_token;
            localStorage.setItem('auth_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            currentUser = data.user;
            localStorage.removeItem('active_screen');
            showToast(t('Registration successful'));
            setTimeout(() => window.location.reload(), 500);
        }
    } catch (err) { alert('Registration failed: ' + (err.response?.data?.message || err.message)); }
}

async function logout() {
    try { await apiFetch('/logout', { method: 'POST' }); }
    catch (err) { console.error('Logout error:', err); }
    finally {
        token = null; currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('active_screen');
        delete axios.defaults.headers.common['Authorization'];
        showLogin();
        window.location.reload();
    }
}

function loadInitialData() {
    if (currentUser && currentUser.role === 'patient') loadPatientHome();
    else loadDashboardStats();
}

async function loadPatientHome() {
    try {
        const appointments = await apiFetch('/appointments');
        const upcoming = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending')
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];
        const container = document.getElementById('upcoming-appointment-container');
        if (!container) return;
        if (upcoming) {
            container.innerHTML = `
                <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--primary); font-weight: 600;">${t('Upcoming Appointment')}</h2>
                <div class="grid-card" style="padding: 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                            <h3 style="font-size: 1.25rem; font-weight: 700;">${upcoming.service.name}</h3>
                            <span class="badge badge-${upcoming.status.toLowerCase()}">${t(upcoming.status)}</span>
                        </div>
                        <p style="color:var(--text-body); margin-bottom:1rem;">${t('with Dr.')} ${upcoming.doctor.name}</p>
                        <div style="display:flex; gap:1.5rem; color:var(--text-muted); font-size:0.875rem;">
                            <span><i data-lucide="calendar" style="width:16px;"></i> ${upcoming.appointment_date}</span>
                            <span><i data-lucide="clock" style="width:16px;"></i> ${upcoming.appointment_time}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="switchScreen('screen-appointments')">${t('View Details')}</button>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="grid-card" style="padding: 3rem; text-align: center; color: var(--text-muted);">
                <i data-lucide="calendar" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.5;"></i>
                <p>${t('No upcoming appointments scheduled.')}</p>
                <button class="btn btn-outline mt-4" onclick="switchScreen('screen-book-appointment')">${t('Book your first appointment')}</button>
            </div>`;
        }
        lucide.createIcons();
    } catch (err) { console.error('Error loading patient home:', err); }
}

async function loadDashboardStats() {
    try {
        const stats = await apiFetch('/dashboard/stats');
        if (!stats) return;
        if (document.getElementById('stat-total-today')) document.getElementById('stat-total-today').textContent = stats.total_today;
        if (document.getElementById('stat-total-patients-doctor')) document.getElementById('stat-total-patients-doctor').textContent = stats.total_patients;
        if (document.getElementById('stat-upcoming-count')) document.getElementById('stat-upcoming-count').textContent = stats.confirmed;
        if (document.getElementById('stat-confirmed')) document.getElementById('stat-confirmed').textContent = stats.confirmed;
        if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = stats.pending;
        if (document.getElementById('stat-cancelled')) document.getElementById('stat-cancelled').textContent = stats.cancelled;
        renderTodayList(stats.today_appointments);
    } catch (err) { console.error('Error loading stats:', err); }
}

function renderTodayList(appointments) {
    const container = document.getElementById('dashboard-today-list');
    if (!container) return;
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-body);">${t('No upcoming appointments scheduled.')}</div>`;
        return;
    }
    container.innerHTML = appointments.map(app => `
        <div class="list-item">
            <div class="list-item-left">
                <div class="list-patient-avatar" style="background:#F0F9FF; color:var(--accent);">${app.patient.name[0]}</div>
                <div>
                    <div style="font-weight:600; font-size:0.875rem; color:var(--text-main); margin-bottom:0.1rem;">${app.patient.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-body);">${app.service.name}</div>
                </div>
            </div>
            <div class="list-item-right" style="gap:2rem;">
                <div style="text-align:right;">
                    <div style="font-weight:600; font-size:0.875rem; color:var(--text-main);">${app.appointment_time}</div>
                </div>
                <span class="badge badge-${app.status.toLowerCase()}">${t(app.status)}</span>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function loadDoctorPatients() {
    try {
        const users = await apiFetch('/users/patients');
        const grid = document.getElementById('doctor-patients-grid');
        if (!grid) return;
        
        grid.innerHTML = users.map((u, i) => `
            <div class="grid-card" style="padding: 2rem; text-align: center;">
                <div class="user-avatar-lg" style="margin: 0 auto 1.5rem; width: 100px; height: 100px; font-size: 2rem; background: #F1F5F9; color: var(--primary);">
                    <img src="${getGenderedAvatar(u.gender, i)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${u.name}</h3>
                <p style="color:var(--text-body); font-size: 0.875rem; margin-bottom: 0.25rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;"><i data-lucide="mail" style="width:14px;"></i> ${u.email}</p>
                <p style="color:var(--text-body); font-size: 0.875rem; margin-bottom: 1.5rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;"><i data-lucide="phone" style="width:14px;"></i> (555) 123-4567</p>
                <button class="btn btn-primary w-full" style="background:#1E3A5F; border-color:#1E3A5F;">${t('Contact Patient')}</button>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading doctor patients:', err); }
}

async function loadAppointments(searchQuery = '') {
    try {
        const appointments = await apiFetch('/appointments', { params: searchQuery ? { search: searchQuery } : null });
        if (currentUser && currentUser.role === 'patient') {
            const container = document.getElementById('patient-appointments-list');
            if (!container) return;
            if (appointments.length === 0) {
                container.innerHTML = `<div class="grid-card" style="padding:4rem; text-align:center; color:var(--text-muted);">${t('No upcoming appointments scheduled.')}</div>`;
                return;
            }
            container.innerHTML = appointments.map(app => `
                <div class="grid-card" style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
                            <h3 style="font-size: 1.125rem; font-weight: 700;">${app.service.name}</h3>
                            <span class="badge badge-${app.status.toLowerCase()}">${t(app.status)}</span>
                        </div>
                        <p style="color:var(--text-body); margin-bottom:0.75rem;">${t('Doctor')}: ${app.doctor.name}</p>
                        <div style="display:flex; gap:1.5rem; color:var(--text-muted); font-size:0.875rem;">
                            <span><i data-lucide="calendar" style="width:16px;"></i> ${app.appointment_date}</span>
                            <span><i data-lucide="clock" style="width:16px;"></i> ${app.appointment_time}</span>
                        </div>
                    </div>
                    ${app.status !== 'Cancelled' ? `<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="deleteAppointment(${app.id})">${t('Cancel')}</button>` : ''}
                </div>
            `).join('');
            lucide.createIcons();
        } else {
            const tbody = document.getElementById('tbody-appointments');
            if (!tbody) return;
            tbody.innerHTML = appointments.map(app => `<tr class="table-row">
                <td style="font-weight:600; color:var(--primary);">${app.patient.name}</td>
                <td>Dr. ${app.doctor.name}</td>
                <td>${app.service.name}</td>
                <td>${app.appointment_date} at ${app.appointment_time}</td>
                <td><span class="badge badge-${app.status.toLowerCase()}">${t(app.status)}</span></td>
                <td class="text-right">
                    <button class="btn-icon" onclick="editAppointment(${app.id})"><i data-lucide="pencil" style="width:16px;"></i></button>
                    <button class="btn-icon delete" onclick="deleteAppointment(${app.id})"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </td>
            </tr>`).join('');
            lucide.createIcons();
        }
    } catch (err) { console.error('Error loading appointments:', err); }
}

async function loadServices() {
    try {
        const services = await apiFetch('/services');
        const grid = document.getElementById('services-grid');
        if (!grid) return;
        grid.innerHTML = services.map(s => `<div class="grid-card">
            <div class="service-icon-circle"><i data-lucide="stethoscope" style="width:24px;"></i></div>
            <h3 style="font-size:1.125rem; font-weight:700; margin-bottom:0.75rem; color:var(--primary);">${s.name}</h3>
            <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5; margin-bottom: 1.5rem;">${s.description}</p>
            <div style="font-weight: 700; color: var(--accent); font-size: 1.25rem;">${s.price} DH</div>
        </div>`).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading services:', err); }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/users');
        const grid = document.getElementById('users-grid');
        if (!grid) return;
        grid.innerHTML = users.map((u, i) => `<div class="grid-card user-card" style="display:flex; align-items:center; gap:1.5rem; padding: 1.5rem;">
            <div class="user-avatar-lg" style="flex-shrink:0;">
                <img src="${getGenderedAvatar(u.gender, i)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
            <div class="user-info">
                <h3 style="font-size:1.125rem; font-weight:700; color:var(--primary); margin-bottom:0.25rem;">${u.name}</h3>
                <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:0.25rem;">${t(u.role.charAt(0).toUpperCase() + u.role.slice(1))}</p>
                <p style="color:var(--text-body); font-size:0.875rem;">${u.email}</p>
            </div>
        </div>`).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading users:', err); }
}

function resetAppointmentModal() {
    if (document.getElementById('appointment-id')) document.getElementById('appointment-id').value = '';
    if (document.getElementById('form-appointment')) document.getElementById('form-appointment').reset();
    if (document.getElementById('appointment-status')) document.getElementById('appointment-status').value = 'Pending';
}

async function prepareAppointmentModal() {
    try {
        const patients = await apiFetch('/users/patients');
        const doctors = await apiFetch('/users/doctors');
        const services = await apiFetch('/services');
        const patientSelect = document.getElementById('select-patient');
        const doctorSelect = document.getElementById('select-doctor');
        const serviceSelect = document.getElementById('select-service');
        if (patientSelect) patientSelect.innerHTML = `<option value="">${t('Select a patient...')}</option>` + patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (doctorSelect) doctorSelect.innerHTML = `<option value="">${t('Select a doctor...')}</option>` + doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (serviceSelect) serviceSelect.innerHTML = `<option value="">${t('Select a service...')}</option>` + services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        if (currentUser) {
            if (currentUser.role === 'patient' && patientSelect) {
                patientSelect.value = currentUser.id;
                document.getElementById('patient-select-group')?.classList.add('hidden');
            } else if (currentUser.role === 'doctor' && doctorSelect) {
                doctorSelect.value = currentUser.id;
                document.getElementById('doctor-select-group')?.classList.add('hidden');
            }
        }
    } catch (err) { console.error('Error preparing modal:', err); }
}

async function editAppointment(id) {
    try {
        const app = await apiFetch(`/appointments/${id}`);
        if (!app) return;
        if (document.getElementById('appointment-id')) document.getElementById('appointment-id').value = app.id;
        await prepareAppointmentModal();
        if (document.getElementById('select-patient')) document.getElementById('select-patient').value = app.patient_id;
        if (document.getElementById('select-doctor')) document.getElementById('select-doctor').value = app.doctor_id;
        if (document.getElementById('select-service')) document.getElementById('select-service').value = app.service_id;
        if (document.getElementById('appointment-date')) document.getElementById('appointment-date').value = app.appointment_date;
        if (document.getElementById('appointment-time')) document.getElementById('appointment-time').value = app.appointment_time;
        if (document.getElementById('appointment-status')) document.getElementById('appointment-status').value = app.status;
        document.getElementById('modal-appointment').classList.add('active');
    } catch (err) { console.error('Error loading appointment for edit:', err); }
}

async function handleSaveAppointment(e) {
    e.preventDefault();
    const id = document.getElementById('appointment-id').value;
    const payload = {
        patient_id: document.getElementById('select-patient').value,
        doctor_id: document.getElementById('select-doctor').value,
        service_id: document.getElementById('select-service').value,
        appointment_date: document.getElementById('appointment-date').value,
        appointment_time: document.getElementById('appointment-time').value,
        status: document.getElementById('appointment-status').value
    };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/appointments/${id}` : '/appointments';
    try {
        await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
        document.getElementById('modal-appointment').classList.remove('active');
        showToast(t('Appointment saved successfully'));
        if (currentUser && currentUser.role === 'patient') loadPatientHome();
        if (!document.getElementById('screen-appointments-content').classList.contains('hidden')) loadAppointments();
        loadDashboardStats();
    } catch (err) { alert('Error saving appointment: ' + (err.response?.data?.message || err.message)); }
}

async function deleteAppointment(id) {
    if (!confirm(t('Are you sure you want to delete this?'))) return;
    try {
        await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
        showToast(t('Appointment deleted'));
        loadAppointments();
        if (currentUser && currentUser.role === 'patient') loadPatientHome();
        loadDashboardStats();
    } catch (err) { alert('Error deleting appointment: ' + (err.response?.data?.message || err.message)); }
}

async function initBookingProcess() {
    bookingData = { serviceId: null, doctorId: null, date: null, time: null };
    bookingPrevStep(1);
    const services = await apiFetch('/services');
    if (document.getElementById('booking-select-service')) document.getElementById('booking-select-service').innerHTML = `<option value="">${t('Choose a service')}</option>` + services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const doctors = await apiFetch('/users/doctors');
    const list = document.getElementById('booking-doctor-list');
    if (list) list.innerHTML = doctors.map((d, i) => `
        <div class="doctor-selection-card" onclick="selectBookingDoctor(${d.id}, '${d.name}', '${t('General Medicine')}')">
            <div style="display:flex; align-items:center; gap:1rem;">
                <img src="${getGenderedAvatar(d.gender, i)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; background:#F1F5F9;">
                <div>
                    <div style="font-weight:700; color:var(--primary);">Dr. ${d.name}</div>
                    <div style="font-size:0.875rem; color:var(--text-body);">${t('General Medicine')}</div>
                </div>
            </div>
            <i data-lucide="check-circle" class="check-icon"></i>
        </div>
    `).join('');
    lucide.createIcons();
    const calendar = document.getElementById('booking-calendar');
    if (calendar) calendar.innerHTML = `<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align:center;">
        <div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Sun')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Mon')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Tue')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Wed')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Thu')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Fri')}</div><div style="font-weight:600; font-size:0.75rem; color:var(--text-muted);">${t('Sat')}</div>
        ${Array.from({length: 30}, (_, i) => `<div class="time-slot" onclick="selectBookingDate('2026-04-${(i+1)<10?'0'+(i+1):(i+1)}', this)">${i+1}</div>`).join('')}
    </div>`;
    const times = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'];
    if (document.getElementById('booking-time-slots')) document.getElementById('booking-time-slots').innerHTML = times.map(t => `<div class="time-slot" onclick="selectBookingTime('${t}', this)">${t}</div>`).join('');
}

function selectBookingDoctor(id, name, spec) { bookingData.doctorId = id; bookingData.doctorName = name; bookingData.doctorSpecialty = spec; document.querySelectorAll('.doctor-selection-card').forEach(c => c.classList.remove('selected')); event.currentTarget.classList.add('selected'); }
function selectBookingDate(date, el) { bookingData.date = date; document.querySelectorAll('#booking-calendar .time-slot').forEach(s => s.classList.remove('selected')); el.classList.add('selected'); }
function selectBookingTime(time, el) { bookingData.time = time; document.querySelectorAll('#booking-time-slots .time-slot').forEach(s => s.classList.remove('selected')); el.classList.add('selected'); }

function bookingNextStep(step) {
    if (step === 2) {
        const select = document.getElementById('booking-select-service');
        bookingData.serviceId = select.value;
        bookingData.serviceName = select.options[select.selectedIndex].text;
        if (!bookingData.serviceId) { alert(t('Please select a service')); return; }
    }
    if (step === 3) {
        if (!bookingData.doctorId || !bookingData.date || !bookingData.time) { alert(t('Please select doctor, date and time')); return; }
        document.getElementById('confirm-service').textContent = bookingData.serviceName;
        document.getElementById('confirm-doctor').textContent = `Dr. ${bookingData.doctorName} - ${bookingData.doctorSpecialty}`;
        document.getElementById('confirm-date').textContent = bookingData.date;
        document.getElementById('confirm-time').textContent = bookingData.time;
    }
    document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`booking-step-${step}`).classList.remove('hidden');
    document.querySelectorAll('.step-circle').forEach((c, i) => c.classList.toggle('active', (i + 1) <= step));
}

function bookingPrevStep(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`booking-step-${step}`).classList.remove('hidden');
    document.querySelectorAll('.step-circle').forEach((c, i) => c.classList.toggle('active', (i + 1) <= step));
}

async function confirmBooking() {
    const payload = { patient_id: currentUser.id, doctor_id: bookingData.doctorId, service_id: bookingData.serviceId, appointment_date: bookingData.date, appointment_time: bookingData.time, status: 'Pending' };
    try { await apiFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) }); showToast(t('Appointment saved successfully')); switchScreen('screen-appointments'); }
    catch (err) { alert('Error booking appointment: ' + (err.response?.data?.message || err.message)); }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="check-circle" class="toast-icon"></i><div class="toast-message">${t(message)}</div>`;
    container.appendChild(toast); lucide.createIcons();
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

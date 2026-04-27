// === API CONFIG ===
const API_BASE_URL = '/api';

// === STATE ===
let currentUser = null;
let token = localStorage.getItem('auth_token');
let currentLang = (document.documentElement.lang || 'en').substring(0, 2);
let bookingCalendarCursor = null;
let bookingBookedTimes = [];

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

function formatDoctorName(name) {
    if (!name) return t('Unknown');
    const cleanName = String(name).replace(/^dr\.?\s*/i, '').trim();
    return `Dr. ${cleanName || t('Unknown')}`;
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
        if (e.target.closest('#btn-logout') || e.target.closest('#btn-logout-header') || e.target.closest('#btn-logout-patient')) logout();
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
    } catch (err) { alert(`${t('Login failed')}: ` + (err.response?.data?.message || err.message)); }
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
    } catch (err) { alert(`${t('Registration failed')}: ` + (err.response?.data?.message || err.message)); }
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
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const upcoming = appointments
            .filter(a => {
                const normalizedStatus = (a.status || '').toString().trim().toLowerCase();
                const isCancelled = ['cancelled', 'canceled', 'annulé', 'annule'].includes(normalizedStatus);
                if (isCancelled) return false;

                const dateTimeStr = `${a.appointment_date}T${a.appointment_time || '23:59:59'}`;
                const appointmentDateTime = new Date(dateTimeStr);
                if (!isNaN(appointmentDateTime.getTime())) {
                    return appointmentDateTime >= now;
                }

                // Safe fallback if time is missing/unparseable
                const appointmentDate = new Date(a.appointment_date);
                return !isNaN(appointmentDate.getTime()) && appointmentDate >= todayStart;
            })
            .sort((a, b) => {
                const aDate = new Date(`${a.appointment_date}T${a.appointment_time || '23:59:59'}`).getTime();
                const bDate = new Date(`${b.appointment_date}T${b.appointment_time || '23:59:59'}`).getTime();
                return aDate - bDate;
            })[0];
        const container = document.getElementById('upcoming-appointment-container');
        if (!container) return;
        if (upcoming) {
            const formattedTime = upcoming.appointment_time ? upcoming.appointment_time.substring(0, 5) : '';
            container.innerHTML = `
                <div class="patient-next-visit-header">
                    <h3 class="patient-next-visit-title">${t('Your Next Visit')}</h3>
                </div>
                <div class="grid-card patient-next-card">
                    <div class="patient-next-main">
                        <div class="patient-next-date">
                            <span class="patient-next-date-month">${upcoming.appointment_date.split('-')[1]}</span>
                            <span class="patient-next-date-day">${upcoming.appointment_date.split('-')[2]}</span>
                        </div>
                        <div class="patient-next-details">
                            <h4>${formatDoctorName(upcoming.doctor?.name)}</h4>
                            <p>
                                <i data-lucide="stethoscope"></i> ${upcoming.service?.name || t('Consultation')}
                            </p>
                        </div>
                    </div>
                    <div class="patient-next-meta">
                        <p>${formattedTime}</p>
                        <span class="badge badge-${upcoming.status.toLowerCase()}">${t(upcoming.status)}</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="grid-card patient-empty-card">
                    <div class="patient-empty-icon">
                        <i data-lucide="calendar"></i>
                    </div>
                    <h3>${t('No upcoming appointments')}</h3>
                    <p>${t('Book your first session to get started.')}</p>
                </div>
            `;
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
        const listContainer = document.getElementById('patient-appointments-list');
        const tableContainer = document.getElementById('admin-appointments-table');
        const titleEl = document.getElementById('appointments-title');
        const subtitleEl = document.getElementById('appointments-subtitle');
        const addBtn = document.querySelector('[data-modal="modal-appointment"]');

        if (currentUser && currentUser.role === 'patient') {
            if (listContainer) listContainer.classList.remove('hidden');
            if (tableContainer) tableContainer.classList.add('hidden');
            if (titleEl) titleEl.textContent = t('My History');
            if (subtitleEl) subtitleEl.textContent = t('View your past and upcoming medical visits');
            if (addBtn) addBtn.style.display = 'none';

            if (!listContainer) return;
            const sortedAppointments = [...appointments].sort((a, b) => {
                const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0;

                if (aCreatedAt !== bCreatedAt) {
                    return bCreatedAt - aCreatedAt;
                }

                // Fallback if created_at is missing/equal
                const aDateTime = new Date(`${a.appointment_date}T${a.appointment_time || '00:00:00'}`).getTime();
                const bDateTime = new Date(`${b.appointment_date}T${b.appointment_time || '00:00:00'}`).getTime();
                return bDateTime - aDateTime;
            });

            if (sortedAppointments.length === 0) {
                listContainer.innerHTML = `<div class="grid-card patient-history-empty">${t('No appointments found.')}</div>`;
            } else {
                listContainer.innerHTML = sortedAppointments.map(app => `
                    <div class="grid-card patient-history-card">
                        <div class="patient-history-main">
                            <div class="patient-history-top">
                                <h3>${app.service?.name || t('Unknown')}</h3>
                                <span class="badge badge-${app.status?.toLowerCase()}">${t(app.status || 'Pending')}</span>
                            </div>
                            <p class="patient-history-doctor">${t('Doctor')}: ${formatDoctorName(app.doctor?.name)}</p>
                            <div class="patient-history-meta">
                                <span><i data-lucide="calendar"></i> ${app.appointment_date}</span>
                                <span><i data-lucide="clock"></i> ${app.appointment_time?.substring(0, 5)}</span>
                            </div>
                        </div>
                        ${app.status !== 'Cancelled' ? `<button class="btn btn-outline patient-cancel-btn" onclick="deleteAppointment(${app.id})">${t('Cancel')}</button>` : ''}
                    </div>
                `).join('');
            }
        } else {
            if (listContainer) listContainer.classList.add('hidden');
            if (tableContainer) tableContainer.classList.remove('hidden');
            if (titleEl) titleEl.textContent = t('Appointments');
            if (subtitleEl) subtitleEl.textContent = t('Manage all medical appointments');
            if (addBtn) addBtn.style.display = 'flex';
            
            renderAdminAppointments(appointments);
        }
        lucide.createIcons();
    } catch (err) { console.error('Error loading appointments:', err); }
}

function renderAdminAppointments(appointments) {
    const tbody = document.getElementById('tbody-appointments');
    if (!tbody) return;
    tbody.innerHTML = appointments.map(app => {
        const formattedTime = app.appointment_time ? app.appointment_time.substring(0, 5) : '';
        const isConfirmed = app.status && app.status.toLowerCase() === 'confirmed';
        return `<tr class="table-row">
            <td style="font-weight:600; color:var(--primary);">${app.patient ? app.patient.name : t('Unknown')}</td>
            <td>${formatDoctorName(app.doctor?.name)}</td>
            <td>${app.service ? app.service.name : t('Unknown')}</td>
            <td>${app.appointment_date} ${t('at')} ${formattedTime}</td>
            <td>
                <span class="badge badge-${app.status ? app.status.toLowerCase() : ''}">${t(app.status)}</span>
                ${isConfirmed ? `<span class="badge-email" style="display:inline-flex; align-items:center; gap:4px; font-size:10px; background:#F0F9FF; color:#0369A1; padding:2px 8px; border-radius:100px; margin-left:8px; border:1px solid #BAE6FD;"><i data-lucide="mail" style="width:12px;height:12px;"></i> ${t('Email Sent')}</span>` : ''}
            </td>
            <td class="text-right">
                <button class="btn-icon" onclick="editAppointment(${app.id})"><i data-lucide="pencil" style="width:16px;"></i></button>
                <button class="btn-icon delete" onclick="deleteAppointment(${app.id})"><i data-lucide="trash-2" style="width:16px;"></i></button>
            </td>
        </tr>`;
    }).join('');
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
                
                <div style="display:flex; gap:0.5rem; margin-top:1.25rem; border-top:1px solid #F1F5F9; padding-top:1rem;">
                    ${u.role !== 'admin' ? `<button class="btn-icon" style="color:var(--primary);" onclick="updateUserRole(${u.id}, 'admin')" title="${t('Make Admin')}"><i data-lucide="shield" style="width:16px;"></i></button>` : ''}
                    ${u.role !== 'doctor' ? `<button class="btn-icon" style="color:var(--accent);" onclick="updateUserRole(${u.id}, 'doctor')" title="${t('Make Doctor')}"><i data-lucide="stethoscope" style="width:16px;"></i></button>` : ''}
                    ${u.role !== 'patient' ? `<button class="btn-icon" style="color:var(--text-body);" onclick="updateUserRole(${u.id}, 'patient')" title="${t('Make Patient')}"><i data-lucide="user" style="width:16px;"></i></button>` : ''}
                </div>
            </div>
        </div>`).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading users:', err); }
}

async function updateUserRole(userId, newRole) {
    if (!confirm(t('Are you sure you want to change this user role?'))) return;
    try {
        await apiFetch(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
        showToast(t('User role updated successfully'));
        loadUsers();
    } catch (err) { alert(`${t('Error')}: ` + (err.response?.data?.message || err.message)); }
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

function bookingPrevStep(step) {
    bookingNextStep(step);
}

function formatLocalDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonthStart(day) {
    return new Date(day.getFullYear(), day.getMonth(), 1);
}

function getWeekdayMondayIndex(date) {
    // Convert JS Sunday-based (0..6) to Monday-based (0..6)
    return (date.getDay() + 6) % 7;
}

function changeBookingMonth(offset) {
    if (!bookingCalendarCursor) {
        bookingCalendarCursor = getMonthStart(new Date());
    }

    const next = new Date(bookingCalendarCursor.getFullYear(), bookingCalendarCursor.getMonth() + offset, 1);
    const currentMonthStart = getMonthStart(new Date());

    // Do not navigate to months before current month
    if (next < currentMonthStart) return;
    bookingCalendarCursor = next;
    initBookingCalendar();
}

function initBookingCalendar() {
    const container = document.getElementById('booking-calendar');
    if (!container) return;

    const today = new Date();
    const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (!bookingCalendarCursor) {
        bookingCalendarCursor = bookingData.date ? getMonthStart(new Date(bookingData.date)) : getMonthStart(today);
    }

    const visibleYear = bookingCalendarCursor.getFullYear();
    const visibleMonth = bookingCalendarCursor.getMonth();
    const firstOfMonth = new Date(visibleYear, visibleMonth, 1);
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
    const leadingBlanks = getWeekdayMondayIndex(firstOfMonth);
    const currentMonthStart = getMonthStart(todayAtMidnight);
    const isPrevDisabled = bookingCalendarCursor <= currentMonthStart;

    const monthLabel = new Intl.DateTimeFormat(currentLang, { month: 'long', year: 'numeric' }).format(firstOfMonth);
    const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        .map((_, idx) => {
            const refDate = new Date(2024, 0, idx + 1); // Monday-first reference week
            return new Intl.DateTimeFormat(currentLang, { weekday: 'short' }).format(refDate);
        });

    let html = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem;">
            <button type="button" class="btn btn-outline" onclick="changeBookingMonth(-1)" ${isPrevDisabled ? 'disabled' : ''} style="padding:0.4rem 0.65rem; ${isPrevDisabled ? 'opacity:0.45; cursor:not-allowed;' : ''}">
                <i data-lucide="chevron-left" style="width:14px; height:14px;"></i>
            </button>
            <strong style="color:var(--primary); text-transform: capitalize;">${monthLabel}</strong>
            <button type="button" class="btn btn-outline" onclick="changeBookingMonth(1)" style="padding:0.4rem 0.65rem;">
                <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
            </button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align:center;">
    `;

    weekdayLabels.forEach(label => {
        html += `<div style="font-size:0.72rem; font-weight:700; color:var(--text-muted); padding:5px 0;">${label}</div>`;
    });

    for (let i = 0; i < leadingBlanks; i++) {
        html += `<div style="height:40px;"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(visibleYear, visibleMonth, day);
        const dateStr = formatLocalDate(cellDate);
        const isPast = cellDate < todayAtMidnight;
        const isActive = bookingData.date === dateStr;

        html += `
            <button
                type="button"
                class="day-btn booking-date-btn ${isActive ? 'active' : ''}"
                onclick="${isPast ? '' : `selectBookingDate('${dateStr}')`}"
                ${isPast ? 'disabled' : ''}
                style="padding:9px 5px; width:100%; ${isPast ? 'opacity:0.35; cursor:not-allowed;' : ''}"
            >
                ${day}
            </button>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
    lucide.createIcons();
    loadBookingTimeSlots();
}

function selectBookingDate(date) {
    bookingData.date = date;
    bookingData.time = null;
    bookingCalendarCursor = getMonthStart(new Date(date));
    initBookingCalendar();
    checkStep3Completion();
}

async function loadBookingTimeSlots() {
    const container = document.getElementById('booking-time-slots');
    if (!container) return;

    if (!bookingData.date || !bookingData.doctorId) {
        bookingBookedTimes = [];
    } else {
        try {
            const availability = await apiFetch('/appointments/availability', {
                params: {
                    doctor_id: bookingData.doctorId,
                    appointment_date: bookingData.date,
                }
            });
            bookingBookedTimes = Array.isArray(availability?.booked_times) ? availability.booked_times : [];
        } catch (err) {
            bookingBookedTimes = [];
            console.error('Failed to load appointment availability:', err);
        }
    }

    const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    if (bookingData.time && bookingBookedTimes.includes(bookingData.time)) {
        bookingData.time = null;
    }
    container.innerHTML = slots.map(s => `
        <button
            class="day-btn booking-time-btn ${bookingData.time === s ? 'active' : ''} ${bookingBookedTimes.includes(s) ? 'booked' : ''}"
            onclick="${bookingBookedTimes.includes(s) ? '' : `selectBookingTime('${s}')`}"
            ${bookingBookedTimes.includes(s) ? 'disabled' : ''}
            title="${bookingBookedTimes.includes(s) ? t('Already booked') : ''}"
        >
            ${s}${bookingBookedTimes.includes(s) ? ` - ${t('Booked')}` : ''}
        </button>
    `).join('');
    checkStep3Completion();
}

function selectBookingTime(time) {
    bookingData.time = time;
    loadBookingTimeSlots();
    checkStep3Completion();
}

function checkStep3Completion() {
    const nextBtn = document.getElementById('btn-to-step-4');
    if (!nextBtn) return;
    const isBooked = bookingData.time && bookingBookedTimes.includes(bookingData.time);
    const canContinue = bookingData.date && bookingData.time && !isBooked;
    nextBtn.classList.toggle('hidden', !canContinue);
}

async function handleConfirmBooking() {
    const confirmBtn = document.getElementById('btn-confirm-booking');
    const feedback = document.getElementById('booking-confirmation-feedback');
    const originalBtnText = confirmBtn ? confirmBtn.innerHTML : '';

    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.7';
        confirmBtn.textContent = t('Confirming...');
    }
    if (feedback) feedback.classList.add('hidden');

    try {
        await apiFetch('/appointments', {
            method: 'POST',
            body: JSON.stringify({
                patient_id: currentUser.id,
                doctor_id: bookingData.doctorId,
                service_id: bookingData.serviceId,
                appointment_date: bookingData.date,
                appointment_time: bookingData.time,
                status: 'Pending'
            })
        });
        showToast(t('Appointment booked successfully!'));
        if (feedback) {
            feedback.classList.remove('hidden');
            lucide.createIcons();
        }
        setTimeout(() => {
            switchScreen('screen-patient-home');
            loadPatientHome();
        }, 1200);
    } catch (err) { 
        alert('Error booking appointment: ' + (err.response?.data?.message || err.message)); 
        console.error('Booking Error:', err.response?.data || err);
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.innerHTML = originalBtnText || t('Confirm Booking');
            lucide.createIcons();
        }
    }
}

async function initBookingProcess() {
    bookingData = { serviceId: null, doctorId: null, date: null, time: null };
    bookingCalendarCursor = null;
    bookingBookedTimes = [];
    bookingNextStep(1);
}

async function loadBookingServices() {
    try {
        const services = await apiFetch('/services');
        const grid = document.getElementById('booking-service-grid');
        if (!grid) return;
        grid.innerHTML = services.map(s => `
            <div class="select-card ${bookingData.serviceId == s.id ? 'active' : ''}" onclick="selectBookingService(${s.id}, '${s.name}')">
                <div class="select-card-icon"><i data-lucide="stethoscope"></i></div>
                <div class="select-card-title">${s.name}</div>
                <div class="select-card-subtitle">${s.price} DH</div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

function selectBookingService(id, name) {
    bookingData.serviceId = id;
    document.getElementById('confirm-service').textContent = name;
    loadBookingServices(); // Refresh active state
    setTimeout(() => bookingNextStep(2), 300); // Auto-advance for better UX
}

async function loadBookingDoctors() {
    try {
        const params = bookingData.serviceId ? { service_id: bookingData.serviceId } : null;
        const doctors = await apiFetch('/users/doctors', { params });
        const grid = document.getElementById('booking-doctor-grid');
        if (!grid) return;
        if (!doctors.length) {
            grid.innerHTML = `
                <div class="grid-card" style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-body);">
                    ${t('No doctors available for this specialty yet.')}
                </div>
            `;
            return;
        }
        grid.innerHTML = doctors.map(d => `
            <div class="select-card ${bookingData.doctorId == d.id ? 'active' : ''}" onclick="selectBookingDoctor(${d.id}, '${d.name}')">
                <div class="user-avatar" style="width:64px; height:64px;">${d.name.charAt(0)}</div>
                <div class="select-card-title">${formatDoctorName(d.name)}</div>
                <div class="select-card-subtitle">${t('Available Today')}</div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

function selectBookingDoctor(id, name) {
    bookingData.doctorId = id;
    document.getElementById('confirm-doctor').textContent = formatDoctorName(name);
    loadBookingDoctors();
    setTimeout(() => bookingNextStep(3), 300);
}

function bookingNextStep(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`booking-step-${step}`).classList.remove('hidden');
    
    document.querySelectorAll('.step-circle').forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 <= step);
    });

    if (step === 1) loadBookingServices();
    if (step === 2) loadBookingDoctors();
    if (step === 3) initBookingCalendar();
    if (step === 4) {
        document.getElementById('confirm-date').textContent = bookingData.date;
        document.getElementById('confirm-time').textContent = bookingData.time;
    }
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

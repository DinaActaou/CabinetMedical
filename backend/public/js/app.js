// === API CONFIG ===
const API_BASE_URL = '/api';

// === STATE ===
let currentUser = null;
let token = localStorage.getItem('auth_token');
let currentLang = document.documentElement.lang || 'en';

// === UTILS ===
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        logout();
        return null;
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API Error');
    }

    return response.json();
}

// === I18N LOGIC ===
function t(key) {
    if (!window.translations || !window.translations[currentLang]) return key;
    return window.translations[currentLang][key] || key;
}

// === APP LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    lucide.createIcons();
    
    if (!token) {
        showLogin();
    } else {
        try {
            currentUser = await apiFetch('/user');
            if (currentUser) {
                showDashboard();
                loadInitialData();
            } else {
                showLogin();
            }
        } catch (err) {
            console.error('Auth error:', err);
            showLogin();
        }
    }

    setupEventListeners();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'btn-logout') return;
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            link.classList.add('active');
            
            const target = link.getAttribute('data-target');
            if (target) {
                document.querySelectorAll('.dashboard-page').forEach(page => page.classList.add('hidden'));
                document.getElementById(`${target}-content`)?.classList.remove('hidden');
                
                // Refresh data if needed
                if (target === 'screen-dashboard') loadDashboardStats();
                if (target === 'screen-appointments') loadAppointments();
                if (target === 'screen-services') loadServices();
                if (target === 'screen-users') loadUsers();
            }
        });
    });

    // Login Form
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register Form
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Screen Toggles
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

    // Logout Button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Modal triggers
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                if (modalId === 'modal-appointment') prepareAppointmentModal();
            }
        });
    });

    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Appointment Form
    const appointmentForm = document.getElementById('form-appointment');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleSaveAppointment);
    }

    // Day buttons toggle
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });
}

function showLogin() {
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.remove('hidden');
    
    // Update user profile
    if (currentUser) {
        document.getElementById('current-user-name').textContent = currentUser.name;
        document.getElementById('current-user-avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        // Update settings if on that page
        const settingsName = document.getElementById('settings-name');
        if (settingsName) settingsName.value = currentUser.name;
        const settingsEmail = document.getElementById('settings-email');
        if (settingsEmail) settingsEmail.value = currentUser.email;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data && data.access_token) {
            token = data.access_token;
            localStorage.setItem('auth_token', token);
            currentUser = data.user;
            showDashboard();
            loadInitialData();
            showToast(t('login_success'));
        }
    } catch (err) {
        alert('Login failed: ' + err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;
    const password_confirmation = document.getElementById('reg-password-confirm').value;

    if (password !== password_confirmation) {
        alert(t('pass_mismatch'));
        return;
    }

    try {
        const data = await apiFetch('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, role, password, password_confirmation })
        });

        if (data && data.access_token) {
            token = data.access_token;
            localStorage.setItem('auth_token', token);
            currentUser = data.user;
            showDashboard();
            loadInitialData();
            showToast(t('reg_success'));
        }
    } catch (err) {
        alert('Registration failed: ' + err.message);
    }
}

async function logout() {
    try {
        await apiFetch('/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        token = null;
        currentUser = null;
        localStorage.removeItem('auth_token');
        showLogin();
    }
}

function loadInitialData() {
    loadDashboardStats();
}

async function loadDashboardStats() {
    try {
        const stats = await apiFetch('/dashboard/stats');
        if (!stats) return;

        document.getElementById('stat-total-today').textContent = stats.total_today;
        document.getElementById('stat-pending').textContent = stats.pending;
        document.getElementById('stat-confirmed').textContent = stats.confirmed;
        document.getElementById('stat-cancelled').textContent = stats.cancelled;
        document.getElementById('stat-total-patients').textContent = stats.total_patients;
        document.getElementById('stat-active-doctors').textContent = stats.active_doctors;

        renderTodayList(stats.today_appointments);
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

function renderTodayList(appointments) {
    const container = document.getElementById('dashboard-today-list');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-body);">${t('no_appointments')}</div>`;
        return;
    }

    container.innerHTML = appointments.map(app => {
        const statusKey = app.status; // Using raw value for translation key
        return `
        <div class="list-item">
            <div class="list-item-left">
                <div class="list-patient-avatar"><i data-lucide="user" style="width:20px;height:20px;"></i></div>
                <div>
                    <div style="font-weight:600; font-size:0.875rem; color:var(--text-main); margin-bottom:0.1rem;">${app.patient.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-body);">${app.service.name}</div>
                </div>
            </div>
            <div class="list-item-right" style="gap:2rem;">
                <div style="text-align:right;">
                    <div style="font-weight:500; font-size:0.875rem; color:var(--text-main);"><i data-lucide="stethoscope" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:0.25rem;"></i>${app.doctor.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-body);"><i data-lucide="clock" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:0.25rem;"></i>${app.appointment_time}</div>
                </div>
                <span class="badge badge-${statusKey.toLowerCase() === 'confirmed' ? 'success' : (statusKey.toLowerCase() === 'pending' ? 'warning' : 'danger')}">
                    ${t(statusKey)}
                </span>
            </div>
        </div>
    `}).join('');
    lucide.createIcons();
}

async function loadAppointments() {
    try {
        const appointments = await apiFetch('/appointments');
        const tbody = document.getElementById('tbody-appointments');
        if (!tbody) return;

        tbody.innerHTML = appointments.map(app => {
            const statusKey = app.status;
            return `
            <tr>
                <td style="font-weight:500; color:var(--text-main);">${app.patient.name}</td>
                <td>${app.doctor.name}</td>
                <td>${app.service.name}</td>
                <td>${app.appointment_date} at ${app.appointment_time}</td>
                <td><span class="badge badge-${statusKey.toLowerCase() === 'confirmed' ? 'success' : (statusKey.toLowerCase() === 'pending' ? 'warning' : 'danger')}">${t(statusKey)}</span></td>
                <td class="text-right">
                    <button class="btn-icon" onclick="editAppointment(${app.id})"><i data-lucide="pencil" style="width:16px;height:16px"></i></button>
                    <button class="btn-icon delete" onclick="deleteAppointment(${app.id})"><i data-lucide="trash-2" style="width:16px;height:16px;color:#EF4444"></i></button>
                </td>
            </tr>
        `}).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Error loading appointments:', err);
    }
}

async function loadServices() {
    try {
        const services = await apiFetch('/services');
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        grid.innerHTML = services.map(s => `
            <div class="grid-card">
                <div class="service-icon-circle cardiology-bg">
                    <i data-lucide="stethoscope" style="width:24px;height:24px;"></i>
                </div>
                <h3 style="font-size:1.125rem; font-weight:600; margin-bottom:0.75rem; color:var(--text-main);">${s.name}</h3>
                <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5;">${s.description}</p>
                <div style="margin-top: 1rem; font-weight: 600; color: var(--accent);">${s.price} DH</div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Error loading services:', err);
    }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/users');
        const grid = document.getElementById('users-grid');
        if (!grid) return;

        grid.innerHTML = users.map(u => `
            <div class="grid-card user-card">
                <div class="user-avatar-lg">${u.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <div class="user-info">
                    <h3 style="font-size:1rem; font-weight:600; color:var(--text-main);">${u.name}</h3>
                    <p><i data-lucide="shield" style="width:14px;height:14px"></i> ${u.role}</p>
                    <p><i data-lucide="mail" style="width:14px;height:14px"></i> ${u.email}</p>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function prepareAppointmentModal() {
    try {
        const patients = await apiFetch('/users/patients');
        const doctors = await apiFetch('/users/doctors');
        const services = await apiFetch('/services');

        const patientSelect = document.getElementById('select-patient');
        const doctorSelect = document.getElementById('select-doctor');
        const serviceSelect = document.getElementById('select-service');

        patientSelect.innerHTML = `<option value="">${t('Select a patient...')}</option>` + patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        doctorSelect.innerHTML = `<option value="">${t('Select a doctor...')}</option>` + doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        serviceSelect.innerHTML = `<option value="">${t('Select a service...')}</option>` + services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    } catch (err) {
        console.error('Error preparing modal:', err);
    }
}

async function handleSaveAppointment(e) {
    e.preventDefault();
    const payload = {
        patient_id: document.getElementById('select-patient').value,
        doctor_id: document.getElementById('select-doctor').value,
        service_id: document.getElementById('select-service').value,
        appointment_date: document.getElementById('appointment-date').value,
        appointment_time: document.getElementById('appointment-time').value,
        status: 'Pending'
    };

    try {
        await apiFetch('/appointments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        document.getElementById('modal-appointment').classList.remove('active');
        showToast(t('apt_saved'));
        if (!document.getElementById('screen-appointments-content').classList.contains('hidden')) {
            loadAppointments();
        } else {
            loadDashboardStats();
        }
    } catch (err) {
        alert('Error saving appointment: ' + err.message);
    }
}

async function deleteAppointment(id) {
    if (!confirm(t('confirm_delete'))) return;
    try {
        await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
        showToast(t('apt_deleted'));
        loadAppointments();
    } catch (err) {
        alert('Error deleting appointment: ' + err.message);
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i data-lucide="check-circle" class="toast-icon"></i>
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === API CONFIG ===
const API_BASE_URL = '/api';

// === STATE ===
let currentUser = null;
let currentLang = (document.documentElement.lang || 'en').substring(0, 2);
let bookingCalendarCursor = null;
let bookingBookedTimes = [];
const initialData = window.__INITIAL_DATA__ || {};
let notificationPollTimer = null;
/** @type {null | (() => void)} */
let confirmModalCallback = null;

// Booking State
let bookingData = { serviceId: null, doctorId: null, date: null, time: null };
/** Doctor id → display name for booking cards (avoid broken inline onclick with quotes). */
let bookingDoctorNameById = {};

// === AXIOS CONFIG ===
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            showLogin();
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

/** Requêtes JSON sur le groupe « web » (session + CSRF), pour le booking patient. */
async function webSessionJson(path, options = {}) {
    const response = await axios({
        url: path,
        baseURL: '',
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : null,
        params: options.params || null,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        withCredentials: true,
    });
    return response.data;
}

async function fetchAppointmentsFromApi(searchQuery = '') {
    const q = (searchQuery || '').trim();
    const params = q ? { search: q } : {};
    const data = await webSessionJson('/web-api/appointments', { method: 'GET', params });
    return Array.isArray(data) ? data : [];
}

function openConfirmModal({ title, message, confirmLabel = null, danger = false, onConfirm }) {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('modal-confirm-title');
    const msgEl = document.getElementById('modal-confirm-message');
    const okBtn = document.getElementById('modal-confirm-ok');
    if (!modal || !titleEl || !msgEl || !okBtn) return;
    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmLabel || t('Confirm');
    okBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    confirmModalCallback = typeof onConfirm === 'function' ? onConfirm : null;
    modal.classList.add('active');
    lucide.createIcons();
}

function submitWebForm(action, method = 'POST', fields = {}) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;

    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_token';
    tokenInput.value = csrf;
    form.appendChild(tokenInput);

    if (method.toUpperCase() !== 'POST') {
        const methodInput = document.createElement('input');
        methodInput.type = 'hidden';
        methodInput.name = '_method';
        methodInput.value = method.toUpperCase();
        form.appendChild(methodInput);
    }

    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value ?? '';
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

function t(key) {
    if (!window.translations || !window.translations[currentLang]) return key;
    return window.translations[currentLang][key] || key;
}

function serviceNameLabel(name) {
    return name ? t(name) : '';
}

function serviceDescriptionLabel(description) {
    return description ? t(description) : '';
}

function servicePriceLabel(price) {
    if (price === null || price === undefined || price === '') return '';
    return `${price} ${t('currency_dh')}`;
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

function appointmentStatusIsCancelled(status) {
    const s = (status || '').toString().trim().toLowerCase();
    return ['cancelled', 'canceled', 'annulé', 'annule'].includes(s);
}

/** Upcoming (today or later / not in the past) and not cancelled — patient may release the slot. */
function appointmentCanBePatientCancelled(app) {
    if (!app || appointmentStatusIsCancelled(app.status)) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateTimeStr = `${app.appointment_date}T${app.appointment_time || '23:59:59'}`;
    const appointmentDateTime = new Date(dateTimeStr);
    if (!isNaN(appointmentDateTime.getTime())) {
        return appointmentDateTime >= now;
    }
    const appointmentDate = new Date(app.appointment_date);
    return !isNaN(appointmentDate.getTime()) && appointmentDate >= todayStart;
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        lucide.createIcons();
        currentUser = initialData.user || null;
        if (currentUser) {
            showDashboard();
            loadInitialData();
        } else {
            showLogin();
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
        const target = link.getAttribute('data-target');
        if (target) {
            e.preventDefault();
            switchScreen(target);
        }
    });

    const searchInput = document.getElementById('search-appointments');
    if (searchInput) {
        const debouncedSearch = debounce((query) => loadAppointments(query), 300);
        searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }

    document.getElementById('link-to-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('screen-login').classList.add('hidden');
        document.getElementById('screen-register').classList.remove('hidden');
        lucide.createIcons();
    });
    
    document.getElementById('link-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('screen-register').classList.add('hidden');
        document.getElementById('screen-login').classList.remove('hidden');
        lucide.createIcons();
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-logout') || e.target.closest('#btn-logout-header')) {
            e.preventDefault();
            document.getElementById('form-logout')?.submit();
        }
    });

    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId === 'modal-appointment' && currentUser?.role === 'doctor') {
                return;
            }
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
            if (modal?.id === 'modal-confirm') {
                confirmModalCallback = null;
            }
            if (modal) modal.classList.remove('active');
        }
    });

    document.getElementById('modal-confirm-ok')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cb = confirmModalCallback;
        confirmModalCallback = null;
        document.getElementById('modal-confirm')?.classList.remove('active');
        if (typeof cb === 'function') {
            cb();
        }
    });

    const notifTrigger = document.getElementById('notification-trigger');
    const notifPanel = document.getElementById('notifications-panel');
    const markReadBtn = document.getElementById('mark-all-read');
    if (notifTrigger && notifPanel) {
        notifTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle('active');
            if (notifPanel.classList.contains('active')) {
                refreshNotificationsFromServer();
            }
        });
        document.addEventListener('click', (e) => {
            if (!notifPanel.contains(e.target) && !notifTrigger.contains(e.target)) {
                notifPanel.classList.remove('active');
            }
        });
    }
    if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            markAllNotificationsRead();
        });
    }
    document.getElementById('notifications-list')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.notif-mark-read');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-notif-id');
        if (id) markSingleNotificationRead(id);
    });
}

function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNotificationTime(iso) {
    try {
        const d = new Date(iso);
        const loc = (currentLang || 'en').substring(0, 2) === 'fr' ? 'fr-FR' : 'en-GB';
        return d.toLocaleString(loc, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '';
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const n = Number(count) || 0;
    if (n > 0) {
        badge.textContent = String(n);
        badge.classList.remove('notification-badge--hidden');
    } else {
        badge.textContent = '';
        badge.classList.add('notification-badge--hidden');
    }
}

function renderNotificationsList(items) {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    if (!items || items.length === 0) {
        list.innerHTML = `<div class="notifications-empty">${escapeHtml(t('No notifications yet.'))}</div>`;
        return;
    }
    list.innerHTML = items.map((n) => {
        const d = n.data || {};
        const title = escapeHtml(d.title || '');
        const message = escapeHtml(d.message || '');
        const read = Boolean(n.read_at);
        const rowClass = read ? 'is-read' : 'is-unread';
        const btn = read ? '' : `<button type="button" class="notif-mark-read" data-notif-id="${escapeHtml(n.id)}">${escapeHtml(t('Mark as read'))}</button>`;
        const time = escapeHtml(formatNotificationTime(n.created_at));
        return `<div class="notification-item ${rowClass}" data-notification-id="${escapeHtml(n.id)}">
            <div class="notif-icon appointment"><i data-lucide="calendar"></i></div>
            <div class="notif-content">
                <p class="notif-content__title"><strong>${title}</strong></p>
                <p class="notif-content__message">${message}</p>
                <span class="notif-content__time">${time}</span>
            </div>${btn}
        </div>`;
    }).join('');
}

async function refreshNotificationsFromServer() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    try {
        const response = await fetch('/web-api/notifications', {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,
            },
            credentials: 'same-origin',
        });
        if (!response.ok) return;
        const payload = await response.json();
        updateNotificationBadge(payload.unread_count);
        renderNotificationsList(payload.notifications || []);
        lucide.createIcons();
    } catch (err) {
        console.error('Failed to load notifications:', err);
    }
}

async function markSingleNotificationRead(id) {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    try {
        const response = await fetch(`/web-api/notifications/${encodeURIComponent(id)}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,
            },
            credentials: 'same-origin',
        });
        if (!response.ok) throw new Error(String(response.status));
        await refreshNotificationsFromServer();
    } catch (err) {
        console.error('Failed to mark notification read:', err);
    }
}

async function markAllNotificationsRead() {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    try {
        const response = await fetch('/web-api/notifications/read-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,
            },
            credentials: 'same-origin',
        });
        if (!response.ok) throw new Error(String(response.status));
        await refreshNotificationsFromServer();
    } catch (err) {
        console.error('Failed to mark notifications as read:', err);
    }
}

function startNotificationPolling() {
    stopNotificationPolling();
    if (!currentUser) return;
    notificationPollTimer = setInterval(() => refreshNotificationsFromServer(), 50000);
}

function stopNotificationPolling() {
    if (notificationPollTimer) {
        clearInterval(notificationPollTimer);
        notificationPollTimer = null;
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
    } else if (currentUser.role === 'admin') {
        const allowed = ['screen-dashboard', 'screen-appointments', 'screen-services', 'screen-admin-doctors', 'screen-admin-patients', 'screen-settings'];
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
        if (target === 'screen-appointments') {
            const si = document.getElementById('search-appointments');
            if (si) si.value = '';
            loadAppointments('');
        }
        if (target === 'screen-services') loadServices();
        if (target === 'screen-admin-doctors') loadAdminDoctors();
        if (target === 'screen-admin-patients') loadAdminPatients();
        if (target === 'screen-book-appointment') initBookingProcess();
        if (target === 'screen-doctor-patients') loadDoctorPatients();
    }
}

function showLogin() {
    stopNotificationPolling();
    document.getElementById('screen-login')?.classList.remove('hidden');
    document.getElementById('screen-register')?.classList.add('hidden');
    document.getElementById('dashboard-layout')?.classList.add('hidden');
}

function updateSidebarLinks() {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    let links = '';
    if (currentUser.role === 'patient') {
        links = `
            <a href="#" data-target="screen-patient-home" class="nav-item">
              <i data-lucide="layout-dashboard" style="width: 18px; height: 18px;"></i> <span>${t('Dashboard')}</span>
            </a>
            <a href="#" data-target="screen-book-appointment" class="nav-item">
              <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i> <span>${t('Book Appointment')}</span>
            </a>
            <a href="#" data-target="screen-appointments" class="nav-item">
              <i data-lucide="history" style="width: 18px; height: 18px;"></i> <span>${t('My History')}</span>
            </a>
            <a href="#" data-target="screen-settings" class="nav-item">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i> <span>${t('Profile')}</span>
            </a>
        `;
    } else if (currentUser.role === 'doctor') {
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
    } else if (currentUser.role === 'admin') {
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
            <a href="#" data-target="screen-admin-doctors" class="nav-item">
              <i data-lucide="stethoscope" style="width: 18px; height: 18px;"></i> <span>${t('Doctors')}</span>
            </a>
            <a href="#" data-target="screen-admin-patients" class="nav-item">
              <i data-lucide="users" style="width: 18px; height: 18px;"></i> <span>${t('Patients')}</span>
            </a>
            <a href="/admin/specializations" class="nav-item">
              <i data-lucide="layers" style="width: 18px; height: 18px;"></i> <span>${t('Manage specializations')}</span>
            </a>
            <a href="#" data-target="screen-settings" class="nav-item">
              <i data-lucide="settings" style="width: 18px; height: 18px;"></i> <span>${t('Settings')}</span>
            </a>
        `;
    } else {
        sidebarNav.innerHTML = '';
        return;
    }

    sidebarNav.innerHTML = links;
    lucide.createIcons();
}

function showDashboard() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.remove('hidden');

    updateSidebarLinks();

    if (currentUser.role === 'patient') {
        document.body.classList.add('is-patient');
        document.body.classList.remove('is-doctor', 'is-admin');
        document.getElementById('patient-welcome-name').textContent = currentUser.name.split(' ')[0];
        document.getElementById('patient-appointments-list').classList.remove('hidden');
        document.getElementById('admin-appointments-table').classList.add('hidden');

        const headerAvatar = document.getElementById('current-user-avatar');
        if (headerAvatar) {
            headerAvatar.innerHTML = `<img src="${getGenderedAvatar(currentUser.gender, currentUser.id)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="">`;
            headerAvatar.classList.add('has-img');
        }

        let target = localStorage.getItem('active_screen') || 'screen-patient-home';
        if (target === 'screen-dashboard') target = 'screen-patient-home';
        switchScreen(target);
    } else if (currentUser.role === 'doctor') {
        document.body.classList.add('is-doctor');
        document.body.classList.remove('is-patient', 'is-admin');
        document.getElementById('dashboard-welcome-text').textContent = `${t('Welcome back, Dr.')} ${currentUser.name}`;
        document.getElementById('patient-appointments-list').classList.add('hidden');
        document.getElementById('admin-appointments-table').classList.remove('hidden');
        
        const headerAvatar = document.getElementById('current-user-avatar');
        if (headerAvatar) {
            headerAvatar.innerHTML = `<img src="${getGenderedAvatar(currentUser.gender, currentUser.id)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            headerAvatar.classList.add('has-img');
        }
        
        let target = localStorage.getItem('active_screen') || 'screen-dashboard';
        if (target === 'screen-patient-home') target = 'screen-dashboard';
        switchScreen(target);
    } else if (currentUser.role === 'admin') {
        document.body.classList.add('is-admin');
        document.body.classList.remove('is-patient', 'is-doctor');
        document.getElementById('dashboard-welcome-text').textContent = t('Welcome back!');
        document.getElementById('patient-appointments-list').classList.add('hidden');
        document.getElementById('admin-appointments-table').classList.remove('hidden');
        let adminTarget = localStorage.getItem('active_screen') || 'screen-dashboard';
        if (adminTarget === 'screen-users') {
            adminTarget = 'screen-admin-patients';
            localStorage.setItem('active_screen', adminTarget);
        }
        switchScreen(adminTarget);
    } else {
        document.body.classList.remove('is-patient', 'is-doctor', 'is-admin');
        showToast(t('Unsupported account type'));
        document.getElementById('form-logout')?.submit();
        return;
    }
    
    if (currentUser) {
        document.getElementById('current-user-name').textContent = currentUser.name;
        
        if (document.getElementById('settings-name')) document.getElementById('settings-name').value = currentUser.name;
        if (document.getElementById('settings-email')) document.getElementById('settings-email').value = currentUser.email;
        if (document.getElementById('settings-specialty')) {
            document.getElementById('settings-specialty').value = currentUser.specialty || '';
        }
        if (document.getElementById('profile-name-title')) document.getElementById('profile-name-title').textContent = currentUser.name;
        if (document.getElementById('profile-role-title')) document.getElementById('profile-role-title').textContent = t(currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1));
        
        const settingsAvatar = document.getElementById('settings-avatar-placeholder');
        if (settingsAvatar) {
            const avatarImg = getGenderedAvatar(currentUser.gender, currentUser.id);
            settingsAvatar.innerHTML = `<img src="${avatarImg}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }

    startNotificationPolling();
}

// Auth submissions are handled by Laravel web forms.

function loadInitialData() {
    if (currentUser && currentUser.role === 'patient') loadPatientHome();
    else if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'doctor')) loadDashboardStats();
}

async function loadPatientHome() {
    try {
        const appointments = Array.isArray(initialData.appointments) ? initialData.appointments : [];
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
            const st = (upcoming.status || 'Pending').toString();
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
                                <i data-lucide="stethoscope"></i> ${upcoming.service?.name ? serviceNameLabel(upcoming.service.name) : t('Consultation')}
                            </p>
                        </div>
                    </div>
                    <div class="patient-next-aside">
                        <div class="patient-next-meta">
                            <p>${formattedTime}</p>
                            <span class="badge badge-${st.toLowerCase()}">${t(st)}</span>
                        </div>
                        <button type="button" class="btn btn-outline patient-cancel-btn patient-cancel-btn--compact" onclick="patientCancelAppointment(${Number(upcoming.id)})">${t('Cancel appointment')}</button>
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
        const stats = initialData.dashboardStats;
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
        container.innerHTML = `<div class="staff-schedule-empty">${t('No upcoming appointments scheduled.')}</div>`;
        return;
    }
    container.innerHTML = appointments.map(app => {
        const timeShort = app.appointment_time ? String(app.appointment_time).substring(0, 5) : '';
        return `
        <div class="list-item staff-schedule-row">
            <div class="list-item-left">
                <div class="list-patient-avatar">${app.patient.name[0]}</div>
                <div>
                    <div class="staff-schedule-row__name">${app.patient.name}</div>
                    <div class="staff-schedule-row__meta">${serviceNameLabel(app.service.name)}</div>
                </div>
            </div>
            <div class="list-item-right staff-schedule-row__right">
                <div class="staff-schedule-row__time">${timeShort}</div>
                <span class="badge badge-${app.status.toLowerCase()} staff-schedule-row__badge">${t(app.status)}</span>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

async function loadDoctorPatients() {
    try {
        const users = Array.isArray(initialData.doctorPatients) ? initialData.doctorPatients : [];
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
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading doctor patients:', err); }
}

async function loadAppointments(searchQuery = '') {
    let appointments = [];
    try {
        appointments = await fetchAppointmentsFromApi(searchQuery);
        initialData.appointments = appointments;
    } catch (err) {
        console.error(err);
        showToast(firstApiErrorMessage(err));
        appointments = Array.isArray(initialData.appointments) ? initialData.appointments : [];
    }

    try {
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
                                <h3>${app.service?.name ? serviceNameLabel(app.service.name) : t('Unknown')}</h3>
                                <span class="badge badge-${app.status?.toLowerCase()}">${t(app.status || 'Pending')}</span>
                            </div>
                            <p class="patient-history-doctor">${t('Doctor')}: ${formatDoctorName(app.doctor?.name)}</p>
                            <div class="patient-history-meta">
                                <span><i data-lucide="calendar"></i> ${app.appointment_date}</span>
                                <span><i data-lucide="clock"></i> ${app.appointment_time?.substring(0, 5)}</span>
                            </div>
                        </div>
                        ${appointmentCanBePatientCancelled(app) ? `<button type="button" class="btn btn-outline patient-cancel-btn" onclick="patientCancelAppointment(${Number(app.id)})">${t('Cancel appointment')}</button>` : ''}
                    </div>
                `).join('');
            }
        } else {
            if (listContainer) listContainer.classList.add('hidden');
            if (tableContainer) tableContainer.classList.remove('hidden');
            if (titleEl) titleEl.textContent = t('Appointments');
            if (subtitleEl) subtitleEl.textContent = t('Manage all medical appointments');
            if (addBtn) {
                addBtn.style.display = currentUser && currentUser.role === 'admin' ? 'flex' : 'none';
            }

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
            <td>${app.service ? serviceNameLabel(app.service.name) : t('Unknown')}</td>
            <td>${app.appointment_date} ${t('at')} ${formattedTime}</td>
            <td>
                <span class="appointment-status-badges">
                    <span class="badge badge-${app.status ? app.status.toLowerCase() : ''}">${t(app.status)}</span>
                    ${isConfirmed ? `<span class="badge-email"><i data-lucide="mail" style="width:12px;height:12px;flex-shrink:0;"></i> ${t('Email Sent')}</span>` : ''}
                </span>
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
        const services = Array.isArray(initialData.services) ? initialData.services : [];
        const grid = document.getElementById('services-grid');
        if (!grid) return;
        grid.innerHTML = services.map(s => `<div class="grid-card">
            <div class="service-icon-circle"><i data-lucide="stethoscope" style="width:24px;"></i></div>
            <h3 style="font-size:1.125rem; font-weight:700; margin-bottom:0.75rem; color:var(--primary);">${serviceNameLabel(s.name)}</h3>
            <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5; margin-bottom: 1.5rem;">${serviceDescriptionLabel(s.description)}</p>
            <div style="font-weight: 700; color: var(--accent); font-size: 1.25rem;">${servicePriceLabel(s.price)}</div>
        </div>`).join('');
        lucide.createIcons();
    } catch (err) { console.error('Error loading services:', err); }
}

function doctorSpecialtyLabel(u) {
    if (u.specialization && u.specialization.name) return u.specialization.name;
    if (u.specialty && String(u.specialty).trim()) return String(u.specialty).trim();
    return '';
}

function adminUserCardHtml(u, i, actionsHtml) {
    const specLine = doctorSpecialtyLabel(u);
    return `<div class="grid-card user-card" style="display:flex; align-items:center; gap:1.5rem; padding: 1.5rem;">
            <div class="user-avatar-lg" style="flex-shrink:0;">
                <img src="${getGenderedAvatar(u.gender, i)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
            <div class="user-info">
                <h3 style="font-size:1.125rem; font-weight:700; color:var(--primary); margin-bottom:0.25rem;">${u.name}</h3>
                ${specLine ? `<p style="color:var(--accent); font-size:0.8rem; font-weight:600; margin-bottom:0.25rem;">${specLine}</p>` : ''}
                <p style="color:var(--text-body); font-size:0.875rem;">${u.email}</p>
                <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1.25rem; border-top:1px solid #F1F5F9; padding-top:1rem;">
                    ${actionsHtml}
                </div>
            </div>
        </div>`;
}

async function loadAdminDoctors() {
    try {
        const doctors = Array.isArray(initialData.adminDoctors) ? initialData.adminDoctors : [];
        const grid = document.getElementById('admin-doctors-grid');
        if (!grid) return;
        if (!doctors.length) {
            grid.innerHTML = `<div class="grid-card" style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">${t('No doctors found.')}</div>`;
        } else {
            const specs = Array.isArray(initialData.specializations) ? initialData.specializations : [];
            const specOptionsHtml = (selectedId) => specs.map((s) =>
                `<option value="${s.id}"${Number(selectedId) === Number(s.id) ? ' selected' : ''}>${s.name}</option>`
            ).join('');

            const grouped = doctors.reduce((acc, doctor) => {
                const category = doctorSpecialtyLabel(doctor) || t('Not specified');
                if (!acc[category]) acc[category] = [];
                acc[category].push(doctor);
                return acc;
            }, {});

            const sections = Object.keys(grouped).sort((a, b) => a.localeCompare(b)).map((category) => {
                const cards = grouped[category].map((u, i) => {
                    const assignRow = specs.length
                        ? `<div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
                            <label style="font-size:0.75rem; color:var(--text-muted);">${t('Assign specialization')}</label>
                            <select id="doctor-spec-${u.id}" class="form-control" style="min-width:11rem; padding:0.35rem 0.5rem;">${specOptionsHtml(u.specialization_id)}</select>
                            <button type="button" class="btn btn-outline" onclick="saveDoctorSpecialization(${u.id})">${t('Save assignment')}</button>
                          </div>`
                        : '';
                    return adminUserCardHtml(
                        u,
                        i,
                        `<div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
                            <button class="btn btn-outline" onclick="updateUserRole(${u.id}, 'patient')">${t('Revoke Doctor')}</button>
                         </div>${assignRow}`
                    );
                }).join('');
                return `
                    <section style="grid-column:1/-1;">
                        <h3 style="margin:0 0 1rem 0; color:var(--primary); font-size:1.1rem;">${category}</h3>
                        <div class="grid-view">${cards}</div>
                    </section>
                `;
            });

            grid.innerHTML = sections.join('');
        }
        lucide.createIcons();
    } catch (err) { console.error('Error loading doctors:', err); }
}

async function loadAdminPatients() {
    try {
        const patients = Array.isArray(initialData.adminPatients) ? initialData.adminPatients : [];
        const grid = document.getElementById('admin-patients-grid');
        if (!grid) return;
        if (!patients.length) {
            grid.innerHTML = `<div class="grid-card" style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">${t('No patients found.')}</div>`;
        } else {
            grid.innerHTML = patients.map((u, i) => adminUserCardHtml(u, i,
                `<button class="btn btn-primary" onclick="updateUserRole(${u.id}, 'doctor')">${t('Approve as Doctor')}</button>`
            )).join('');
        }
        lucide.createIcons();
    } catch (err) { console.error('Error loading patients:', err); }
}

function updateUserRole(userId, newRole) {
    openConfirmModal({
        title: t('Confirm role change'),
        message: t('Are you sure you want to change this user role?'),
        confirmLabel: t('Confirm'),
        onConfirm: () => submitWebForm(`/users/${userId}/role`, 'PUT', { role: newRole }),
    });
}

function saveDoctorSpecialization(userId) {
    const sel = document.getElementById('doctor-spec-' + userId);
    if (!sel?.value) {
        showToast('Select a specialization');
        return;
    }
    submitWebForm(`/users/${userId}/specialization`, 'PUT', { specialization_id: sel.value });
}

function resetAppointmentModal() {
    if (document.getElementById('appointment-id')) document.getElementById('appointment-id').value = '';
    if (document.getElementById('form-appointment')) document.getElementById('form-appointment').reset();
    if (document.getElementById('appointment-status')) document.getElementById('appointment-status').value = 'Pending';
    if (document.getElementById('appointment-method')) document.getElementById('appointment-method').value = 'POST';
    const form = document.getElementById('form-appointment');
    if (form) form.setAttribute('action', '/appointments');
}

async function prepareAppointmentModal() {
    try {
        const patients = Array.isArray(initialData.modalPatients) ? initialData.modalPatients : [];
        const doctors = Array.isArray(initialData.doctors) ? initialData.doctors : [];
        const services = Array.isArray(initialData.services) ? initialData.services : [];
        const patientSelect = document.getElementById('select-patient');
        const doctorSelect = document.getElementById('select-doctor');
        const serviceSelect = document.getElementById('select-service');
        if (patientSelect) patientSelect.innerHTML = `<option value="">${t('Select a patient...')}</option>` + patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (doctorSelect) {
            doctorSelect.innerHTML = `<option value="">${t('Select a doctor...')}</option>` + doctors.map((d) => {
                const spec = doctorSpecialtyLabel(d);
                const suffix = spec ? ` — ${spec}` : '';
                return `<option value="${d.id}">${d.name}${suffix}</option>`;
            }).join('');
        }
        if (serviceSelect) serviceSelect.innerHTML = `<option value="">${t('Select a service...')}</option>` + services.map(s => `<option value="${s.id}">${serviceNameLabel(s.name)}</option>`).join('');

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
        const app = (Array.isArray(initialData.appointments) ? initialData.appointments : []).find(a => Number(a.id) === Number(id));
        if (!app) return;
        if (document.getElementById('appointment-id')) document.getElementById('appointment-id').value = app.id;
        await prepareAppointmentModal();
        if (document.getElementById('select-patient')) document.getElementById('select-patient').value = app.patient_id;
        if (document.getElementById('select-doctor')) document.getElementById('select-doctor').value = app.doctor_id;
        if (document.getElementById('select-service')) document.getElementById('select-service').value = app.service_id;
        if (document.getElementById('appointment-date')) document.getElementById('appointment-date').value = app.appointment_date;
        if (document.getElementById('appointment-time')) document.getElementById('appointment-time').value = app.appointment_time;
        if (document.getElementById('appointment-status')) document.getElementById('appointment-status').value = app.status;
        const form = document.getElementById('form-appointment');
        const methodInput = document.getElementById('appointment-method');
        if (form) form.setAttribute('action', `/appointments/${app.id}`);
        if (methodInput) methodInput.value = 'PUT';
        document.getElementById('modal-appointment').classList.add('active');
    } catch (err) { console.error('Error loading appointment for edit:', err); }
}

function deleteAppointment(id) {
    openConfirmModal({
        title: t('Delete this appointment'),
        message: t('Are you sure you want to delete this?'),
        confirmLabel: t('Delete'),
        danger: true,
        onConfirm: () => submitWebForm(`/appointments/${id}`, 'DELETE'),
    });
}

function patientCancelAppointment(id) {
    if (!currentUser || currentUser.role !== 'patient') return;
    openConfirmModal({
        title: t('Cancel appointment'),
        message: t('Cancel this appointment?'),
        confirmLabel: t('Confirm cancellation'),
        danger: true,
        onConfirm: () => executePatientCancelAppointment(id),
    });
}

async function executePatientCancelAppointment(id) {
    try {
        const response = await axios({
            method: 'PUT',
            url: `/appointments/${id}`,
            data: { status: 'Cancelled' },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            withCredentials: true,
            validateStatus: (status) => status >= 200 && status < 300,
        });
        const data = response.data;
        if (data && typeof data === 'object' && data.id) {
            const list = Array.isArray(initialData.appointments) ? initialData.appointments : [];
            const idx = list.findIndex((a) => Number(a.id) === Number(id));
            if (idx !== -1) list[idx] = { ...list[idx], ...data };
            else list.unshift(data);
            initialData.appointments = list;
        }
        showToast(t('Appointment cancelled successfully.'));
        loadPatientHome();
        const searchInput = document.getElementById('search-appointments');
        await loadAppointments(searchInput ? searchInput.value : '');
        refreshNotificationsFromServer();
    } catch (err) {
        console.error(err);
        showToast(firstApiErrorMessage(err));
    }
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
            const availability = await webSessionJson('/web-api/appointments/availability', {
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

function bookingAppointmentTimePayload(time) {
    if (!time) return '';
    const s = String(time).trim();
    return s.length === 5 && /^\d{2}:\d{2}$/.test(s) ? `${s}:00` : s;
}

function firstApiErrorMessage(err) {
    const d = err.response?.data;
    if (!d) return err.message || t('Error');
    if (typeof d.message === 'string') return d.message;
    if (d.errors && typeof d.errors === 'object') {
        const first = Object.values(d.errors)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return t('Error');
}

/** Fixed thin green bar at top of viewport (not clipped by main-content overflow). */
function showBookingOperationSuccessStrip(message) {
    const text = String(message || '').trim() || t('Operation completed successfully');
    const bar = document.createElement('div');
    bar.className = 'booking-operation-success-strip';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.textContent = text;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('booking-operation-success-strip--visible'));
    window.setTimeout(() => {
        bar.classList.remove('booking-operation-success-strip--visible');
        window.setTimeout(() => bar.remove(), 350);
    }, 5500);
}

async function handleConfirmBooking() {
    const feedback = document.querySelector('#screen-book-appointment-content #booking-confirmation-feedback');
    const feedbackText = document.querySelector('#screen-book-appointment-content #booking-confirmation-feedback-text');
    const btn = document.getElementById('btn-confirm-booking');
    if (!currentUser || !bookingData.doctorId || !bookingData.serviceId || !bookingData.date || !bookingData.time) {
        return;
    }
    if (feedback) {
        feedback.classList.add('hidden');
        feedback.style.removeProperty('display');
    }
    if (btn) btn.disabled = true;
    const successMsg = t('Operation completed successfully');
    try {
        const response = await axios({
            method: 'POST',
            url: '/appointments',
            baseURL: '',
            data: {
                patient_id: currentUser.id,
                doctor_id: bookingData.doctorId,
                service_id: bookingData.serviceId,
                appointment_date: bookingData.date,
                appointment_time: bookingAppointmentTimePayload(bookingData.time),
                status: 'Pending',
            },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            withCredentials: true,
            validateStatus: (status) => status >= 200 && status < 300,
        });
        const data = response.data;
        if (data && typeof data === 'object' && data.id) {
            if (!Array.isArray(initialData.appointments)) initialData.appointments = [];
            initialData.appointments.unshift(data);
            bookingBookedTimes = Array.from(new Set([...bookingBookedTimes, bookingData.time]));
        }
        showBookingOperationSuccessStrip(successMsg);
        if (feedbackText) feedbackText.textContent = successMsg;
        if (feedback) {
            feedback.classList.remove('hidden');
            feedback.style.setProperty('display', 'flex', 'important');
            lucide.createIcons();
            feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        loadPatientHome();
        refreshNotificationsFromServer();
    } catch (err) {
        console.error(err);
        const msg = firstApiErrorMessage(err);
        showToast(msg);
    } finally {
        if (btn) btn.disabled = false;
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
        const services = Array.isArray(initialData.services) ? initialData.services : [];
        const grid = document.getElementById('booking-service-grid');
        if (!grid) return;
        grid.innerHTML = services.map((s) => {
            const title = serviceNameLabel(s.name);
            return `
            <div class="select-card ${bookingData.serviceId == s.id ? 'active' : ''}" onclick="selectBookingService(${Number(s.id)})">
                <div class="select-card-icon"><i data-lucide="stethoscope"></i></div>
                <div class="select-card-title">${title}</div>
                <div class="select-card-subtitle">${servicePriceLabel(s.price)}</div>
            </div>
        `;
        }).join('');
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

function selectBookingService(id) {
    bookingData.serviceId = id;
    const services = Array.isArray(initialData.services) ? initialData.services : [];
    const s = services.find((x) => Number(x.id) === Number(id));
    const name = s ? serviceNameLabel(s.name) : '';
    const confirmEl = document.getElementById('confirm-service');
    if (confirmEl) confirmEl.textContent = name;
    loadBookingServices(); // Refresh active state
    setTimeout(() => bookingNextStep(2), 300); // Auto-advance for better UX
}

async function loadBookingDoctors() {
    try {
        const params = bookingData.serviceId ? { service_id: bookingData.serviceId } : null;
        const doctorsRaw = await webSessionJson('/web-api/users/doctors', { params });
        const doctors = Array.isArray(doctorsRaw) ? doctorsRaw : [];
        const grid = document.getElementById('booking-doctor-grid');
        if (!grid) return;
        bookingDoctorNameById = Object.fromEntries(doctors.map((d) => [String(d.id), d.name]));
        if (!doctors.length) {
            bookingDoctorNameById = {};
            grid.innerHTML = `
                <div class="grid-card" style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-body);">
                    ${t('No doctors available for this specialty yet.')}
                </div>
            `;
            return;
        }
        const categoryFor = (d) => {
            if (d.specialization && d.specialization.name) return d.specialization.name;
            if (d.specialty && String(d.specialty).trim()) return String(d.specialty).trim();
            return t('Not specified');
        };
        const grouped = doctors.reduce((acc, d) => {
            const k = categoryFor(d);
            if (!acc[k]) acc[k] = [];
            acc[k].push(d);
            return acc;
        }, {});
        const sections = Object.keys(grouped).sort((a, b) => a.localeCompare(b)).map((title) => {
            const cards = grouped[title].map((d) => `
            <div class="select-card ${bookingData.doctorId == d.id ? 'active' : ''}" onclick="selectBookingDoctor(${Number(d.id)})">
                <div class="user-avatar" style="width:64px; height:64px;">${d.name.charAt(0)}</div>
                <div class="select-card-title">${formatDoctorName(d.name)}</div>
                <div class="select-card-subtitle">${t('Available Today')}</div>
            </div>`).join('');
            return `
            <section style="margin-bottom:2rem;">
                <h3 style="margin:0 0 1rem 0; color:var(--primary); font-size:1.1rem; font-weight:700;">${title}</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">${cards}</div>
            </section>`;
        });
        grid.innerHTML = sections.join('');
        lucide.createIcons();
    } catch (err) {
        bookingDoctorNameById = {};
        console.error(err);
    }
}

function selectBookingDoctor(id) {
    bookingData.doctorId = id;
    const name = bookingDoctorNameById[String(id)] || '';
    const confirmEl = document.getElementById('confirm-doctor');
    if (confirmEl) confirmEl.textContent = formatDoctorName(name);
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
        const fb = document.querySelector('#screen-book-appointment-content #booking-confirmation-feedback');
        if (fb) {
            fb.classList.add('hidden');
            fb.style.removeProperty('display');
        }
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i data-lucide="check-circle" class="toast-icon"></i><div class="toast-message"></div>';
    const msgEl = toast.querySelector('.toast-message');
    if (msgEl) msgEl.textContent = t(message);
    container.appendChild(toast); lucide.createIcons();
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

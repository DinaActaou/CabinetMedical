@extends('layouts.app')

@section('title', __('Medical Cabinet - Dashboard'))

@section('body')
  <!-- ================= PORTAL SELECTION ================= -->
  <section id="screen-portal-selection" class="auth-layout" style="background:#F8FAFC; position: relative;">
    <!-- Floating Language Switcher for Auth -->
    <div style="position: absolute; top: 2rem; right: 2rem; display: flex; gap: 0.5rem;">
      <a href="/lang/en" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">EN</a>
      <a href="/lang/fr" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">FR</a>
    </div>

    <div style="max-width: 1000px; width: 100%; text-align: center;">
      <div class="logo-container" style="color:var(--primary); font-size:3rem; font-weight:bold; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem;">
        <i data-lucide="stethoscope" style="width:50px; height:50px; color:var(--accent);"></i>
        <span>{{ __('MediBook') }}</span>
      </div>
      <p style="color:var(--text-body); margin-bottom: 4rem; font-size: 1.125rem;">{{ __('Medical Appointment Management System') }}</p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; margin-top: 2rem;">
        <!-- Patient Card -->
        <div class="portal-card" style="border-top: 5px solid var(--accent);">
          <div class="portal-icon-circle" style="background: #F0F9FF; border: 2px solid var(--accent);">
            <i data-lucide="user" style="width: 48px; height: 48px; color: var(--accent);"></i>
          </div>
          <h2 class="portal-title" style="color: var(--primary);">{{ __('Patient Portal') }}</h2>
          <p class="portal-description">{{ __('Book appointments, view your schedule, and manage your profile') }}</p>
          <button class="btn btn-primary portal-btn" onclick="showRoleRegister('patient')" style="background: var(--accent); border-color: var(--accent); color: white;">{{ __('Connect as Patient') }}</button>
        </div>

        <!-- Doctor Card -->
        <div class="portal-card" style="border-top: 5px solid var(--primary);">
          <div class="portal-icon-circle" style="background: #F0F7FF; border: 2px solid var(--primary);">
            <i data-lucide="stethoscope" style="width: 48px; height: 48px; color: var(--primary);"></i>
          </div>
          <h2 class="portal-title" style="color: var(--primary);">{{ __('Doctor Portal') }}</h2>
          <p class="portal-description">{{ __('Manage your schedule, view patients, and update your availability') }}</p>
          <button class="btn btn-primary portal-btn" onclick="showRoleRegister('doctor')" style="background: var(--primary); border-color: var(--primary); color: white;">{{ __('Connect as Doctor') }}</button>
        </div>

        <!-- Administrator Card -->
        <div class="portal-card" style="border-top: 5px solid #0F172A;">
          <div class="portal-icon-circle" style="background: #F8FAFC; border: 2px solid #0F172A;">
            <i data-lucide="shield-check" style="width: 48px; height: 48px; color: #0F172A;"></i>
          </div>
          <h2 class="portal-title" style="color: var(--primary);">{{ __('Admin Portal') }}</h2>
          <p class="portal-description">{{ __('Manage users, services, and oversee entire cabinet operations') }}</p>
          <button class="btn btn-primary portal-btn" onclick="showRoleLogin('admin')" style="background: #0F172A; border-color: #0F172A; color: white;">{{ __('Connect as Admin') }}</button>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= AUTH SCREENS ================= -->
  <section id="screen-login" class="auth-layout hidden" style="position: relative;">
    <!-- Floating Language Switcher -->
    <div style="position: absolute; top: 2rem; right: 2rem; display: flex; gap: 0.5rem;">
      <a href="/lang/en" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">EN</a>
      <a href="/lang/fr" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">FR</a>
    </div>
    <div class="auth-card">
      <div style="margin-bottom: 2rem;">
        <a href="#" onclick="showPortalSelection()" style="color:var(--text-muted); font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; justify-content:center; text-decoration:none;">
          <i data-lucide="arrow-left" style="width:14px;"></i> {{ __('Back to Portals') }}
        </a>
      </div>
      <div class="logo-container" style="color:var(--primary); font-size:2rem; font-weight:bold; margin-bottom: 1.5rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
        <i data-lucide="stethoscope" style="width:32px; height:32px; color:var(--accent);"></i>
        <span>{{ __('MediBook') }}</span>
      </div>
      <h2 id="login-role-title" style="margin-bottom: 1.5rem; color: var(--primary); text-align:center;">{{ __('Login') }}</h2>
      <form id="form-login">
        <div class="form-group"><input type="email" id="login-email" class="form-control" placeholder="{{ __('Email') }}" value="aktaoudina@medibook.com" required></div>
        <div class="form-group mb-4"><input type="password" id="login-password" class="form-control" placeholder="{{ __('Password') }}" value="password" required></div>
        <button type="submit" class="btn btn-primary w-full">{{ __('Sign In') }}</button>
      </form>
      <p style="margin-top: 2rem; font-size: 0.875rem; text-align:center; color: var(--text-muted);">
        {{ __("Don't have an account?") }} 
        <a href="#" id="link-to-register" style="color: var(--accent); font-weight: 600; margin-left: 0.5rem; text-decoration: underline;">{{ __('Register here') }}</a>
      </p>
    </div>
  </section>

  <section id="screen-register" class="auth-layout hidden" style="position: relative;">
    <!-- Floating Language Switcher -->
    <div style="position: absolute; top: 2rem; right: 2rem; display: flex; gap: 0.5rem;">
      <a href="/lang/en" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">EN</a>
      <a href="/lang/fr" style="padding: 0.5rem; border-radius: 6px; background: white; border: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 600; color: var(--primary); text-decoration: none;">FR</a>
    </div>
    <div class="auth-card">
      <div style="margin-bottom: 2rem;">
        <a href="#" onclick="showPortalSelection()" style="color:var(--text-muted); font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; justify-content:center; text-decoration:none;">
          <i data-lucide="arrow-left" style="width:14px;"></i> {{ __('Back to Portals') }}
        </a>
      </div>
      <div class="logo-container" style="color:var(--primary); font-size:2rem; font-weight:bold; margin-bottom: 1.5rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
        <i data-lucide="stethoscope" style="width:32px; height:32px; color:var(--accent);"></i>
        <span>{{ __('MediBook') }}</span>
      </div>
      <h2 style="margin-bottom: 1.5rem; color: var(--primary); text-align:center;">{{ __('Create Account') }}</h2>
      <form id="form-register">
        <input type="hidden" id="reg-role" value="patient">
        <div class="form-group"><input type="text" id="reg-name" class="form-control" placeholder="{{ __('Full Name') }}" required></div>
        <div class="form-group"><input type="email" id="reg-email" class="form-control" placeholder="{{ __('Email Address') }}" required></div>
        <div class="form-group"><input type="password" id="reg-password" class="form-control" placeholder="{{ __('Password') }}" required></div>
        <div class="form-group mb-4"><input type="password" id="reg-password-confirm" class="form-control" placeholder="{{ __('Confirm Password') }}" required></div>
        <button type="submit" class="btn btn-primary w-full">{{ __('Sign Up') }}</button>
      </form>
      <p style="margin-top: 2rem; font-size: 0.875rem; text-align:center; color: var(--text-muted);">
        {{ __('Already have an account?') }} 
        <a href="#" id="link-to-login" style="color: var(--accent); font-weight: 600; margin-left: 0.5rem; text-decoration: underline;">{{ __('Login here') }}</a>
      </p>
    </div>
  </section>

  <!-- ================= DASHBOARD LAYOUT ================= -->
  <div id="dashboard-layout" class="dashboard-layout hidden">
    
    @include('partials.sidebar')

    <main class="main-content">
      
      @include('partials.header')

      <!-- Scrollable Page Content -->
      <div class="page-content">
        
        <!-- Screen: Dashboard (Admin & Doctor) -->
        <div id="screen-dashboard-content" class="dashboard-page">
          <div class="page-header" style="margin-bottom: 2rem;">
            <h1 class="page-title">{{ __('Dashboard') }}</h1>
            <p class="page-subtitle" id="dashboard-welcome-text">{{ __('Welcome back!') }}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card blue">
              <div class="stat-icon-bg"><i data-lucide="calendar"></i></div>
              <div class="stat-value" id="stat-total-today">0</div>
              <div class="stat-label">{{ __("Today's Appointments") }}</div>
            </div>
            <div class="stat-card dark-blue doctor-only" style="background:#1E3A5F; color:white;">
              <div class="stat-icon-bg" style="background:rgba(255,255,255,0.1); color:white;"><i data-lucide="users"></i></div>
              <div class="stat-value" id="stat-total-patients-doctor">0</div>
              <div class="stat-label" style="color:rgba(255,255,255,0.8)">{{ __('Total Patients') }}</div>
            </div>
            <div class="stat-card light-blue doctor-only" style="background:#0EA5E9; color:white;">
              <div class="stat-icon-bg" style="background:rgba(255,255,255,0.2); color:white;"><i data-lucide="clock"></i></div>
              <div class="stat-value" id="stat-upcoming-count">0</div>
              <div class="stat-label" style="color:rgba(255,255,255,0.8)">{{ __('Upcoming') }}</div>
            </div>
            <div class="stat-card green admin-only">
              <div class="stat-icon-bg"><i data-lucide="check-circle"></i></div>
              <div class="stat-value" id="stat-confirmed">0</div>
              <div class="stat-label">{{ __('Confirmed') }}</div>
            </div>
            <div class="stat-card orange admin-only">
              <div class="stat-icon-bg"><i data-lucide="alert-circle"></i></div>
              <div class="stat-value" id="stat-pending">0</div>
              <div class="stat-label">{{ __('Pending') }}</div>
            </div>
            <div class="stat-card red admin-only">
              <div class="stat-icon-bg"><i data-lucide="x-circle"></i></div>
              <div class="stat-value" id="stat-cancelled">0</div>
              <div class="stat-label">{{ __('Cancelled') }}</div>
            </div>
          </div>

          <div class="list-card mt-6">
            <div class="list-header">
              <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
              <span>{{ __("Today's Schedule") }}</span>
            </div>
            <div id="dashboard-today-list">
              <!-- Injected via JS -->
            </div>
          </div>
        </div>

        <!-- Screen: Patient Home (Patient Only) -->
        <section id="screen-patient-home-content" class="dashboard-page hidden">
          <div class="page-header" style="margin-bottom: 2.5rem;">
            <h1 class="page-title" style="font-size: 2.5rem; margin-bottom: 0.5rem;">{{ __('Welcome back,') }} <span id="patient-welcome-name">...</span>!</h1>
            <p class="page-subtitle" style="font-size: 1.125rem;">{{ __('Manage your healthcare appointments') }}</p>
          </div>

          <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 3rem;">
            <div class="grid-card action-card" onclick="switchScreen('screen-book-appointment')" style="cursor:pointer; display:flex; align-items:center; gap:1.5rem; padding: 2rem;">
              <div class="stat-icon-bg" style="position:static; background:#0EA5E9; color:white; width: 64px; height: 64px;">
                <i data-lucide="calendar-plus" style="width:32px;height:32px;"></i>
              </div>
              <div>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">{{ __('Book Appointment') }}</h3>
                <p style="color:var(--text-body);">{{ __('Schedule a new appointment with our doctors') }}</p>
              </div>
            </div>
            <div class="grid-card action-card" onclick="switchScreen('screen-appointments')" style="cursor:pointer; display:flex; align-items:center; gap:1.5rem; padding: 2rem;">
              <div class="stat-icon-bg" style="position:static; background:#1E3A5F; color:white; width: 64px; height: 64px;">
                <i data-lucide="calendar-days" style="width:32px;height:32px;"></i>
              </div>
              <div>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">{{ __('My Appointments') }}</h3>
                <p style="color:var(--text-body);">{{ __('View and manage your scheduled appointments') }}</p>
              </div>
            </div>
          </div>

          <div id="upcoming-appointment-container"></div>
        </section>

        <!-- Screen: My Patients (Doctor Only) -->
        <div id="screen-doctor-patients-content" class="dashboard-page hidden">
          <div class="page-header" style="margin-bottom: 2rem;">
            <h1 class="page-title">{{ __('My Patients') }}</h1>
            <p class="page-subtitle">{{ __('View your patient list and appointment history') }}</p>
          </div>
          <div id="doctor-patients-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            <!-- Rendered via JS -->
          </div>
        </div>

        <!-- Screen: Appointments -->
        <div id="screen-appointments-content" class="dashboard-page hidden">
          <div class="page-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 class="page-title" id="appointments-title">{{ __('Appointments') }}</h1>
              <p class="page-subtitle" id="appointments-subtitle">{{ __('Manage all medical appointments') }}</p>
            </div>
            <button class="btn btn-primary" data-modal="modal-appointment">
              <i data-lucide="plus"></i> {{ __('Add Appointment') }}
            </button>
          </div>

          <div id="patient-appointments-list" class="hidden" style="display:flex; flex-direction:column; gap:1rem;"></div>

          <div id="admin-appointments-table" class="page-table-wrapper">
            <div class="table-toolbar">
              <div class="search-wrapper" style="width: 400px; max-width:100%;">
                <i data-lucide="search"></i>
                <input type="text" id="search-appointments" placeholder="{{ __('Search...') }}" style="background:white; border:1px solid var(--border-color)">
              </div>
            </div>
            <div style="overflow-x:auto;">
              <table>
                <thead>
                  <tr>
                    <th>{{ __('Patient Name') }}</th>
                    <th>{{ __('Doctor') }}</th>
                    <th>{{ __('Service') }}</th>
                    <th>{{ __('Date & Time') }}</th>
                    <th>{{ __('Status') }}</th>
                    <th class="text-right">{{ __('Actions') }}</th>
                  </tr>
                </thead>
                <tbody id="tbody-appointments"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Screen: Services -->
        <div id="screen-services-content" class="dashboard-page hidden">
          <div class="page-header">
            <h1 class="page-title">{{ __('Medical Services') }}</h1>
            <p class="page-subtitle">{{ __('Browse available medical specialties and services') }}</p>
          </div>
          <div id="services-grid" class="grid-view"></div>
        </div>

        <!-- Screen: Users -->
        <div id="screen-users-content" class="dashboard-page hidden">
          <div class="page-header">
            <h1 class="page-title">{{ __('User Management') }}</h1>
            <p class="page-subtitle">{{ __('Manage application users and their roles') }}</p>
          </div>
          <div id="users-grid" class="grid-view"></div>
        </div>

        <!-- Screen: Multi-Step Booking -->
        <section id="screen-book-appointment-content" class="dashboard-page hidden">
          <div style="margin-bottom: 2rem;">
            <a href="#" onclick="switchScreen('screen-patient-home')" style="color:var(--text-body); display:flex; align-items:center; gap:0.5rem; text-decoration:none; font-weight:500;">
              <i data-lucide="arrow-left" style="width:18px;"></i> {{ __('Back to Home') }}
            </a>
            <h1 class="page-title" style="font-size: 2.25rem; margin-top: 1rem;">{{ __('Book Appointment') }}</h1>
            <p class="page-subtitle">{{ __('Complete the steps below to schedule your visit') }}</p>
          </div>

          <div class="stepper" style="display:flex; justify-content:center; align-items:center; gap:1.5rem; margin-bottom: 3rem;">
            <div class="step-circle active" id="step-dot-1">1</div>
            <div class="step-line"></div>
            <div class="step-circle" id="step-dot-2">2</div>
            <div class="step-line"></div>
            <div class="step-circle" id="step-dot-3">3</div>
          </div>

          <div id="booking-step-1" class="booking-step grid-card" style="max-width: 800px; margin: 0 auto; padding: 2.5rem;">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem;">{{ __('Choose Service') }}</h2>
            <div class="form-group mb-6">
              <label class="form-label">{{ __('Select a service') }}</label>
              <select id="booking-select-service" class="form-control" style="height: 50px; background-color: #F1F5F9; border: none;"></select>
            </div>
            <button class="btn btn-primary w-full" style="height: 50px; font-size: 1rem;" onclick="bookingNextStep(2)">{{ __('Next') }}</button>
          </div>

          <div id="booking-step-2" class="booking-step grid-card hidden" style="max-width: 900px; margin: 0 auto; padding: 2.5rem;">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem;">{{ __('Choose Doctor & Time') }}</h2>
            <div class="form-group mb-6">
              <label class="form-label">{{ __('Select a doctor') }}</label>
              <div id="booking-doctor-list" style="display:flex; flex-direction:column; gap:1rem;"></div>
            </div>
            <div class="form-group mb-6">
              <label class="form-label">{{ __('Select date') }}</label>
              <div class="calendar-container grid-card" style="padding: 1.5rem;"><div id="booking-calendar"></div></div>
            </div>
            <div class="form-group mb-8">
              <label class="form-label">{{ __('Select time') }}</label>
              <div id="booking-time-slots" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem;"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
              <button class="btn btn-outline" style="height: 50px;" onclick="bookingPrevStep(1)">{{ __('Back') }}</button>
              <button class="btn btn-primary" style="height: 50px;" onclick="bookingNextStep(3)">{{ __('Next') }}</button>
            </div>
          </div>

          <div id="booking-step-3" class="booking-step grid-card hidden" style="max-width: 800px; margin: 0 auto; padding: 2.5rem;">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem;">{{ __('Confirm Appointment') }}</h2>
            <div style="background:#F8FAFC; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                <div class="mb-4"><p style="color:var(--text-body); font-size: 0.875rem; margin-bottom:0.25rem;">{{ __('Service') }}</p><p id="confirm-service" style="font-weight:600; font-size:1.125rem;">--</p></div>
                <div class="mb-4"><p style="color:var(--text-body); font-size: 0.875rem; margin-bottom:0.25rem;">{{ __('Doctor') }}</p><p id="confirm-doctor" style="font-weight:600; font-size:1.125rem;">--</p></div>
                <div class="mb-4"><p style="color:var(--text-body); font-size: 0.875rem; margin-bottom:0.25rem;">{{ __('Date') }}</p><p id="confirm-date" style="font-weight:600; font-size:1.125rem;">--</p></div>
                <div><p style="color:var(--text-body); font-size: 0.875rem; margin-bottom:0.25rem;">{{ __('Time') }}</p><p id="confirm-time" style="font-weight:600; font-size:1.125rem;">--</p></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:1.5rem;">
              <button class="btn btn-outline" style="height: 50px;" onclick="bookingPrevStep(2)">{{ __('Back') }}</button>
              <button class="btn btn-primary" style="height: 50px; background:#0EA5E9; border-color:#0EA5E9;" onclick="confirmBooking()">{{ __('Confirm Booking') }}</button>
            </div>
          </div>
        </section>

        <!-- Screen: Settings (Profile) -->
        <div id="screen-settings-content" class="dashboard-page hidden">
          <div class="page-header" style="margin-bottom: 2rem;">
            <h1 class="page-title">{{ __('My Profile') }}</h1>
            <p class="page-subtitle">{{ __('Manage your personal information and preferences') }}</p>
          </div>
          <div class="grid-card" style="max-width: 800px; margin: 0 auto; padding: 2.5rem;">
            <div style="display:flex; align-items:center; gap:2rem; margin-bottom:3rem;">
              <div class="user-avatar-lg" style="width:120px; height:120px; font-size:2.5rem;" id="settings-avatar-placeholder">??</div>
              <div>
                <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;" id="profile-name-title">Dr. Sarah Johnson</h2>
                <p style="color:var(--text-body);" id="profile-role-title">Doctor</p>
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
              <div class="form-group"><label class="form-label">{{ __('Full Name') }}</label><input type="text" id="settings-name" class="form-control" style="background:#F1F5F9; border:none;"></div>
              <div class="form-group doctor-only"><label class="form-label">{{ __('Specialty') }}</label><input type="text" class="form-control" style="background:#F1F5F9; border:none;" value="Cardiology"></div>
            </div>
            <div class="form-group mb-6"><label class="form-label">{{ __('Email Address') }}</label><input type="email" id="settings-email" class="form-control" style="background:#F1F5F9; border:none;"></div>
            
            <div class="doctor-only">
              <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--primary);">{{ __('Available hours and days') }}</h3>
              <div class="form-group mb-6"><label class="form-label">{{ __('Working Hours') }}</label><input type="text" class="form-control" style="background:#F1F5F9; border:none;" value="9:00 AM - 5:00 PM"></div>
              <div class="form-group mb-6">
                <label class="form-label">{{ __('Working Days') }}</label>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-top:0.5rem;">
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox" checked> {{ __('Monday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox" checked> {{ __('Tuesday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox" checked> {{ __('Wednesday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox"> {{ __('Thursday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox" checked> {{ __('Friday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox"> {{ __('Saturday') }}</label>
                  <label style="display:flex; align-items:center; gap:0.75rem;"><input type="checkbox"> {{ __('Sunday') }}</label>
                </div>
              </div>
            </div>

            <button class="btn btn-primary w-full" style="height: 50px; background:#1E3A5F;">{{ __('Save Changes') }}</button>
          </div>
        </div>

      </div> <!-- End page-content -->
    </main>
  </div> <!-- End dashboard-layout -->

  <div id="toast-container"></div>

  <!-- Appointment Modal -->
  <div id="modal-appointment" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modal-appointment-title">{{ __('Manage Appointment') }}</h3>
        <button class="modal-close"><i data-lucide="x"></i></button>
      </div>
      <form id="form-appointment">
        <div class="modal-body">
          <input type="hidden" id="appointment-id">
          
          <div class="modal-form-grid">
            <div class="form-group modal-form-full" id="patient-select-group">
              <label class="form-label">{{ __('Patient') }}</label>
              <select id="select-patient" class="form-control" required></select>
            </div>
            
            <div class="form-group" id="doctor-select-group">
              <label class="form-label">{{ __('Doctor') }}</label>
              <select id="select-doctor" class="form-control" required></select>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Service') }}</label>
              <select id="select-service" class="form-control" required></select>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Date') }}</label>
              <input type="date" id="appointment-date" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Time') }}</label>
              <input type="time" id="appointment-time" class="form-control" required>
            </div>
            
            <div class="form-group modal-form-full" id="status-select-group">
              <label class="form-label">{{ __('Status') }}</label>
              <select id="appointment-status" class="form-control" required>
                <option value="Pending">{{ __('Pending') }}</option>
                <option value="Confirmed">{{ __('Confirmed') }}</option>
                <option value="Cancelled">{{ __('Cancelled') }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline modal-cancel">{{ __('Cancel') }}</button>
          <button type="submit" class="btn btn-primary" style="min-width: 160px;">{{ __('Save Appointment') }}</button>
        </div>
      </form>
    </div>
  </div>
@endsection

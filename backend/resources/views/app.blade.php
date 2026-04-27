@extends('layouts.app')

@section('title', __('Medical Cabinet - Dashboard'))

@section('body')
  <script>
    window.__INITIAL_DATA__ = @json($initialData ?? []);
  </script>
  <!-- ================= AUTH SCREENS ================= -->
  <section id="screen-login" class="auth-layout" style="background: #F8FAFC; position: relative;">
    <div class="entrance-lang-toggle">
      <a href="/lang/en" class="{{ app()->getLocale() == 'en' ? 'active' : '' }}">EN</a>
      <a href="/lang/fr" class="{{ app()->getLocale() == 'fr' ? 'active' : '' }}">FR</a>
    </div>
    <div class="auth-card">
      <div class="auth-card-brand">
        <i data-lucide="stethoscope" class="auth-card-brand-icon" aria-hidden="true"></i>
        <span class="auth-card-wordmark">{{ __('MediBook') }}</span>
      </div>
      <h2 id="login-role-title" style="margin-bottom: 1.5rem; color: var(--primary); text-align:center;">{{ __('Sign in') }}</h2>
      <form id="form-login" method="POST" action="{{ route('web.login') }}">
        @csrf
        <div class="form-group"><input type="email" id="login-email" name="email" class="form-control" placeholder="{{ __('Email') }}" required autocomplete="email"></div>
        <div class="form-group mb-4"><input type="password" id="login-password" name="password" class="form-control" placeholder="{{ __('Password') }}" required autocomplete="current-password"></div>
        <button type="submit" class="btn btn-primary w-full">{{ __('Sign In') }}</button>
      </form>
      <p style="margin-top: 2rem; font-size: 0.875rem; text-align:center; color: var(--text-muted);">
        {{ __("Don't have an account?") }} 
        <a href="#" id="link-to-register" style="color: var(--accent); font-weight: 600; margin-left: 0.5rem; text-decoration: underline;">{{ __('Register here') }}</a>
      </p>
    </div>
  </section>

  <section id="screen-register" class="auth-layout hidden" style="background: #F8FAFC; position: relative;">
    <div class="entrance-lang-toggle">
      <a href="/lang/en" class="{{ app()->getLocale() == 'en' ? 'active' : '' }}">EN</a>
      <a href="/lang/fr" class="{{ app()->getLocale() == 'fr' ? 'active' : '' }}">FR</a>
    </div>
    <div class="auth-card">
      <div class="auth-card-brand">
        <i data-lucide="stethoscope" class="auth-card-brand-icon" aria-hidden="true"></i>
        <span class="auth-card-wordmark">{{ __('MediBook') }}</span>
      </div>
      <h2 style="margin-bottom: 1.5rem; color: var(--primary); text-align:center;">{{ __('Create Account') }}</h2>
      <p style="text-align:center; color:var(--text-muted); font-size:0.875rem; margin-bottom:1.5rem;">{{ __('You will be registered as a patient. An administrator can grant doctor access later.') }}</p>
      <form id="form-register" method="POST" action="{{ route('web.register') }}">
        @csrf
        <div class="form-group"><input type="text" id="reg-name" name="name" class="form-control" placeholder="{{ __('Full Name') }}" required></div>
        <div class="form-group"><input type="email" id="reg-email" name="email" class="form-control" placeholder="{{ __('Email Address') }}" required></div>
        <div class="form-group"><input type="password" id="reg-password" name="password" class="form-control" placeholder="{{ __('Password') }}" required></div>
        <div class="form-group mb-4"><input type="password" id="reg-password-confirm" name="password_confirmation" class="form-control" placeholder="{{ __('Confirm Password') }}" required></div>
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
        <div id="screen-dashboard-content" class="dashboard-page staff-dashboard">
          <header class="staff-dashboard-header">
            <div>
              <h1 class="page-title staff-dashboard-title">{{ __('Dashboard') }}</h1>
              <p class="page-subtitle staff-dashboard-subtitle" id="dashboard-welcome-text">{{ __('Welcome back!') }}</p>
            </div>
          </header>

          <div class="staff-stats-grid">
            <article class="staff-stat-card staff-stat-card--neutral">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="calendar"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-total-today">0</div>
                <div class="staff-stat-card__label">{{ __("Today's Appointments") }}</div>
              </div>
            </article>
            <article class="staff-stat-card staff-stat-card--neutral doctor-only">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="users"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-total-patients-doctor">0</div>
                <div class="staff-stat-card__label">{{ __('Total Patients') }}</div>
              </div>
            </article>
            <article class="staff-stat-card staff-stat-card--neutral doctor-only">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="clock"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-upcoming-count">0</div>
                <div class="staff-stat-card__label">{{ __('Planned') }}</div>
              </div>
            </article>
            <article class="staff-stat-card staff-stat-card--confirmed admin-only">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="check-circle"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-confirmed">0</div>
                <div class="staff-stat-card__label">{{ __('Confirmed') }}</div>
              </div>
            </article>
            <article class="staff-stat-card staff-stat-card--pending admin-only">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="alert-circle"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-pending">0</div>
                <div class="staff-stat-card__label">{{ __('Pending') }}</div>
              </div>
            </article>
            <article class="staff-stat-card staff-stat-card--cancelled admin-only">
              <div class="staff-stat-card__icon" aria-hidden="true"><i data-lucide="x-circle"></i></div>
              <div class="staff-stat-card__main">
                <div class="staff-stat-card__value" id="stat-cancelled">0</div>
                <div class="staff-stat-card__label">{{ __('Cancelled') }}</div>
              </div>
            </article>
          </div>

          <div class="list-card staff-schedule-card mt-6">
            <div class="list-header staff-schedule-card__header">
              <i data-lucide="clock" class="staff-schedule-card__header-icon" aria-hidden="true"></i>
              <span>{{ __("Today's Schedule") }}</span>
            </div>
            <div id="dashboard-today-list" class="staff-schedule-card__body">
              <!-- Injected via JS -->
            </div>
          </div>
        </div>

        <!-- Screen: Patient Home (Patient Only) -->
        <section id="screen-patient-home-content" class="dashboard-page hidden patient-home-screen">
          <div class="page-header patient-home-header">
            <h1 class="page-title patient-home-title">{{ __('Dashboard') }}</h1>
            <p class="page-subtitle">{{ __('Manage your health journey and upcoming visits') }}</p>
          </div>

          <div class="patient-home-layout">
            <!-- Main Column: Welcome & Next Appointment -->
            <div class="patient-home-main">
              <div class="grid-card patient-welcome-card">
                <div class="patient-welcome-content">
                  <h2 class="patient-welcome-title">{{ __('Welcome back,') }} <span id="patient-welcome-name">--</span>!</h2>
                  <p class="patient-welcome-description">{{ __('Your health is our priority. You can easily book new appointments or check your medical history below.') }}</p>
                  <button class="btn patient-welcome-cta" onclick="switchScreen('screen-book-appointment')">
                    <i data-lucide="plus-circle"></i> {{ __('Book Now') }}
                  </button>
                </div>
                <i data-lucide="stethoscope" class="patient-welcome-icon"></i>
              </div>

              <div id="upcoming-appointment-container" class="patient-next-visit">
                <!-- Injected via JS -->
              </div>
            </div>

            <!-- Side Column: Quick Stats -->
            <aside class="patient-home-side">
              <div class="grid-card patient-panel">
                <h3 class="patient-panel-title">{{ __('Quick Actions') }}</h3>
                <div class="patient-panel-actions">
                  <button class="btn btn-outline w-full patient-quick-action" onclick="switchScreen('screen-appointments')">
                    <i data-lucide="calendar" class="patient-action-icon accent"></i> {{ __('My Schedule') }}
                  </button>
                  <button class="btn btn-outline w-full patient-quick-action" onclick="switchScreen('screen-settings')">
                    <i data-lucide="user" class="patient-action-icon primary"></i> {{ __('Account Settings') }}
                  </button>
                </div>
              </div>

              <div class="grid-card patient-panel">
                <h3 class="patient-panel-title">{{ __('Need Help?') }}</h3>
                <p class="patient-help-text">{{ __('Contact our medical team if you have any questions regarding your appointments.') }}</p>
                <div class="patient-help-contact">
                  <i data-lucide="phone-call"></i> +212 5XX XX XX XX
                </div>
              </div>
            </aside>
          </div>
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

          <div class="table-toolbar appointments-search-toolbar" style="margin-bottom: 1rem;">
            <div class="search-wrapper" style="width: 400px; max-width:100%;">
              <i data-lucide="search"></i>
              <input type="text" id="search-appointments" placeholder="{{ __('Search for appointments...') }}" autocomplete="off" style="background:white; border:1px solid var(--border-color)">
            </div>
          </div>

          <div id="patient-appointments-list" class="hidden" style="display:flex; flex-direction:column; gap:1rem;"></div>

          <div id="admin-appointments-table" class="page-table-wrapper">
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

        <!-- Screen: Admin — Doctors -->
        <div id="screen-admin-doctors-content" class="dashboard-page hidden">
          <div class="page-header">
            <h1 class="page-title">{{ __('Doctors') }}</h1>
            <p class="page-subtitle">{{ __('Manage doctor accounts and permissions') }}</p>
          </div>
          <div id="admin-doctors-grid" class="grid-view"></div>
        </div>

        <!-- Screen: Admin — Patients -->
        <div id="screen-admin-patients-content" class="dashboard-page hidden">
          <div class="page-header">
            <h1 class="page-title">{{ __('Patients') }}</h1>
            <p class="page-subtitle">{{ __('Manage patient accounts and promote users to doctor') }}</p>
          </div>
          <div id="admin-patients-grid" class="grid-view"></div>
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

          <div class="stepper" style="display:flex; justify-content:center; align-items:center; gap:1.5rem; margin-bottom: 4rem;">
            <div class="step-circle active" id="step-dot-1">1</div>
            <div class="step-line"></div>
            <div class="step-circle" id="step-dot-2">2</div>
            <div class="step-line"></div>
            <div class="step-circle" id="step-dot-3">3</div>
            <div class="step-line"></div>
            <div class="step-circle" id="step-dot-4">4</div>
          </div>

          <div id="booking-step-1" class="booking-step" style="max-width: 1000px; margin: 0 auto;">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem; text-align: center; color: var(--primary); font-weight: 700;">{{ __('What kind of medical service do you need?') }}</h2>
            <div id="booking-service-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
               <!-- Rendered as big clickable cards in JS -->
            </div>
          </div>

          <div id="booking-step-2" class="booking-step hidden" style="max-width: 1000px; margin: 0 auto;">
            <h2 style="font-size: 1.5rem; margin-bottom: 2rem; text-align: center; color: var(--primary); font-weight: 700;">{{ __('Choose your Doctor') }}</h2>
            <div id="booking-doctor-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
               <!-- Rendered as big clickable cards in JS -->
            </div>
            <div style="text-align: center;">
              <button class="btn btn-outline" style="padding: 0.75rem 3rem;" onclick="bookingPrevStep(1)">{{ __('Back') }}</button>
            </div>
          </div>

          <div id="booking-step-3" class="booking-step booking-step-window hidden">
            <h2 class="booking-step-title">{{ __('When would you like to visit?') }}</h2>
            <div class="booking-step-grid">
                <div class="grid-card booking-step-panel">
                  <p class="booking-step-panel-title"><i data-lucide="calendar"></i> {{ __('1. Select a Date') }}</p>
                  <div id="booking-calendar"></div>
                </div>
                <div class="grid-card booking-step-panel">
                  <p class="booking-step-panel-title"><i data-lucide="clock"></i> {{ __('2. Select a Time') }}</p>
                  <div id="booking-time-slots" class="booking-time-grid"></div>
                </div>
            </div>
            <div class="booking-step-actions">
              <button class="btn btn-outline booking-step-btn" onclick="bookingPrevStep(2)">{{ __('Back') }}</button>
              <button id="btn-to-step-4" class="btn btn-primary booking-step-btn hidden" onclick="bookingNextStep(4)">{{ __('Next') }}</button>
            </div>
          </div>

          <div id="booking-step-4" class="booking-step grid-card hidden" style="max-width: 600px; margin: 0 auto; padding: 3rem; text-align: center;">
            <div style="background: #F0F9FF; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;">
               <i data-lucide="check-circle" style="width:40px; height:40px; color: var(--accent);"></i>
            </div>
            <h2 style="font-size: 1.75rem; margin-bottom: 1rem; color: var(--primary);">{{ __('Confirm your booking') }}</h2>
            <p style="color: var(--text-body); margin-bottom: 2.5rem;">{{ __('Please review your appointment details before confirming.') }}</p>
            
            <div style="background:#F8FAFC; padding: 2rem; border-radius: 16px; margin-bottom: 2.5rem; text-align: left; border: 1px solid #F1F5F9;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; padding-bottom: 1rem; border-bottom: 1px solid #EDF2F7;">
                    <span style="color:var(--text-muted);">{{ __('Service') }}</span>
                    <span id="confirm-service" style="font-weight:700; color:var(--primary);">--</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; padding-bottom: 1rem; border-bottom: 1px solid #EDF2F7;">
                    <span style="color:var(--text-muted);">{{ __('Doctor') }}</span>
                    <span id="confirm-doctor" style="font-weight:700; color:var(--primary);">--</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem; padding-bottom: 1rem; border-bottom: 1px solid #EDF2F7;">
                    <span style="color:var(--text-muted);">{{ __('Date') }}</span>
                    <span id="confirm-date" style="font-weight:700; color:var(--primary);">--</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">{{ __('Time') }}</span>
                    <span id="confirm-time" style="font-weight:700; color:var(--primary);">--</span>
                </div>
            </div>

            <div id="booking-confirmation-feedback" class="booking-confirmation-feedback hidden" role="status" aria-live="polite">
              <i data-lucide="check-circle" class="booking-confirmation-feedback-icon" aria-hidden="true"></i>
              <span id="booking-confirmation-feedback-text"></span>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <button class="btn btn-outline" style="height: 50px;" onclick="bookingPrevStep(3)">{{ __('Back') }}</button>
                <button id="btn-confirm-booking" class="btn btn-primary" style="height: 50px;" onclick="handleConfirmBooking()">{{ __('Confirm Booking') }}</button>
            </div>
          </div>
        </section>

        <!-- Screen: Settings (Profile) -->
        <div id="screen-settings-content" class="dashboard-page hidden">
          <div class="page-header" style="margin-bottom: 2.5rem;">
            <h1 class="page-title">{{ __('My Profile') }}</h1>
            <p class="page-subtitle">{{ __('Manage your personal information and preferences') }}</p>
          </div>

          <div class="settings-grid" style="display:grid; grid-template-columns: 320px 1fr; gap: 2.5rem; align-items: start;">
            <!-- Left: Profile Card -->
            <div class="grid-card" style="text-align: center; padding: 3rem 2rem;">
              <div class="user-avatar-lg" style="width:140px; height:140px; font-size:3rem; margin: 0 auto 2rem; border: 4px solid var(--background); box-shadow: var(--shadow-md);" id="settings-avatar-placeholder">??</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary);" id="profile-name-title">--</h2>
              <p style="color:var(--accent); font-weight: 600; margin-bottom: 2rem;" id="profile-role-title">--</p>
              
              <div style="text-align: left; background: #F8FAFC; padding: 1.5rem; border-radius: 12px; margin-top: 1rem;">
                <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">{{ __('Member Since') }}</p>
                <p style="font-weight: 600; color: var(--primary);">April 2026</p>
              </div>
            </div>

            <!-- Right: Settings Form -->
            <div class="grid-card" style="padding: 3rem;">
              <div style="margin-bottom: 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid #F1F5F9;">
                <h3 style="font-size: 1.25rem; color: var(--primary);">{{ __('Account Information') }}</h3>
              </div>
              
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
                <div class="form-group"><label class="form-label">{{ __('Full Name') }}</label><input type="text" id="settings-name" class="form-control" style="background:#F8FAFC;"></div>
                <div class="form-group doctor-only"><label class="form-label">{{ __('Specialty') }}</label><input type="text" id="settings-specialty" class="form-control" style="background:#F8FAFC;" placeholder="{{ __('Not specified') }}"></div>
              </div>
              <div class="form-group mb-8"><label class="form-label">{{ __('Email Address') }}</label><input type="email" id="settings-email" class="form-control" style="background:#F8FAFC;"></div>
              
              <div style="margin-top: 4rem; text-align: right;">
                <button class="btn btn-primary" style="padding: 0.75rem 3rem; background: var(--primary); font-size: 1rem;">{{ __('Save Profile') }}</button>
              </div>
            </div>
          </div>
        </div>

      </div> <!-- End page-content -->

      <footer class="app-footer" role="contentinfo">
        <p>{{ __('MediBook') }} — {{ date('Y') }}. {{ __('All rights reserved.') }}</p>
      </footer>
    </main>
  </div> <!-- End dashboard-layout -->

  <!-- Confirm (delete / cancel / critical actions) -->
  <div id="modal-confirm" class="modal-overlay" aria-modal="true" role="dialog" aria-labelledby="modal-confirm-title">
    <div class="modal-card modal-card--confirm">
      <div class="modal-header">
        <h3 id="modal-confirm-title"></h3>
        <button type="button" class="modal-close" aria-label="{{ __('Close') }}"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p id="modal-confirm-message" class="modal-confirm-message"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline modal-cancel">{{ __('Cancel') }}</button>
        <button type="button" class="btn btn-primary" id="modal-confirm-ok"></button>
      </div>
    </div>
  </div>

  <!-- Appointment Modal -->
  <div id="modal-appointment" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modal-appointment-title">{{ __('Manage Appointment') }}</h3>
        <button class="modal-close"><i data-lucide="x"></i></button>
      </div>
      <form id="form-appointment" method="POST" action="{{ route('web.appointments.store') }}">
        @csrf
        <input type="hidden" id="appointment-method" name="_method" value="POST">
        <div class="modal-body">
          <input type="hidden" id="appointment-id">
          
          <div class="modal-form-grid">
            <div class="form-group modal-form-full" id="patient-select-group">
              <label class="form-label">{{ __('Patient') }}</label>
              <select id="select-patient" name="patient_id" class="form-control" required></select>
            </div>
            
            <div class="form-group" id="doctor-select-group">
              <label class="form-label">{{ __('Doctor') }}</label>
              <select id="select-doctor" name="doctor_id" class="form-control" required></select>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Service') }}</label>
              <select id="select-service" name="service_id" class="form-control" required></select>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Date') }}</label>
              <input type="date" id="appointment-date" name="appointment_date" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ __('Time') }}</label>
              <input type="time" id="appointment-time" name="appointment_time" class="form-control" required>
            </div>
            
            <div class="form-group modal-form-full" id="status-select-group">
              <label class="form-label">{{ __('Status') }}</label>
              <select id="appointment-status" name="status" class="form-control" required>
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

  <form id="form-logout" method="POST" action="{{ route('web.logout') }}" class="hidden">
    @csrf
  </form>
@endsection

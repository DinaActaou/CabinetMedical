@extends('layouts.app')

@section('title', __('Medical Cabinet - Dashboard'))

@section('body')
  <!-- ================= AUTH SCREENS ================= -->
  <section id="screen-login" class="auth-layout">
    <div class="auth-card">
      <div class="logo-container" style="color:var(--primary); font-size:2rem; font-weight:bold; margin-bottom: 2rem;">
        {{ __('Medical Cabinet') }}
      </div>
      <h2 style="margin-bottom: 1.5rem; color: var(--primary);">{{ __('Login') }}</h2>
      <form id="form-login">
        <div class="form-group"><input type="email" id="login-email" class="form-control" placeholder="{{ __('Email') }}" value="doctor@medibook.com" required></div>
        <div class="form-group mb-4"><input type="password" id="login-password" class="form-control" placeholder="{{ __('Password') }}" value="password" required></div>
        <button type="submit" class="btn btn-primary w-full">{{ __('Sign In') }}</button>
      </form>
      <p style="margin-top: 1.5rem; font-size: 0.875rem;">
        {{ __("Don't have an account?") }} <a href="#" id="link-to-register">{{ __('Register here') }}</a>
      </p>
    </div>
  </section>

  <section id="screen-register" class="auth-layout hidden">
    <div class="auth-card">
      <div class="logo-container" style="color:var(--primary); font-size:2rem; font-weight:bold; margin-bottom: 2rem;">
        {{ __('Medical Cabinet') }}
      </div>
      <h2 style="margin-bottom: 1.5rem; color: var(--primary);">{{ __('Register') }}</h2>
      <form id="form-register">
        <div class="form-group"><input type="text" id="reg-name" class="form-control" placeholder="{{ __('Full Name') }}" required></div>
        <div class="form-group"><input type="email" id="reg-email" class="form-control" placeholder="{{ __('Email') }}" required></div>
        <div class="form-group">
          <select id="reg-role" class="form-control" required>
            <option value="patient">{{ __('Patient') }}</option>
            <option value="doctor">{{ __('Doctor') }}</option>
          </select>
        </div>
        <div class="form-group"><input type="password" id="reg-password" class="form-control" placeholder="{{ __('Password') }}" required></div>
        <div class="form-group mb-4"><input type="password" id="reg-password-confirm" class="form-control" placeholder="{{ __('Confirm Password') }}" required></div>
        <button type="submit" class="btn btn-primary w-full">{{ __('Register') }}</button>
      </form>
      <p style="margin-top: 1.5rem; font-size: 0.875rem;">
        {{ __('Already have an account?') }} <a href="#" id="link-to-login">{{ __('Login here') }}</a>
      </p>
    </div>
  </section>

  <!-- ================= DASHBOARD LAYOUT ================= -->
  <div id="dashboard-layout" class="dashboard-layout hidden">
    
    @include('partials.sidebar')

    <!-- Main Content -->
    <main class="main-content">
      
      @include('partials.header')

      <!-- Scrollable Page Content -->
      <div class="page-content">
        
        <!-- Screen: Dashboard -->
        <div id="screen-dashboard-content" class="dashboard-page">
          <h1 class="page-title">{{ __('Dashboard') }}</h1>
          <p class="page-subtitle">{{ __('Welcome back!') }} {{ __("Here's your overview for today.") }}</p>
          
          <!-- Stat Cards -->
          <div class="stats-grid">
            <div class="stat-card blue">
              <div class="stat-icon-bg"><i data-lucide="calendar" style="width:20px;height:20px;"></i></div>
              <div class="stat-chip">+12%</div>
              <div class="stat-value" id="stat-total-today">0</div>
              <div class="stat-label">{{ __('Total Appointments Today') }}</div>
            </div>
            <div class="stat-card orange">
              <div class="stat-icon-bg"><i data-lucide="clock" style="width:20px;height:20px;"></i></div>
              <div class="stat-chip">+3</div>
              <div class="stat-value" id="stat-pending">0</div>
              <div class="stat-label">{{ __('Pending') }}</div>
            </div>
            <div class="stat-card green">
              <div class="stat-icon-bg"><i data-lucide="check-circle-2" style="width:20px;height:20px;"></i></div>
              <div class="stat-chip">+5</div>
              <div class="stat-value" id="stat-confirmed">0</div>
              <div class="stat-label">{{ __('Confirmed') }}</div>
            </div>
            <div class="stat-card red">
              <div class="stat-icon-bg"><i data-lucide="x-circle" style="width:20px;height:20px;"></i></div>
              <div class="stat-chip">-2</div>
              <div class="stat-value" id="stat-cancelled">0</div>
              <div class="stat-label">{{ __('Cancelled') }}</div>
            </div>
          </div>

          <!-- Summaries -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon"><i data-lucide="users" style="width:24px;height:24px;"></i></div>
              <div>
                <div class="summary-value" id="stat-total-patients">0</div>
                <div class="summary-label">{{ __('Total Patients') }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon"><i data-lucide="activity" style="width:24px;height:24px;"></i></div>
              <div>
                <div class="summary-value" id="stat-active-doctors">0</div>
                <div class="summary-label">{{ __('Active Doctors') }}</div>
              </div>
            </div>
          </div>

          <!-- Today's List -->
          <div class="list-card">
            <div class="list-header">
              <div style="background:#F0F9FF; color:var(--accent); width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="calendar" style="width:16px;height:16px;"></i>
              </div>
              <span>{{ __("Today's Appointments") }}</span>
            </div>
            <div id="dashboard-today-list">
              <!-- Injected via JS -->
            </div>
          </div>
        </div>

        <!-- Screen: Appointments -->
        <div id="screen-appointments-content" class="dashboard-page hidden">
          <div class="d-flex justify-between align-center mb-6">
            <div>
              <h1 class="page-title">{{ __('Appointments') }}</h1>
              <p class="page-subtitle mb-0">{{ __('Manage all medical appointments') }}</p>
            </div>
            <button class="btn btn-primary" data-modal="modal-appointment">
              <i data-lucide="plus" style="width:16px;height:16px"></i> <span>{{ __('Add Appointment') }}</span>
            </button>
          </div>
          
          <div class="page-table-wrapper">
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
                <tbody id="tbody-appointments">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Screen: Services -->
        <div id="screen-services-content" class="dashboard-page hidden">
          <h1 class="page-title">{{ __('Our Services') }}</h1>
          <p class="page-subtitle">{{ __('Comprehensive medical services for your health needs') }}</p>
          
          <div class="grid-view" id="services-grid">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- Screen: Users -->
        <div id="screen-users-content" class="dashboard-page hidden">
          <h1 class="page-title">{{ __('Users') }}</h1>
          <p class="page-subtitle">{{ __('Manage medical staff and administrators') }}</p>
          
          <div class="grid-view" id="users-grid">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- Screen: Settings -->
        <div id="screen-settings-content" class="dashboard-page hidden">
          <h1 class="page-title">{{ __('Settings') }}</h1>
          <p class="page-subtitle">{{ __('Manage your account and application preferences') }}</p>
          
          <div class="settings-grid">
            <div class="settings-panel">
              <div class="settings-title">{{ __('Account Settings') }}</div>
              <div class="form-group">
                <label class="form-label">{{ __('Full Name') }}</label>
                <input type="text" id="settings-name" class="form-control" value="Dr. John Doe">
              </div>
              <div class="form-group">
                <label class="form-label">{{ __('Email') }}</label>
                <input type="text" id="settings-email" class="form-control" value="john.doe@medical.com">
              </div>
              <div class="form-group mb-4">
                <label class="form-label">{{ __('Phone Number') }}</label>
                <input type="text" class="form-control" value="+33 1 23 45 67 89">
              </div>
              <button class="btn" style="background:var(--text-main); color:white;">{{ __('Save Changes') }}</button>
            </div>

            <div class="settings-panel">
              <div class="settings-title">{{ __('Notifications') }}</div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <strong>{{ __('Email Notifications') }}</strong>
                  <span>{{ __('Receive email updates for new appointments') }}</span>
                </div>
                <label class="switch">
                  <input type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <strong>{{ __('SMS Notifications') }}</strong>
                  <span>{{ __('Get SMS alerts for urgent updates') }}</span>
                </div>
                <label class="switch">
                  <input type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row mb-0">
                <div class="toggle-info">
                  <strong>{{ __('Desktop Notifications') }}</strong>
                  <span>{{ __('Show browser notifications') }}</span>
                </div>
                <label class="switch">
                  <input type="checkbox">
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-panel">
              <div class="settings-title">{{ __('Working Hours') }}</div>
              <div class="d-flex gap-4 mb-4">
                <div style="flex:1">
                  <label class="form-label">{{ __('Start Time') }}</label>
                  <div style="position:relative">
                    <input type="time" class="form-control" value="09:00">
                    <i data-lucide="clock" style="position:absolute; right:12px; top:10px; width:16px; color:#94A3B8;"></i>
                  </div>
                </div>
                <div style="flex:1">
                  <label class="form-label">{{ __('End Time') }}</label>
                  <div style="position:relative">
                    <input type="time" class="form-control" value="18:00">
                    <i data-lucide="clock" style="position:absolute; right:12px; top:10px; width:16px; color:#94A3B8;"></i>
                  </div>
                </div>
              </div>
              <label class="form-label">{{ __('Working Days') }}</label>
              <div class="days-row">
                <button class="day-btn active">Mon</button>
                <button class="day-btn active">Tue</button>
                <button class="day-btn active">Wed</button>
                <button class="day-btn active">Thu</button>
                <button class="day-btn active">Fri</button>
                <button class="day-btn">Sat</button>
                <button class="day-btn">Sun</button>
              </div>
            </div>

            <div class="settings-panel">
              <div class="settings-title">{{ __('Security') }}</div>
              <div class="form-group">
                <label class="form-label">{{ __('Current Password') }}</label>
                <input type="password" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">{{ __('New Password') }}</label>
                <input type="password" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">{{ __('Confirm New Password') }}</label>
                <input type="password" class="form-control">
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <!-- ================= MODALS & TOASTS ================= -->
  <div class="modal-overlay" id="modal-appointment">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">{{ __('New Appointment') }}</div>
        <i data-lucide="x" class="modal-close"></i>
      </div>
      <form id="form-appointment">
        <input type="hidden" id="appointment-id">
        <div class="modal-body">
          <div class="form-group mb-4">
            <label class="form-label">{{ __('Status') }}</label>
            <select id="appointment-status" class="form-control">
                <option value="Pending">{{ __('Pending') }}</option>
                <option value="Confirmed">{{ __('Confirmed') }}</option>
                <option value="Cancelled">{{ __('Cancelled') }}</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label class="form-label">{{ __('Patient') }}</label>
            <select id="select-patient" class="form-control" required>
                <option value="">{{ __('Select a patient...') }}</option>
            </select>
          </div>
          <div class="d-flex gap-4 mb-4">
            <div class="form-group" style="flex:1">
              <label class="form-label">{{ __('Doctor') }}</label>
              <select id="select-doctor" class="form-control" required>
                  <option value="">{{ __('Select a doctor...') }}</option>
              </select>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">{{ __('Service') }}</label>
              <select id="select-service" class="form-control" required>
                  <option value="">{{ __('Select a service...') }}</option>
              </select>
            </div>
          </div>
          <div class="d-flex gap-4 mb-4">
            <div class="form-group" style="flex:1">
              <label class="form-label">{{ __('Date') }}</label>
              <input type="date" id="appointment-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">{{ __('Time') }}</label>
              <input type="time" id="appointment-time" class="form-control" required>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline modal-cancel">{{ __('Cancel') }}</button>
          <button type="submit" class="btn btn-primary">{{ __('Confirm') }}</button>
        </div>
      </form>
    </div>
  </div>
@endsection

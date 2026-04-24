<!-- Sidebar -->
<aside id="sidebar" class="sidebar">
  <div class="sidebar-header">
    <div style="background:var(--accent); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white;">
      <i data-lucide="stethoscope" style="width:20px;height:20px;"></i>
    </div>
    <div style="color:white; font-size:1.125rem; font-weight:700; line-height:1.2;">
      {!! __('Medical <br> Cabinet') !!}
    </div>
  </div>
  <div class="sidebar-nav">
    <a href="#" data-target="screen-dashboard" class="nav-item active">
      <i data-lucide="layout-grid" style="width: 18px; height: 18px;"></i> <span>{{ __('Dashboard') }}</span>
    </a>
    <a href="#" data-target="screen-appointments" class="nav-item">
      <i data-lucide="calendar" style="width: 18px; height: 18px;"></i> <span>{{ __('Appointments') }}</span>
    </a>
    <a href="#" data-target="screen-services" class="nav-item">
      <i data-lucide="stethoscope" style="width: 18px; height: 18px;"></i> <span>{{ __('Services') }}</span>
    </a>
    <a href="#" data-target="screen-users" class="nav-item">
      <i data-lucide="users" style="width: 18px; height: 18px;"></i> <span>{{ __('Users') }}</span>
    </a>
    <a href="#" data-target="screen-settings" class="nav-item">
      <i data-lucide="settings" style="width: 18px; height: 18px;"></i> <span>{{ __('Settings') }}</span>
    </a>
  </div>

  <div style="padding: 1rem; margin-top: auto;">
    <button id="btn-logout" class="nav-item" style="width: 100%; border: none; background: transparent; cursor: pointer; color: #fca5a5;">
       <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> <span>{{ __('Logout') }}</span>
    </button>
  </div>
  
  <div style="padding:1.5rem; text-align:center; font-size:0.75rem; color:#94A3B8;">
    © 2026 Medical Cabinet
  </div>
</aside>

<!-- Top Header -->
<header class="top-header">
  <div class="header-left">
    <div class="logo-container" style="display:flex; align-items:center; gap:0.75rem;">
        <i data-lucide="stethoscope" style="width:32px; height:32px; color:var(--accent);"></i>
        <span style="font-weight:700; font-size:1.25rem; color:var(--primary);">MediBook</span>
    </div>
  </div>
  
  <div class="header-right">
    <nav class="patient-nav" style="display:none; gap: 0.75rem; align-items:center; margin-right: 2rem;">
      <a href="#" class="nav-item active" data-target="screen-patient-home" style="display:flex; align-items:center; gap:0.5rem; padding: 0.5rem 1rem; border-radius: 8px;">
        <i data-lucide="layout-dashboard" style="width:18px;"></i> {{ __('Dashboard') }}
      </a>
      <a href="#" class="nav-item" data-target="screen-book-appointment" style="display:flex; align-items:center; gap:0.5rem; padding: 0.5rem 1rem; border-radius: 8px;">
        <i data-lucide="plus-circle" style="width:18px;"></i> {{ __('Book Appointment') }}
      </a>
      <a href="#" class="nav-item" data-target="screen-appointments" style="display:flex; align-items:center; gap:0.5rem; padding: 0.5rem 1rem; border-radius: 8px;">
        <i data-lucide="history" style="width:18px;"></i> {{ __('My History') }}
      </a>
      <a href="#" class="nav-item" data-target="screen-settings" style="display:flex; align-items:center; gap:0.5rem; padding: 0.5rem 1rem; border-radius: 8px;">
        <i data-lucide="user" style="width:18px;"></i> {{ __('Profile') }}
      </a>
    </nav>

    <div class="lang-toggle" style="margin-right: 1.5rem;">
      <a href="/lang/en" class="{{ App::getLocale() == 'en' ? 'active' : '' }}">EN</a>
      <a href="/lang/fr" class="{{ App::getLocale() == 'fr' ? 'active' : '' }}">FR</a>
    </div>
    
    <div class="notification-bell" id="notification-trigger" style="margin-right: 1.5rem;">
      <i data-lucide="bell" style="width:20px;height:20px;"></i>
      @if(auth()->check() && auth()->user()->unreadNotifications->count() > 0)
        <div class="notification-badge">{{ auth()->user()->unreadNotifications->count() }}</div>
      @endif
      
      <div class="notifications-dropdown" id="notifications-panel">
        <div class="notifications-header">
          {{ __('Notifications') }}
          <span class="mark-read">{{ __('Mark all as read') }}</span>
        </div>
        <div class="notifications-list" id="notifications-list">
          @if(auth()->check())
            @forelse(auth()->user()->unreadNotifications as $notification)
              <div class="notification-item unread">
                <div class="notif-icon appointment"><i data-lucide="calendar"></i></div>
                <div class="notif-content">
                  <p><strong>{{ $notification->data['title'] }}</strong>: {{ $notification->data['message'] }}</p>
                  <span>{{ $notification->created_at->diffForHumans() }}</span>
                </div>
              </div>
            @empty
              <div style="padding: 2rem; text-align: center; color: var(--text-body); font-size: 0.875rem;">
                {{ __('No new notifications') }}
              </div>
            @endforelse
          @endif
        </div>
      </div>
    </div>
    
    <div class="user-profile">
      <div class="avatar" id="current-user-avatar">??</div>
      <div class="user-name" id="current-user-name">Loading...</div>
      
      <!-- Patient-only Logout Button -->
      <button id="btn-logout-patient" class="patient-only btn-icon" style="margin-left: 1rem; color: var(--danger); display: none;" title="{{ __('Logout') }}">
        <i data-lucide="log-out" style="width:18px; height:18px;"></i>
      </button>
    </div>
  </div>
</header>

<!-- Top Header -->
<header class="top-header">
  <div class="header-left">
    <div class="logo-container" style="display:flex; align-items:center; gap:0.75rem;">
        <i data-lucide="stethoscope" style="width:32px; height:32px; color:var(--accent);"></i>
        <span style="font-weight:700; font-size:1.25rem; color:var(--primary);">MediBook</span>
    </div>
  </div>
  
  <div class="header-right">
    <div class="lang-toggle" style="margin-right: 1.5rem;">
      <a href="/lang/en" class="{{ App::getLocale() == 'en' ? 'active' : '' }}">EN</a>
      <a href="/lang/fr" class="{{ App::getLocale() == 'fr' ? 'active' : '' }}">FR</a>
    </div>
    
    <div class="notification-bell" id="notification-trigger" style="margin-right: 1.5rem;">
      <i data-lucide="bell" style="width:20px;height:20px;"></i>
      @auth
        @php($unreadCount = auth()->user()->unreadNotifications()->count())
        <div id="notification-badge" class="notification-badge {{ $unreadCount === 0 ? 'notification-badge--hidden' : '' }}">{{ $unreadCount > 0 ? $unreadCount : '' }}</div>
      @endauth
      
      <div class="notifications-dropdown" id="notifications-panel">
        <div class="notifications-header">
          {{ __('Notifications') }}
          <span class="mark-read" id="mark-all-read" role="button" tabindex="0">{{ __('Mark all as read') }}</span>
        </div>
        <div class="notifications-list" id="notifications-list">
          @auth
            @php($headerNotifications = auth()->user()->notifications()->latest()->limit(25)->get())
            @forelse($headerNotifications as $notification)
              <div class="notification-item {{ $notification->read_at ? 'is-read' : 'is-unread' }}" data-notification-id="{{ $notification->id }}">
                <div class="notif-icon appointment"><i data-lucide="calendar"></i></div>
                <div class="notif-content">
                  <p class="notif-content__title"><strong>{{ $notification->data['title'] ?? '' }}</strong></p>
                  <p class="notif-content__message">{{ $notification->data['message'] ?? '' }}</p>
                  <span class="notif-content__time">{{ $notification->created_at->diffForHumans() }}</span>
                </div>
                @unless($notification->read_at)
                  <button type="button" class="notif-mark-read" data-notif-id="{{ $notification->id }}">{{ __('Mark as read') }}</button>
                @endunless
              </div>
            @empty
              <div class="notifications-empty">{{ __('No notifications yet.') }}</div>
            @endforelse
          @endauth
        </div>
      </div>
    </div>
    
    <div class="user-profile">
      <div class="avatar" id="current-user-avatar">??</div>
      <div class="user-name" id="current-user-name">Loading...</div>
    </div>
  </div>
</header>

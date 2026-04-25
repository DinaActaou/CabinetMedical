<!-- Top Header -->
<header class="top-header">
  <div class="header-left">
    <!-- Search bar removed for a cleaner UI -->
  </div>
  
  <div class="header-right">
    <div class="lang-toggle">
      <a href="/lang/en" class="{{ App::getLocale() == 'en' ? 'active' : '' }}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #CBD5E1; font-weight: 600; text-decoration: none;">EN</a>
      <a href="/lang/fr" class="{{ App::getLocale() == 'fr' ? 'active' : '' }}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #CBD5E1; font-weight: 600; text-decoration: none;">FR</a>
    </div>
    
    <div class="notification-bell" id="notification-trigger">
      <i data-lucide="bell" style="width:20px;height:20px;"></i>
      <div class="notification-badge"></div>
      
      <div class="notifications-dropdown" id="notifications-panel">
        <div class="notifications-header">
          {{ __('Notifications') }}
          <span class="mark-read">{{ __('Mark all as read') }}</span>
        </div>
        <div class="notifications-list" id="notifications-list">
          <!-- Sample Notifications -->
          <div class="notification-item unread">
            <div class="notif-icon appointment"><i data-lucide="calendar"></i></div>
            <div class="notif-content">
              <p><strong>New Appointment</strong>: Sarah Connor for Cardiology at 14:30</p>
              <span>2 mins ago</span>
            </div>
          </div>
          <div class="notification-item">
            <div class="notif-icon system"><i data-lucide="info"></i></div>
            <div class="notif-content">
              <p>System update completed successfully.</p>
              <span>1 hour ago</span>
            </div>
          </div>
        </div>
        <div class="notifications-footer">
          {{ __('View all notifications') }}
        </div>
      </div>
    </div>
    
    <div class="user-profile">
      <div class="avatar" id="current-user-avatar">??</div>
      <div class="user-name" id="current-user-name">Loading...</div>
    </div>
  </div>
</header>

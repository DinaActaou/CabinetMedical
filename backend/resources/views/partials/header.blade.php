<!-- Top Header -->
<header class="top-header">
  <div class="search-wrapper">
    <i data-lucide="search"></i>
    <input type="text" placeholder="{{ __('Search...') }}">
  </div>
  
  <div class="header-right">
    <div class="lang-toggle">
      <a href="/lang/en" class="{{ App::getLocale() == 'en' ? 'active' : '' }}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #CBD5E1; font-weight: 600; text-decoration: none;">EN</a>
      <a href="/lang/fr" class="{{ App::getLocale() == 'fr' ? 'active' : '' }}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #CBD5E1; font-weight: 600; text-decoration: none;">FR</a>
    </div>
    
    <div class="notification-bell">
      <i data-lucide="bell" style="width:20px;height:20px;"></i>
      <div class="notification-badge"></div>
    </div>
    
    <div class="user-profile">
      <div class="avatar" id="current-user-avatar">??</div>
      <div class="user-name" id="current-user-name">Loading...</div>
    </div>
  </div>
</header>

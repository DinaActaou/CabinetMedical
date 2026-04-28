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
    
    <div class="user-profile">
      <div class="avatar" id="current-user-avatar">??</div>
      <div class="user-name" id="current-user-name">Loading...</div>
    </div>
  </div>
</header>

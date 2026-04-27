<!-- Sidebar (navigation is built in app.js from the authenticated user role) -->
<aside id="sidebar" class="sidebar">
  <div class="sidebar-header">
    <div style="background:var(--accent); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white;">
      <i data-lucide="stethoscope" style="width:20px;height:20px;"></i>
    </div>
    <div style="color:white; font-size:1.125rem; font-weight:700; line-height:1.2;">
      MediBook
    </div>
  </div>

  <div class="sidebar-nav" id="sidebar-nav"></div>

  <div style="padding: 1rem; margin-top: auto;">
    <button id="btn-logout" class="nav-item" style="width: 100%; border: none; background: transparent; cursor: pointer; color: #fca5a5;">
       <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> <span>{{ __('Logout') }}</span>
    </button>
  </div>
</aside>

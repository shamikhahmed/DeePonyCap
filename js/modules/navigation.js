'use strict';
const Nav = {
  _sidebarTabs: [
    { id: 'stable', label: 'Stable', icon: '🏠' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'wishlist', label: 'Wishlist', icon: '💫' },
    { id: 'accessories', label: 'Extras', icon: '🎀' },
  ],
  _renderSidebar(activeTab) {
    const sidebar = document.getElementById('cap-nav-sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = '<div class="cap-sidebar-brand">DeePonyCap ✨</div>' +
      this._sidebarTabs.map(t =>
        `<button type="button" class="cap-side-btn${t.id === activeTab ? ' on' : ''}" data-tab="${t.id}" onclick="Nav.go('${t.id}')"><span>${t.icon}</span><span>${t.label}</span></button>`
      ).join('');
  },
  /** Navigates to the given tab id, updating active screens, nav buttons, sidebar, and page title. */
  go(tab) {
    if (tab === 'collection') tab = 'logs';
    if (tab === 'shelves') tab = 'map';
    Haptic.tap();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    document.getElementById('tab-'+tab).classList.add('on');
    document.querySelectorAll('.nav-btn').forEach(b => {
      const active = b.dataset.tab===tab;
      b.classList.toggle('on', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    this._renderSidebar(tab);
    const tabLabel = (this._sidebarTabs.find(t => t.id === tab) || {}).label || (tab.charAt(0).toUpperCase() + tab.slice(1));
    document.title = tabLabel + ' — DeePonyCap';
    const gear = document.querySelector('.app-settings-btn');
    if (gear) gear.hidden = tab === 'settings';
    Render.all();
  },
  goLog(section) {
    if (section) logFilter.logSection = section;
    Nav.go('logs');
  }
};

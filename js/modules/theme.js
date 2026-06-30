'use strict';
const Theme = {
  /** Applies dark mode, collector mode, accent theme, and seasonal styling to the document root. */
  apply() {
    document.documentElement.classList.toggle('collector-mode', !!S.settings?.collectorMode);
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = S.settings?.darkMode ?? sysDark;
    document.documentElement.classList.toggle('dark-mode', !!useDark);
    if (window.CollectorSuite) CollectorSuite.applyAccent(S.settings?.accentTheme || 'pink');
    if (window.Seasonal) Seasonal.apply();
    const meta = document.getElementById('themeMeta');
    if (meta) meta.content = S.settings?.darkMode ? '#1F2937' : (S.settings?.collectorMode ? '#6D28D9' : '#FF6B9D');
  },
  setAccent(id) {
    S.settings.accentTheme = id;
    Store.save();
    Theme.apply();
    Render.settings();
    Toast.show('Theme updated ✨');
  },
  /** Toggles collector mode on/off, saves state, and re-renders the app. */
  toggle() {
    S.settings.collectorMode = !S.settings.collectorMode;
    Store.save();
    Theme.apply();
    Render.all();
    Toast.show(S.settings.collectorMode ? 'Collector mode on 📋' : 'Magical mode on ✨');
  },
  /** Toggles dark mode on/off, saves state, and re-renders the app. */
  toggleDark() {
    S.settings.darkMode = !S.settings.darkMode;
    Store.save();
    Theme.apply();
    Render.all();
    Toast.show(S.settings.darkMode ? 'Dark mode on 🌙' : 'Light mode on ☀️');
  }
};

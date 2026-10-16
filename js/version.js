'use strict';
/** Single source for app + service worker version (keep in sync with VERSION.json) */
var APP_VERSION = '3.9.3';
var SW_CACHE = 'deeponycap-v67';
if (typeof self !== 'undefined') self.SW_CACHE = SW_CACHE;
if (typeof window !== 'undefined') {
  window.APP_VERSION = APP_VERSION;
  window.SW_CACHE = SW_CACHE;
}

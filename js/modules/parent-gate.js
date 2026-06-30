'use strict';
const ParentGate = {
  _pending: null,
  _setupPin: '',
  isEnabled() { return !!(S.settings?.parentPinEnabled && S.settings?.parentPinHash); },
  verify(pin) { return pinHash(String(pin || '')) === S.settings.parentPinHash; },
  run(label, fn) {
    if (!this.isEnabled()) { fn(); return; }
    this._pending = fn;
    this._openSheet('verify', label);
  },
  setup() {
    this._setupPin = '';
    this._openSheet('setup', 'Set Parent PIN');
  },
  disable() {
    this.run('Remove parent lock', () => {
      S.settings.parentPinEnabled = false;
      S.settings.parentPinHash = null;
      Store.save();
      Render.settings();
      Toast.show('Parent lock removed');
    });
  },
  _openSheet(mode, title) {
    const E = Render.esc;
    const sub = mode === 'setup'
      ? (ParentGate._setupPin ? 'Confirm your PIN' : 'Choose a 4–6 digit PIN for export & delete')
      : (mode === 'confirm' ? 'Confirm your PIN' : E(title || 'Parent PIN required'));
    UI.openSheet(`${Render.sheetHdr('🔒 Parent Lock', 'ParentGate.cancel()')}
      <div class="pin-sheet">
        <p class="pin-sub">${sub}</p>
        <label class="fl" for="pinInput">PIN</label>
        <input type="password" id="pinInput" class="inp pin-inp" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="Parent PIN" onkeydown="if(event.key==='Enter')ParentGate.submitPin()">
        <p class="pin-hint">Parents only — keeps little hands from deleting your collection</p>
        <div class="form-actions">
          <button type="button" class="btn-g" onclick="ParentGate.cancel()">Cancel</button>
          <button type="button" class="btn-p" onclick="ParentGate.submitPin()">Continue</button>
        </div>
      </div>`);
    setTimeout(() => {
      const el = document.getElementById('pinInput');
      if (el) { el.value = ''; el.focus(); }
    }, 120);
    ParentGate._mode = mode;
  },
  cancel() {
    ParentGate._pending = null;
    ParentGate._setupPin = '';
    ParentGate._mode = null;
    UI.closeSheet();
  },
  submitPin() {
    const pin = document.getElementById('pinInput')?.value?.trim() || '';
    const mode = ParentGate._mode;
    if (mode === 'setup' || mode === 'confirm') {
      if (pin.length < 4) { Toast.show('PIN must be at least 4 digits'); return; }
      if (!ParentGate._setupPin) {
        ParentGate._setupPin = pin;
        ParentGate._openSheet('confirm', 'Confirm PIN');
        return;
      }
      if (pin !== ParentGate._setupPin) {
        Toast.show('PINs did not match — try again');
        ParentGate._setupPin = '';
        ParentGate._openSheet('setup', 'Set Parent PIN');
        return;
      }
      S.settings.parentPinEnabled = true;
      S.settings.parentPinHash = pinHash(pin);
      Store.save();
      ParentGate._setupPin = '';
      UI.closeSheet();
      Render.settings();
      Toast.show('Parent lock enabled 🔒');
      return;
    }
    if (mode === 'verify') {
      if (!ParentGate.verify(pin)) {
        Toast.show('Wrong PIN — ask a parent 🔒');
        const el = document.getElementById('pinInput');
        if (el) { el.value = ''; el.focus(); }
        return;
      }
      const fn = ParentGate._pending;
      ParentGate._pending = null;
      UI.closeSheet();
      if (fn) fn();
    }
  },
};

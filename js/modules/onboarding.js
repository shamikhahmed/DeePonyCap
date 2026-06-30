'use strict';
const OB = {
  next(n) {
    ['ob1','ob2','ob3'].forEach((id,i) => {
      document.getElementById(id).style.display = (i+1)===n ? 'block' : 'none';
    });
    Haptic.tap();
    if (n===3) Confetti.burst();
  },
  back(n) {
    OB.next(n);
  },
  finish(skipAdd) {
    S.collector.name = document.getElementById('obName').value.trim() || 'Collector';
    S.collector.since = document.getElementById('obSince').value || '';
    S.onboardingDone = true;
    Store.save();
    document.getElementById('onboard').classList.add('hide');
    document.getElementById('app').style.display = 'flex';
    Confetti.burst();
    Render.all();
    Install.maybeShow();
    if (!skipAdd) UI.openAdd();
    else Toast.show('Welcome to your stable! 🦄');
  }
};

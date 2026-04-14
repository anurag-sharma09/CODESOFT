// ── Global State ─────────────────────────────────────
let healthTimer;
let step = 1;

/* NexaApp — Sign Up — JavaScript */

// ── Navigation ─────────────────────────────────────
function showStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('step' + i).classList.toggle('hidden', i !== n);
  });
  document.getElementById('step-success').classList.add('hidden');
  step = n;
  updateProgress(n);
}

function updateProgress(n) {
  const stepsEl = document.getElementById('steps');
  if (n > 3) {
    stepsEl.classList.add('hidden');
    return;
  }
  stepsEl.classList.remove('hidden');

  [1,2,3].forEach(i => {
    const dot  = document.getElementById('s-dot-' + i);
    dot.classList.remove('step--active','step--done');
    if (i < n)  dot.classList.add('step--done');
    if (i === n) dot.classList.add('step--active');
  });
  // step lines
  [1,2].forEach(i => {
    const line = document.getElementById('s-line-' + i);
    line.classList.toggle('step-line--done', i < n);
  });
}

// ── View Management ──────────────────────────────────
function showView(view) {
  const views = ['step1', 'step2', 'step3', 'step-success', 'login-view', 'dashboard-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });

  const stepsEl = document.getElementById('steps');
  const logoEl  = document.querySelector('.logo');

  if (view === 'signup') {
    showStep(1);
    stepsEl.classList.remove('hidden');
    logoEl.classList.remove('hidden');
  } else if (view === 'login') {
    document.getElementById('login-view').classList.remove('hidden');
    stepsEl.classList.add('hidden');
    logoEl.classList.remove('hidden');
  } else if (view === 'dashboard') {
    document.getElementById('dashboard-view').classList.remove('hidden');
    stepsEl.classList.add('hidden');
    logoEl.classList.add('hidden'); // Hide logo on internal dashboard for clean look
  }
}

function prev(fromStep) {
  showStep(fromStep - 1);
}

// ── Validation ──────────────────────────────────────
function setState(inp, tickId, errId, status, msg) {
  inp.classList.remove('input--ok','input--bad');
  const tick = tickId ? document.getElementById(tickId) : null;
  const err  = errId  ? document.getElementById(errId)  : null;

  if (status === 'ok') {
    inp.classList.add('input--ok');
    if (tick) { tick.textContent = '✓'; tick.style.color = 'var(--green)'; }
    if (err)  err.textContent = '';
  } else if (status === 'bad') {
    inp.classList.add('input--bad');
    if (tick) tick.textContent = '';
    if (err)  err.textContent = msg;
  } else {
    if (tick) tick.textContent = '';
    if (err)  err.textContent = '';
  }
}

function checkName(inp, blur) {
  const v = inp.value.trim();
  if (!v) { setState(inp,'tick-name','err-name','',''); return false; }
  if (v.length < 2) { setState(inp,'tick-name','err-name','bad','Name must be at least 2 characters'); return false; }
  if (!/^[\p{L}\s'.,-]+$/u.test(v)) { setState(inp,'tick-name','err-name','bad','Only letters allowed'); return false; }
  setState(inp,'tick-name','err-name','ok','');
  return true;
}

function checkEmail(inp, blur) {
  const v = inp.value.trim();
  if (!v) { setState(inp,'tick-email','err-email','',''); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setState(inp,'tick-email','err-email','bad','Enter a valid email address'); return false; }
  setState(inp,'tick-email','err-email','ok','');
  return true;
}

function checkPhone(inp, blur) {
  let raw = inp.value.replace(/\D/g,'');
  inp.value = raw.replace(/(\d{5})(\d{0,5})/, (_,a,b) => b ? a+' '+b : a);
  if (!raw) { setState(inp,'tick-phone','err-phone','',''); return false; }
  if (raw.length !== 10) { setState(inp,'tick-phone','err-phone','bad','Enter a 10-digit mobile number'); return false; }
  if (!/^[6-9]/.test(raw)) { setState(inp,'tick-phone','err-phone','bad','Not a valid Indian mobile number'); return false; }
  setState(inp,'tick-phone','err-phone','ok','');
  return true;
}

// ── Step 1 submit ────────────────────────────────────
function next1() {
  const ok1 = checkName(document.getElementById('name'), true);
  const ok2 = checkEmail(document.getElementById('email'), true);
  const ok3 = checkPhone(document.getElementById('phone'), true);

  if (ok1 && ok2 && ok3) {
    showStep(2);
  } else {
    shake(document.querySelector('.input--bad'));
    toast('Please fix the errors above');
  }
}

// ── Chips ────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    c.classList.toggle('active');
    document.getElementById('err-chips').textContent = '';
  });
});

function next2() {
  const count = document.querySelectorAll('.chip.active').length;
  if (count < 2) {
    document.getElementById('err-chips').textContent = 'Please pick at least 2 interests';
    return;
  }
  showStep(3);
}

// ── Password strength ────────────────────────────────
function strengthCheck(inp) {
  const pw = inp.value;
  const bars  = [document.getElementById('b1'),document.getElementById('b2'),document.getElementById('b3'),document.getElementById('b4')];
  const label = document.getElementById('str-label');

  // Rules
  setRule('r-len',   pw.length >= 8);
  setRule('r-upper', /[A-Z]/.test(pw));
  setRule('r-num',   /[0-9]/.test(pw));
  setRule('r-sym',   /[^A-Za-z0-9]/.test(pw));

  bars.forEach(b => b.className = 'sbar');
  if (!pw) { label.textContent = '—'; label.style.color = ''; return; }

  let score = 0;
  if (pw.length >= 8)         score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const cls    = ['w','f','g','s'];
  const names  = ['Weak','Fair','Good','Strong 💪'];
  const colors = ['var(--red)','var(--orange)','var(--yellow)','var(--green)'];
  const idx    = Math.min(score-1, 3);

  for (let i = 0; i < score; i++) bars[i].classList.add('sbar--' + cls[idx]);
  label.textContent  = names[idx] || 'Weak';
  label.style.color  = colors[idx] || colors[0];
}

function setRule(id, pass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('rule--ok', pass);
}

// ── Confirm match ────────────────────────────────────
function matchCheck(blur) {
  const pw  = document.getElementById('pwd').value;
  const inp = document.getElementById('confirm');
  const err = document.getElementById('err-confirm');
  inp.classList.remove('input--ok','input--bad');

  if (!inp.value) { err.textContent = ''; return false; }
  if (pw === inp.value) { inp.classList.add('input--ok'); err.textContent = ''; return true; }
  inp.classList.add('input--bad'); err.textContent = 'Passwords do not match';
  return false;
}

// ── Authentication (Login) ───────────────────────────
async function login() {
  const email = document.getElementById('l-email').value.trim();
  const password = document.getElementById('l-pwd').value;
  const btn = document.getElementById('btn-login');

  if (!email || !password) {
    toast('Please enter both email and password');
    return;
  }

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<svg style="animation:kspin .7s linear infinite;flex-shrink:0" width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.3)" stroke-width="3"/><path d="M12 3a9 9 0 019 9" stroke="white" stroke-width="3" stroke-linecap="round"/></svg> Signing in...`;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('nexa_user', JSON.stringify(data.user));
      populateDashboard(data.user);
      showView('dashboard');
      toast('Welcome back, ' + data.user.name.split(' ')[0] + '!');
    } else {
      toast(data.error || 'Login failed');
      shake(btn);
    }
  } catch (err) {
    console.error(err);
    toast('Connection error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ── Create account ────────────────────────────────────
async function createAccount() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const pw = document.getElementById('pwd').value;
  const pwErr = document.getElementById('err-pwd');
  const pwInp = document.getElementById('pwd');
  const termsOk = document.getElementById('terms').checked;
  const interests = Array.from(document.querySelectorAll('.chip.active')).map(c => c.textContent.replace(/[^\w\s]/g, '').trim());

  if (!pw || pw.length < 8) {
    pwInp.classList.add('input--bad');
    pwErr.textContent = 'Password must be at least 8 characters';
    toast('Set a stronger password');
    return;
  }
  pwInp.classList.remove('input--bad');
  pwErr.textContent = '';

  if (!matchCheck(true)) { toast('Passwords do not match'); return; }

  if (!termsOk) {
    document.querySelector('.terms-box').style.borderColor = 'var(--red)';
    setTimeout(() => document.querySelector('.terms-box').style.borderColor = '', 1500);
    toast('Please agree to the Terms & Privacy Policy');
    return;
  }

  // Loading state
  const btn = document.getElementById('btn3');
  btn.disabled = true;
  const originalBtnHtml = btn.innerHTML;
  btn.innerHTML = `
    <svg style="animation:kspin .7s linear infinite;flex-shrink:0" width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.3)" stroke-width="3"/>
      <path d="M12 3a9 9 0 019 9" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>
    Saving to database…`;

  if (!document.getElementById('ks')) {
    const s = document.createElement('style');
    s.id = 'ks';
    s.textContent = '@keyframes kspin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password: pw, interests })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('nexa_user', JSON.stringify({ name, email, interests }));
      showSuccess();
    } else {
      toast(data.error || 'Signup failed');
      shake(btn);
    }
  } catch (error) {
    console.error('Network error:', error);
    toast('Server connection failed. Is the backend running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }
}

// ── Show success ──────────────────────────────────────
function showSuccess() {
  [1,2,3].forEach(i => document.getElementById('step'+i).classList.add('hidden'));

  // Populate meta
  const name  = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const meta  = document.getElementById('success-meta');
  meta.innerHTML = `
    <div class="smeta-row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6l-11 11-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      Account created for <strong>${name}</strong>
    </div>
    <div class="smeta-row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6l-11 11-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      Verification email sent to <strong>${email}</strong>
    </div>
    <div class="smeta-row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6l-11 11-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      Password & profile secured
    </div>`;

  // Fully complete progress
  updateProgress(4);
  [1,2,3].forEach(i => document.getElementById('s-dot-'+i).classList.replace('step--active','step--done'));

  document.getElementById('step-success').classList.remove('hidden');
  toast('🎉 Welcome to NexaApp, ' + name.split(' ')[0] + '!');
}

// ── Dashboard ────────────────────────────────────────
function populateDashboard(user) {
  document.getElementById('dash-name').textContent = user.name;
  document.getElementById('dash-email').textContent = user.email;
  document.getElementById('dash-avatar').textContent = user.name.charAt(0).toUpperCase();

  const chips = document.getElementById('dash-interests');
  chips.innerHTML = '';
  if (user.interests && user.interests.length) {
    user.interests.forEach(interest => {
      const c = document.createElement('span');
      c.className = 'chip active';
      c.textContent = interest;
      chips.appendChild(c);
    });
  } else {
    chips.innerHTML = '<span class="card__sub">No interests selected</span>';
  }
}

function logout() {
  localStorage.removeItem('nexa_user');
  showView('login');
  toast('Signed out successfully');
}

function goToDashboard() {
  const user = JSON.parse(localStorage.getItem('nexa_user'));
  if (user) {
    populateDashboard(user);
    showView('dashboard');
  } else {
    showView('login');
  }
}

// ── Theme Management ─────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const target = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('nexa_theme', target);
}

// ── Toast ─────────────────────────────────────────────
let _t;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_t);
  _t = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Shake animation ───────────────────────────────────
function shake(el) {
  if (!el) return;
  el.animate([
    {transform:'translateX(-6px)'},{transform:'translateX(6px)'},
    {transform:'translateX(-4px)'},{transform:'translateX(4px)'},
    {transform:'translateX(0)'}
  ], {duration:380, easing:'ease-out'});
}

// ── Init ──────────────────────────────────────────────
// ── Health Check ─────────────────────────────────────
async function checkHealth() {
  const bar = document.getElementById('status-bar');
  const txt = document.getElementById('status-text');
  if (!bar || !txt) return;

  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    
    bar.className = 'status-bar';
    if (data.firebase === 'initialized') {
      bar.classList.add('status-bar--ok');
      txt.textContent = 'SYSTEM ONLINE (Firebase)';
    } else {
      bar.classList.add('status-bar--bad');
      txt.textContent = 'FIREBASE NOT INITIALIZED';
    }
  } catch (e) {
    bar.className = 'status-bar status-bar--bad';
    txt.textContent = 'SERVER OFFLINE';
  }
}

// ── Init ──────────────────────────────────────────────
async function init() {
  // Theme
  const savedTheme = localStorage.getItem('nexa_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Session
  const savedUser = localStorage.getItem('nexa_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      populateDashboard(user);
      showView('dashboard');
    } catch (e) {
      localStorage.removeItem('nexa_user');
      showView('signup');
    }
  } else {
    showView('signup');
  }

  // Health
  checkHealth();
  healthTimer = setInterval(checkHealth, 5000);
}

// Ensure toggleEye is present once
function toggleEye(id, btn) {
  const inp  = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type   = show ? 'text' : 'password';
  btn.querySelector('svg').innerHTML = show
    ? `<path d="M3 3l18 18M10.5 10.5A3 3 0 0013.5 13.5M6.2 6.2C4.5 7.4 3 9.1 2 12c2 5 5.5 8 10 8 1.9 0 3.7-.5 5.2-1.4M9.8 4.5C10.5 4.2 11.2 4 12 4c4.5 0 8 3 10 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`
    : `<ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>`;
}

init();

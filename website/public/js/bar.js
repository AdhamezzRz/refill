/* REFILL — the bar screen. Paid online orders appear here with a chime. Staff key required (STAFF_KEY). */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var key = ''; try { key = localStorage.getItem('refill-staff') || ''; } catch (e) { /* private mode */ }
  var seen = null, audio = null, timer = null;

  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, .18].forEach(function (d, i) {
        var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + d;
        o.frequency.value = i ? 1318.5 : 987.8; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 1);
      });
    } catch (e) { /* no audio */ }
  }
  var hhmm = function (iso) { return iso ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }) : ''; };
  function when(o) {
    if (o.table) return 'Table ' + (o.table.length < 2 ? '0' + o.table : o.table);
    if (o.pickup === 'asap') return 'ASAP';
    var t = new Date(new Date(o.paidAt).getTime() + (+o.pickup) * 60000);
    return 'At ' + hhmm(t.toISOString());
  }
  function card(o) {
    var next = o.status === 'paid' ? ['ready', 'Ready'] : o.status === 'ready' ? ['collected', 'Collected'] : ['ready', 'Undo'];
    return '<article class="tk tk--' + o.status + '"><header><b>#' + esc(o.no) + '</b><span>' + esc(when(o)) + '</span></header>' +
      '<p class="tk__who">' + esc(o.name) + ' <a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + '</a></p>' +
      '<ul>' + o.items.map(function (l) { return '<li><b>' + l.qty + '×</b> ' + esc(l.label) + '</li>'; }).join('') + '</ul>' +
      (o.note ? '<p class="tk__note">' + esc(o.note) + '</p>' : '') +
      '<footer><span>Paid ' + hhmm(o.paidAt) + ' · ' + o.total + ' ' + o.currency + '</span><button type="button" data-id="' + esc(o.id) + '" data-to="' + next[0] + '">' + next[1] + '</button></footer></article>';
  }
  function login(msg) {
    clearTimeout(timer); $('.js-bar-board').hidden = true; $('.js-bar-login').hidden = false; $('.js-bar-err').textContent = msg || '';
  }
  function load() {
    fetch('/api/bar/orders', { headers: { 'x-staff-key': key }, cache: 'no-store' }).then(function (r) {
      if (r.status === 401) { try { localStorage.removeItem('refill-staff'); } catch (e) { /* */ } return login('That key did not work.'); }
      return r.json().then(function (d) {
        $('.js-bar-login').hidden = true; $('.js-bar-board').hidden = false; $('.js-rc-open').hidden = false;
        $('.js-bar-mode').textContent = d.mode === 'test' ? 'TEST MODE · payments are not real' : '';
        var g = { paid: [], ready: [], collected: [] }; d.orders.forEach(function (o) { g[o.status].push(o); });
        g.collected.reverse();
        Object.keys(g).forEach(function (k) { $('.js-col-' + k).innerHTML = g[k].map(card).join('') || '<p class="bar__empty">Nothing here.</p>'; $('.js-n-' + k).textContent = g[k].length || ''; });
        var ids = d.orders.filter(function (o) { return o.status === 'paid'; }).map(function (o) { return o.id; });
        if (seen && ids.some(function (x) { return seen.indexOf(x) < 0; })) { chime(); document.title = '● New order · REFILL'; setTimeout(function () { document.title = 'Bar · REFILL orders'; }, 6000); }
        seen = ids;
        timer = setTimeout(load, 5000);
      });
    }).catch(function () { timer = setTimeout(load, 8000); });
  }
  $('.js-bar-login').addEventListener('submit', function (e) {
    e.preventDefault(); key = e.target.key.value.trim(); if (!key) return;
    try { localStorage.setItem('refill-staff', key); } catch (x) { /* */ }
    chime(); load();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-to]'); if (!b) return; b.disabled = true;
    fetch('/api/bar/orders', { method: 'POST', headers: { 'x-staff-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.getAttribute('data-id'), status: b.getAttribute('data-to') }) })
      .then(function () { clearTimeout(timer); load(); });
  });
  setInterval(function () { $('.js-bar-clock').textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }); }, 1000);
  /* ---------- Refill Card: scan, stamp, redeem ---------- */
  var rcb = $('.js-rcb'), video = $('.js-rc-video'), stream = null, scanT = null, cvs = document.createElement('canvas'), ctx = cvs.getContext('2d', { willReadFrequently: true }), current = null;
  function rcShow(c, msg) {
    current = c;
    $('.js-rc-res').innerHTML = !c ? '<p class="bar__err">' + esc(msg) + '</p>' :
      '<div class="rcb__who"><b>' + esc(c.name) + '</b><span>' + esc(c.code) + '</span></div>' +
      '<img src="/wallet/art/card-' + Math.min(c.have, 5) + '@2x.png" alt="" class="rcb__strip">' +
      '<p class="rcb__state">' + (c.free ? '<b>' + c.free + ' free drink' + (c.free > 1 ? 's' : '') + ' ready</b>' : c.have + ' of ' + c.of + ' stamps') + (msg ? ' · ' + esc(msg) : '') + '</p>' +
      '<div class="rcb__btns"><button class="btn" data-rc="stamp" data-n="1">+1 stamp</button><button class="btn btn--ghost" data-rc="stamp" data-n="2">+2</button><button class="btn btn--ghost" data-rc="stamp" data-n="3">+3</button>' +
      (c.free ? '<button class="btn rcb__redeem" data-rc="redeem">Give the free drink</button>' : '') + '</div>';
  }
  function rcFind(code) {
    fetch('/api/bar/card?code=' + encodeURIComponent(code), { headers: { 'x-staff-key': key }, cache: 'no-store' })
      .then(function (r) { return r.json().then(function (j) { return r.ok ? rcShow(j) : rcShow(null, j.error || 'Not found'); }); });
  }
  function scan() {
    if (!stream || rcb.hidden) return;
    if (video.readyState >= 2 && window.jsQR) {
      cvs.width = video.videoWidth; cvs.height = video.videoHeight; ctx.drawImage(video, 0, 0);
      var hit = window.jsQR(ctx.getImageData(0, 0, cvs.width, cvs.height).data, cvs.width, cvs.height, { inversionAttempts: 'dontInvert' });
      if (hit && /^RFC:/.test(hit.data)) { chime(); rcFind(hit.data); scanT = setTimeout(scan, 2500); return; }
    }
    scanT = setTimeout(scan, 180);
  }
  function rcOpen() {
    rcb.hidden = false; $('.js-rc-res').innerHTML = ''; current = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
        stream = s; video.srcObject = s; video.play(); $('.js-rc-camnote').textContent = ''; scan();
      }).catch(function () { $('.rcb__cam').classList.add('is-off'); $('.js-rc-camnote').textContent = 'No camera access. Type the code instead.'; });
    } else $('.rcb__cam').classList.add('is-off'); $('.js-rc-camnote').textContent = 'No camera here. Type the code instead.';
  }
  function rcClose() { rcb.hidden = true; clearTimeout(scanT); if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  $('.js-rc-open').addEventListener('click', rcOpen);
  $('.js-rc-close').addEventListener('click', rcClose);
  $('.js-rc-form').addEventListener('submit', function (e) { e.preventDefault(); var v = e.target.code.value.trim(); if (v) rcFind(v); });
  $('.js-rc-res').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rc]'); if (!b || !current) return; b.disabled = true;
    fetch('/api/bar/card', { method: 'POST', headers: { 'x-staff-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: current.code, action: b.getAttribute('data-rc'), n: +b.getAttribute('data-n') || 1 }) })
      .then(function (r) { return r.json().then(function (j) {
        if (!r.ok) return rcShow(current, j.error);
        rcShow(j, j.redeemed ? 'Free drink given' : 'Stamped');
      }); });
  });

  document.addEventListener('pointerdown', function () { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { /* */ } }, { once: true });
  if (key) load(); else login();
})();

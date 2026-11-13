/* REFILL v3 — "A day at the bar".
   The hero is a time-lapse of the Refill bar from dawn to night (49 frames from three
   Higgsfield time-lapse clips). The page opens at the real time in El Shorouk;
   drag the sun along the dial to move the light through the day. */
(function () {
  'use strict';
  var R = window.R, $ = R.$;
  var hero = $('.js-day'); if (!hero) return;
  var gsap = window.gsap, ST = window.ScrollTrigger, reduce = R.reduce;

  var N = 49;
  /* frame index <-> minutes of the day. Three clips: dawn->day, day->golden, golden->night */
  var SEG = [[360, 630, 0, 16], [630, 1080, 16, 32], [1080, 1290, 32, 48]];
  function frameAt(t) {
    if (t <= 360) return 0;
    for (var i = 0; i < SEG.length; i++) { var s = SEG[i]; if (t <= s[1]) return s[2] + (t - s[0]) / (s[1] - s[0]) * (s[3] - s[2]); }
    return 48;
  }
  var MOMENTS = [
    [0, 'Closed for the night. The dough is resting.'],
    [360, 'Not open yet. The machine is warming up.'],
    [420, 'Doors open. First pour of the day.'],
    [540, 'Morning rush. Croissants still warm.'],
    [690, 'Second bake. Sourdough cooling on the rack.'],
    [840, 'The slow hours. Pour-over weather.'],
    [1020, 'Golden hour. Everyone’s best side.'],
    [1140, 'Lights low, oven hot. Pizza is coming soon.'],
    [1320, 'Last refill. Take your time.']
  ];
  function momentAt(t) { var m = MOMENTS[0][1]; for (var i = 0; i < MOMENTS.length; i++) if (t >= MOMENTS[i][0]) m = MOMENTS[i][1]; return m; }
  function glowAt(t) {
    if (t < 450) return 'rgba(255,176,150,.6)';
    if (t < 990) return 'rgba(255,236,200,.6)';
    if (t < 1150) return 'rgba(255,170,80,.7)';
    return 'rgba(170,195,255,.5)';
  }

  var canvas = $('.js-day-canvas'), ctx = canvas.getContext('2d');
  var veil = $('.js-day-veil'), timeEl = $('.js-day-time'), momentEl = $('.js-day-moment');
  var dial = $('.js-dial'), dialWrap = dial.parentNode, sun = $('.js-sun');
  var playBtn = $('.js-play'), playLbl = $('.js-play-label'), nowBtn = $('.js-to-now');

  /* ---------- frames ---------- */
  var set = null, frames = [], focus = { x: 0.5, y: 0.5 }, onFrame = function () {};
  function pickSet() { return window.innerWidth / window.innerHeight < 0.85 ? 'p' : 'l'; }
  function pad(i) { return (i < 10 ? '0' : '') + i; }
  function loadSet(name, firstIdx) {
    set = name; frames = new Array(N);
    focus = name === 'p' ? { x: 0.42, y: 0.5 } : { x: 0.5, y: 0.62 };
    var order = [16, 0, 32, 48, Math.round(firstIdx)], seen = {};
    var rest = []; for (var i = 0; i < N; i++) rest.push(i);
    rest.sort(function (a, b) { return Math.abs(a - firstIdx) - Math.abs(b - firstIdx); });
    order = order.concat(rest).filter(function (i) { if (seen[i]) return false; seen[i] = 1; return true; });
    var keysLeft = 5, active = 0, q = order.slice();
    var ready = new Promise(function (res) {
      function pump() {
        while (active < 6 && q.length) (function (idx) {
          active++;
          var img = new Image(); img.decoding = 'async';
          img.onload = function () {
            frames[idx] = img; active--; onFrame();
            if (set === name) draw();
            if (order.indexOf(idx) < 5 && --keysLeft === 0) res();
            pump();
          };
          img.onerror = function () { active--; if (order.indexOf(idx) < 5 && --keysLeft === 0) res(); pump(); };
          img.src = '/assets/day/' + name + '/' + pad(idx) + '.webp';
        })(q.shift());
      }
      pump();
    });
    return ready;
  }
  function nearest(i) {
    if (frames[i]) return frames[i];
    for (var d = 1; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
    return null;
  }

  /* ---------- canvas ---------- */
  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    draw();
  }
  function cover(img, alpha) {
    var iw = img.naturalWidth, ih = img.naturalHeight, cw = canvas.width, ch = canvas.height;
    var s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
    var dx = (cw - dw) * focus.x, dy = (ch - dh) * focus.y;
    ctx.globalAlpha = alpha; ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---------- state ---------- */
  var t = 360, mode = 'intro', live = R.cairoMinutes();
  function dialT(m) { return m < 360 ? 1440 : m; }
  function draw() {
    if (!W) return;
    var f = frameAt(Math.min(t, 1440)), i = Math.floor(f), a = f - i;
    var A = nearest(i), B = a > 0.001 && frames[i + 1];
    if (!A) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cover(A, 1); if (B) cover(B, a); ctx.globalAlpha = 1;
  }
  function paint() {
    draw();
    var p = (Math.min(Math.max(t, 360), 1440) - 360) / 1080;
    dialWrap.style.setProperty('--p', (p * 100).toFixed(3) + '%');
    dialWrap.style.setProperty('--glow', glowAt(t));
    var closed = live < 360 && mode === 'now';
    var dark = closed ? 0.42 : t > 1290 ? (t - 1290) / 150 * 0.3 : 0;
    veil.style.setProperty('--dark', dark.toFixed(3));
    var shown = mode === 'now' ? live : t;
    timeEl.textContent = R.hhmm(shown);
    var mom = closed ? MOMENTS[0][1] : momentAt(t);
    if (momentEl.textContent !== mom) momentEl.textContent = mom;
    dial.setAttribute('aria-valuenow', String(Math.round(t)));
    dial.setAttribute('aria-valuetext', R.hhmm(shown) + ', ' + mom);
  }
  function setNowMark() { dialWrap.style.setProperty('--now', ((dialT(live) - 360) / 1080 * 100).toFixed(3) + '%'); }
  function setMode(m) {
    mode = m;
    nowBtn.hidden = m === 'now' || m === 'intro';
  }

  /* ---------- tween helper ---------- */
  var tween = null;
  function go(to, dur, ease, done) {
    if (tween) tween.kill();
    if (!gsap || reduce) { t = to; paint(); if (done) done(); return; }
    var o = { v: t };
    tween = gsap.to(o, { v: to, duration: dur, ease: ease || 'power2.inOut', onUpdate: function () { t = o.v; paint(); }, onComplete: function () { tween = null; if (done) done(); } });
  }

  /* ---------- dial: drag, click, keyboard ---------- */
  function tFromX(x) {
    var r = dial.getBoundingClientRect();
    var p = Math.min(Math.max((x - r.left) / r.width, 0), 1);
    return 360 + p * 1080;
  }
  var dragging = false;
  dial.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    stopPlay(); dragging = true; dialWrap.classList.add('is-drag');
    try { dial.setPointerCapture(e.pointerId); } catch (err) {}
    setMode('manual');
    go(tFromX(e.clientX), 0.5, 'expo.out');
  });
  dial.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (tween) tween.kill(), tween = null;
    t = tFromX(e.clientX); paint();
  });
  function end() { dragging = false; dialWrap.classList.remove('is-drag'); }
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  dial.addEventListener('keydown', function (e) {
    var k = e.key, d = 0;
    if (k === 'ArrowRight' || k === 'ArrowUp') d = 15; else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -15;
    else if (k === 'PageUp') d = 60; else if (k === 'PageDown') d = -60;
    else if (k === 'Home') d = 360 - t; else if (k === 'End') d = 1440 - t;
    if (!d) return;
    e.preventDefault(); stopPlay(); setMode('manual');
    go(Math.min(Math.max(t + d, 360), 1440), 0.4, 'power2.out');
  });
  nowBtn.addEventListener('click', function () {
    stopPlay(); live = R.cairoMinutes(); setNowMark();
    go(dialT(live), 1.4, 'power3.inOut', function () { setMode('now'); paint(); });
  });

  /* ---------- play the whole day ---------- */
  var playing = false;
  function stopPlay() {
    if (!playing) return; playing = false;
    if (tween) { tween.kill(); tween = null; }
    playBtn.setAttribute('aria-pressed', 'false'); playLbl.textContent = 'Play the day';
  }
  playBtn.addEventListener('click', function () {
    if (playing) { stopPlay(); return; }
    playing = true; setMode('manual');
    playBtn.setAttribute('aria-pressed', 'true'); playLbl.textContent = 'Pause';
    var from = t >= 1430 ? 360 : t;
    t = from;
    go(1440, Math.max(2, (1440 - from) / 1080 * 12), 'none', function () { playing = false; playBtn.setAttribute('aria-pressed', 'false'); playLbl.textContent = 'Play again'; });
  });

  /* ---------- keep "now" alive ---------- */
  setInterval(function () {
    live = R.cairoMinutes(); setNowMark();
    if (mode === 'now') { t = dialT(live); paint(); }
  }, 20000);

  /* ---------- scroll: the room recedes as you leave ---------- */
  if (gsap && ST && !reduce) {
    gsap.to('.js-day-frame', { yPercent: 16, scale: 1.06, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.day__ui', { yPercent: -10, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: '35% top', end: '90% top', scrub: true } });
  }

  /* ---------- resize ---------- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (pickSet() !== set) loadSet(pickSet(), frameAt(t)); size(); }, 120);
  });

  /* ---------- intro: the Refill cup fills as the frames load, then the day plays from 06:00 to now ---------- */
  var L = R.loader;
  live = R.cairoMinutes(); setNowMark();
  var target = dialT(live);
  var loaded = 0;
  onFrame = function () { loaded++; };
  var ready = loadSet(pickSet(), frameAt(target));
  size(); paint();

  if (!L) { t = target; setMode('now'); paint(); return; }
  var c0 = performance.now(), minMs = R.seenBefore ? 500 : 1500, keysIn = false;
  ready.then(function () { keysIn = true; });
  (function feed() {
    var el = performance.now() - c0;
    var real = keysIn ? Math.min(1, 0.35 + loaded / (N * 0.5) * 0.65) : loaded / N;
    if (el > 5000) real = 1;
    L.set(Math.min(real, el / minMs));
    if (real < 1 || el < minMs) requestAnimationFrame(feed); else L.set(1);
  })();
  L.onFull(function () { L.lift(start); });

  function start() {
    t = 360; paint();
    if (!gsap || reduce) { t = target; setMode('now'); paint(); return; }
    gsap.fromTo(canvas, { scale: 1.12 }, { scale: 1, duration: 2.6, ease: 'expo.out', clearProps: 'transform' });
    setTimeout(R.introLines, 250);
    gsap.from(['.day__head .label', '.day__now', '.dial'], { opacity: 0, y: 16, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.7 });
    setTimeout(function () {
      go(target, R.seenBefore ? 1.4 : 2.8, 'power3.inOut', function () { setMode('now'); paint(); });
    }, 150);
  }
})();

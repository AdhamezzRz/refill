/* REFILL — the website is a cup. Version 2: quiet page, living footage, one big moment.
   One wave engine drives every liquid edge; footage plays only while on screen; the founder appears twice. */
(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CFG = window.REFILL || {};
const S = { vel: 0, slosh: 0 };
const tap = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* not supported */ } };
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/* ------------------------------------------------------------------ founder poses */
const poseCache = {};
const loadPose = name => (poseCache[name] ||= fetch(`/assets/poses/${name}.svg`).then(r => r.text()));
function drawPose(el, dur = 1.5) {
  const paths = $$('svg path', el);
  if (!paths.length) return;
  if (RM) { el.classList.add('is-instant'); return; }
  gsap.killTweensOf(paths);
  gsap.set(paths, { strokeDashoffset: 1, opacity: 0 });
  return gsap.to(paths, { strokeDashoffset: 0, duration: .6, ease: 'power2.out',
    stagger: { each: dur / paths.length, onStart() { gsap.set(this.targets()[0], { opacity: 1 }); } } });
}
async function setPose(el, name, { draw = false, dur = 1.5 } = {}) {
  const html = await loadPose(name);
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const node = tmp.firstElementChild, old = $('svg', el);
  if (old) old.replaceWith(node); else el.appendChild(node);
  el.dataset.pose = name;
  if (draw) drawPose(el, dur);
  return el;
}
function initFounders() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target._ready.then(() => drawPose(e.target, 1.7));
  }), { threshold: .3 });
  $$('.founder[data-pose]').forEach(el => {
    el._ready = setPose(el, el.dataset.pose);
    if (el.dataset.draw === 'scroll') io.observe(el);
  });
}

/* ------------------------------------------------------------------ wave engine */
const waves = [];
function wave(path, o) {
  const w = Object.assign({ path, on: true, w: 1440, h: 90, amp: 14, k: 1.6, speed: 1, phase: Math.random() * 6.28,
                            mode: 'below', y: () => 45, slosh: 1, n: 22, prec: 1 }, o);
  waves.push(w); return w;
}
function waveD(w, t) {
  const amp = w.amp * (1 + S.slosh * w.slosh), y0 = w.y(), p = w.prec;
  let d = w.mode === 'above' ? 'M0 0' : `M0 ${w.h}`;
  for (let i = 0; i <= w.n; i++) {
    const a = (i / w.n) * 6.283 * w.k;
    const y = y0 + amp * (.62 * Math.sin(a + t * w.speed + w.phase) + .38 * Math.sin(a * 2.1 - t * w.speed * 1.3 + w.phase * 2));
    d += `L${(w.w * i / w.n).toFixed(p)} ${y.toFixed(p)}`;
  }
  return d + (w.mode === 'above' ? `L${w.w} 0Z` : `L${w.w} ${w.h}Z`);
}
function startWaves() {
  const io = new IntersectionObserver(es => es.forEach(e => { (e.target._waves || []).forEach(w => (w.on = e.isIntersecting)); }),
                                      { rootMargin: '120px' });
  waves.forEach(w => { const host = w.host || w.path.ownerSVGElement; (host._waves ||= []).push(w); io.observe(host); });
  if (RM) waves.forEach(w => w.path.setAttribute('d', waveD(w, 0)));
  gsap.ticker.add(time => {
    S.slosh = lerp(S.slosh, clamp(Math.abs(S.vel) / 26, 0, 1.6), .07);
    const t = RM ? 0 : time * 1.5;
    for (const w of waves) if (w.on) w.path.setAttribute('d', waveD(w, t));
  });
}

/* ------------------------------------------------------------------ living footage
   Each clip sits on top of its own first frame. Near the end it fades back to that still, restarts, and fades in:
   a loop with no jump. Clips load and play only while they are on screen. */
function initVideos() {
  if (RM) return;
  const land = matchMedia('(min-width: 901px)').matches;
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.getAttribute('src')) v.src = v.dataset.src || (land ? v.dataset.srcL : v.dataset.srcP);
      v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '240px' });
  $$('.js-vid').forEach(v => {
    v.muted = true; v.playsInline = true;
    v.addEventListener('playing', () => v.classList.add('is-live'));
    v.addEventListener('timeupdate', () => { if (v.duration && v.duration - v.currentTime < .7) v.classList.remove('is-live'); });
    v.addEventListener('ended', () => { v.currentTime = 0; v.play().catch(() => {}); });
    io.observe(v);
  });
}

/* ------------------------------------------------------------------ text helpers */
function splitWords(el, cls) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map(w => cls ? `<span class="${cls}" aria-hidden="true">${w}</span>`
                                    : `<span class="split-w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  return $$(cls ? `.${cls}` : '.split-w > span', el);
}

/* ================================================================== small pages (/order, /rate, 404) */
function initPage() {
  initFounders();
  $$('.founder[data-pose]').forEach(el => el._ready.then(() => drawPose(el, 1.6)));
  const table = new URLSearchParams(location.search).get('table');
  $$('.js-table').forEach(n => { n.textContent = table && /^\d{1,3}$/.test(table) ? `Table ${table.padStart(2, '0')}` : 'El Shorouk'; });
  $$('[data-link]').forEach(a => { const u = CFG[a.dataset.link]; if (u) a.href = u; });

  const form = $('.js-rate');
  if (!form) return;
  const answers = ['Sorry about that. Tell us what went wrong and we will fix it.', 'Not our best. What should we do better?',
                   'Fair. What would make it a great one?', 'Glad it was good. Anything we could do even better?',
                   'That is what we like to hear. Thank you.'];
  const poses = ['sleepy', 'waiter', 'point', 'wave', 'jump'];
  const stage = $('.js-meter-founder'), out = $('.js-meter-answer'), send = $('.js-send'), note = $('.js-note');
  let score = 0;
  $$('.mcup', form).forEach(b => b.addEventListener('click', () => {
    score = +b.dataset.level + 1; tap();
    $$('.mcup', form).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    out.textContent = answers[score - 1]; send.disabled = false;
    setPose(stage, poses[score - 1], { draw: true, dur: 1.1 });
  }));
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!score) return;
    send.disabled = true; send.textContent = 'Sending';
    try {
      const r = await fetch('/api/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify({ score, table: table || '', note: note.value.slice(0, 500) }) });
      if (!r.ok) throw new Error(r.status);
      form.hidden = true; $('.js-thanks').hidden = false;
      const g = $('.js-review'); if (g && score >= 4 && CFG.googleReview) { g.href = CFG.googleReview; g.hidden = false; }
      setPose(stage, score >= 4 ? 'jump' : 'wave', { draw: true, dur: 1.1 });
    } catch (err) {
      send.disabled = false; send.textContent = 'Send';
      out.textContent = 'That did not send. Check your connection and try again.';
    }
  });
}

/* ================================================================== the main site */
function initSite() {
  const body = document.body;
  $('.js-year').textContent = new Date().getFullYear();
  const hr = new Date().getHours();
  $('.js-greeting').textContent = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  $$('[data-link]').forEach(a => { const u = CFG[a.dataset.link]; if (u) a.href = u; });

  /* ---- smooth scroll (wheel only: phones keep their native scroll) */
  let lenis = null;
  if (!RM) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', e => { S.vel = e.velocity; ScrollTrigger.update(); });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  } else {
    let last = scrollY; addEventListener('scroll', () => { S.vel = scrollY - last; last = scrollY; }, { passive: true });
  }

  /* ---- phone menu */
  const menu = $('.menu'), mbtn = $('.js-menu-btn'), mlabel = $('.js-menu-label');
  function setMenu(open) {
    body.classList.toggle('menu-open', open); menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open)); mbtn.setAttribute('aria-expanded', String(open));
    mlabel.textContent = open ? 'Close' : 'Menu';
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  mbtn.addEventListener('click', () => { tap(); setMenu(!body.classList.contains('menu-open')); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return;
    e.preventDefault();
    const wasOpen = body.classList.contains('menu-open'); if (wasOpen) setMenu(false);
    const go = () => (lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView());
    wasOpen ? setTimeout(go, 420) : go();
  }));

  /* ---- café sound (off until asked for) */
  const sbtn = $('.js-sound'); let audio = null;
  sbtn.addEventListener('click', () => {
    const on = sbtn.getAttribute('aria-pressed') !== 'true'; sbtn.setAttribute('aria-pressed', String(on)); tap();
    if (!audio) { audio = new Audio('/assets/audio/cafe.mp3'); audio.loop = true; audio.volume = 0; }
    gsap.killTweensOf(audio);
    if (on) { audio.play().catch(() => sbtn.setAttribute('aria-pressed', 'false')); gsap.to(audio, { volume: .6, duration: 1.4 }); }
    else gsap.to(audio, { volume: 0, duration: .6, onComplete: () => audio.pause() });
  });

  initFounders();
  initVideos();

  /* ---- liquid state */
  const L = { loader: 0, gauge: 0, finale: 0, room: .18 };
  $$('.js-wave').forEach(p => {
    const kind = p.dataset.wave;
    if (kind === 'tide') wave(p, { y: () => 46, amp: 13, k: 1.4 + Math.random() * .5, speed: .8 });
    if (kind === 'surface') wave(p, { w: 400, h: 40, mode: 'above', y: () => 17, amp: 6, k: 1.2, slosh: .9, speed: 1.2 });
    if (kind === 'skirt') wave(p, { mode: 'above', y: () => 44, amp: 16, k: 1.5, slosh: 0 });
    if (kind === 'loader') wave(p, { w: 120, h: 124, y: () => 121 - L.loader * 94, amp: 2.6, k: 1.2, slosh: 0, speed: 2 });
    if (kind === 'gauge') wave(p, { w: 120, h: 124, y: () => 121 - L.gauge * 94, amp: 2.4, k: 1.1, slosh: .9, speed: 1.6, n: 10 });
    if (kind === 'wm-finale') p._w = wave(p, { w: 1000, h: 150, y: () => 152 - L.finale * 156, amp: 5, k: 2.4, slosh: .8 });
    if (kind === 'room') wave(p, { w: 1, h: 1, y: () => 1 - L.room, amp: .007, k: 1.3, slosh: .5, prec: 4, host: $('.room__frame') });
  });
  startWaves();

  /* ---- fit the wordmarks to the real glyph widths once the font is in */
  const fitWordmarks = () => $$('.js-wordmark').forEach(svg => {
    const t = $(':scope > text', svg), len = t.getComputedTextLength();
    if (!len) return;
    const w = len - 190 * .2;
    svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} 150`);
    const p = $('.js-wave', svg); if (p && p._w) p._w.w = w;
  });

  /* ---- hero: a small window of steam that opens to fill the screen */
  const stage = $('.js-hero'), media = $('.js-hero-media');
  // a light copy of the headline lives inside the footage window, so every letter turns light exactly where the footage is behind it
  const over = document.createElement('div'); over.className = 'hero__over'; over.setAttribute('aria-hidden', 'true');
  over.appendChild($('.hero__head').cloneNode(true)); media.appendChild(over);
  const H = { p: 0, r: null, T: { x: 0, y: 0 }, W: 0, Ht: 0 };
  const heroEase = gsap.parseEase('power2.inOut');
  function layoutHero() {
    const W = stage.clientWidth, Ht = stage.clientHeight, land = W > 900;
    const mw = land ? 16 : 9, mh = land ? 9 : 16, s = Math.max(W / mw, Ht / mh);
    const cup = land ? { x: .505, y: .645 } : { x: .53, y: .695 };          // where the cup sits in the footage
    const cupX = (W - mw * s) / 2 + cup.x * mw * s, cupY = (Ht - mh * s) / 2 + cup.y * mh * s;
    let sh, sw, cx, top;
    if (land) { sh = Ht * .62; sw = sh * .64; cx = W * .745; top = Ht * .23; }
    else { sh = Math.min(Ht * .45, W * 1.02); sw = Math.min(W * .7, sh * .74); cx = W * .5; top = Ht * .405; }
    H.r = { l: cx - sw / 2, t: top, w: sw, h: sh }; H.W = W; H.Ht = Ht;
    H.T = { x: cx - cupX, y: top + sh * .66 - cupY };
    stage.style.setProperty('--sw', sw + 'px'); stage.style.setProperty('--sh', sh + 'px');
    stage.style.setProperty('--sl', H.r.l + 'px'); stage.style.setProperty('--st', top + 'px');
    applyHero();
  }
  let navSec = null, gaugeSec = null; const heroSec = $('.hero');
  const paintNav = () => {
    body.dataset.nav = (navSec === heroSec ? H.p > .4 : navSec && navSec._dark) ? 'dark' : 'light';
    body.dataset.gauge = (gaugeSec === heroSec ? H.p > .4 : gaugeSec && gaugeSec._dark) ? 'dark' : 'light';
  };
  function applyHero() {
    if (!H.r) return;
    const k = 1 - heroEase(H.p), r = H.r, tx = H.T.x * k, ty = H.T.y * k, rad = r.w / 2 * k;
    media.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`;
    over.style.transform = `translate3d(${(-tx).toFixed(1)}px,${(-ty).toFixed(1)}px,0)`;
    media.style.clipPath = `inset(${(r.t * k - ty).toFixed(1)}px ${((H.W - r.l - r.w) * k + tx).toFixed(1)}px ${((H.Ht - r.t - r.h) * k + ty).toFixed(1)}px ${(r.l * k - tx).toFixed(1)}px round 0 0 ${rad.toFixed(1)}px ${rad.toFixed(1)}px)`;
    stage.style.setProperty('--shade', smooth(.3, 1, H.p).toFixed(3));
    stage.style.setProperty('--lid', (1 - smooth(0, .22, H.p)).toFixed(3));
    stage.classList.toggle('is-moving', H.p > .06);
    stage.classList.toggle('is-open', H.p > .4);
    stage.classList.toggle('is-full', H.p > .8);
    paintNav();
  }

  /* ---- prepared states for reveals */
  const splits = $$('[data-split]').map(el => ({ el, words: splitWords(el) }));
  if (!RM) {
    splits.forEach(s => gsap.set(s.words, { yPercent: 115 }));
    gsap.set('[data-reveal]', { opacity: 0, y: 24 });
    gsap.set('.hero__h1, .hero__eyebrow', { opacity: 0, y: 30 });
    gsap.set(media, { opacity: 0 }); gsap.set('.hero__slot .cup__lid', { scaleX: 0 });
  }
  const fillWords = $$('.js-fillwords').map(el => ({ el, words: splitWords(el, 'w') }));

  /* ---- scroll choreography (built once the curtain starts lifting) */
  function choreograph() {
    const once = (trigger, fn, start = 'top 88%') => ScrollTrigger.create({ trigger, start, once: true, onEnter: fn });

    // hero: pinned while the window opens, then a short hold
    if (!RM) {
      gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * (innerWidth > 900 ? 1.15 : 1)),
                                       pin: true, scrub: .6, anticipatePin: 1, onRefresh: layoutHero } })
        .to(H, { p: 1, duration: .82, ease: 'none', onUpdate: applyHero })
        .to({}, { duration: .18 });
    }

    splits.forEach(s => once(s.el, () => gsap.to(s.words, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: .06 })));
    $$('[data-reveal]').forEach(el => once(el, () => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }), 'top 92%'));

    // manifesto: the sentence fills in word by word
    fillWords.forEach(({ el, words }) => ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true,
      onUpdate: self => { const n = Math.round(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-on', i < n)); },
    }));

    // the windows: each chapter's footage is poured in
    $$('.js-cup').forEach(cup => {
      const st = { v: 0 };
      gsap.to(st, { v: 1, ease: 'none', scrollTrigger: { trigger: cup, start: 'top 82%', end: 'top 24%', scrub: .5 },
        onUpdate() { cup.style.setProperty('--fill', st.v.toFixed(4)); } });
    });

    // the room: walk sideways through the renders (desktop); phones swipe
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const track = $('.js-track'), dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.space__pin', pin: true, scrub: .7, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.card__img img', track).forEach(img => gsap.fromTo(img, { xPercent: -15 }, { xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
    });

    // same room, soon: a first pour as a hint, then it is yours to drag
    once('.js-room', () => gsap.timeline().to(L, { room: .66, duration: 1.5, ease: 'power2.inOut', onUpdate: syncRoom })
                                           .to(L, { room: .44, duration: 1.1, ease: 'power2.inOut', onUpdate: syncRoom }), 'top 62%');

    // finale: the wordmark fills to the brim, and he finally jumps
    const fin = $('.finale__founder'), finPct = $('.js-finale-pct'); let jumped = false;
    ScrollTrigger.create({ trigger: '.finale', start: 'top 84%', end: 'bottom bottom-=40', scrub: .4,
      onUpdate: self => {
        L.finale = self.progress; finPct.textContent = Math.round(self.progress * 100);
        if (self.progress > .96 && !jumped) {
          jumped = true;
          fin._ready.then(() => { drawPose(fin, 1.1); gsap.fromTo(fin, { y: 0 }, { y: -30, duration: .5, ease: 'power2.out', yoyo: true, repeat: 3, delay: .7 }); });
        }
      } });

    // gauge + clock + bar colours
    const anchors = [];
    $$('[data-section]').forEach(sec => {
      sec._dark = sec.classList.contains('s-espresso') || sec.classList.contains('s-olive');
      ScrollTrigger.create({ trigger: sec, start: 'top 40px', end: 'bottom 40px', onToggle: s => { if (s.isActive) { navSec = sec; paintNav(); } } });
      const st = ScrollTrigger.create({ trigger: sec, start: 'top center', end: 'bottom center', onToggle: s => { if (s.isActive) { gaugeSec = sec; paintNav(); } } });
      const [h, m] = sec.dataset.clock.split(':').map(Number);
      anchors.push({ st, min: h * 60 + m });
    });
    const clock = $('.js-clock'), gpcts = $$('.js-gauge-pct');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
      L.gauge = self.progress; const pc = Math.round(self.progress * 100); gpcts.forEach(n => (n.textContent = pc));
      body.classList.toggle('nav-hidden', self.direction === 1 && self.scroll() > 240);
      const y = self.scroll(), pts = anchors.map(a => ({ p: a.st.start, min: a.min }));
      pts.push({ p: ScrollTrigger.maxScroll(window), min: 23 * 60 + 59 });
      let min = pts[0].min;
      for (let i = 0; i < pts.length - 1; i++) if (y >= pts[i].p) min = lerp(pts[i].min, pts[i + 1].min, clamp((y - pts[i].p) / Math.max(1, pts[i + 1].p - pts[i].p)));
      min = Math.round(min);
      clock.textContent = String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
    } });

    ScrollTrigger.sort(); ScrollTrigger.refresh();
  }

  /* ---- same room, soon: drag */
  const room = $('.js-room'), frame = $('.room__frame'), range = $('.room__range'), rpct = $('.js-room-pct');
  function syncRoom() { room.style.setProperty('--lvl', L.room.toFixed(4)); rpct.textContent = Math.round(L.room * 100); range.value = Math.round(L.room * 100); }
  frame.setAttribute('data-lenis-prevent', '');
  const dragTo = e => { const r = frame.getBoundingClientRect(); gsap.killTweensOf(L, 'room'); L.room = clamp(1 - (e.clientY - r.top) / r.height, .02, .98); syncRoom(); };
  frame.addEventListener('pointerdown', e => { frame.setPointerCapture(e.pointerId); frame._drag = true; dragTo(e); });
  frame.addEventListener('pointermove', e => { if (frame._drag) dragTo(e); });
  ['pointerup', 'pointercancel'].forEach(t => frame.addEventListener(t, () => { frame._drag = false; }));
  range.addEventListener('input', () => { L.room = clamp(range.value / 100, .02, .98); syncRoom(); });
  frame.tabIndex = 0;
  frame.addEventListener('keydown', e => { const d = { ArrowUp: .06, ArrowDown: -.06 }[e.key]; if (d) { e.preventDefault(); L.room = clamp(L.room + d, .02, .98); syncRoom(); } });
  $$('.chip[data-room]').forEach(chip => chip.addEventListener('click', () => {
    tap();
    $$('.chip[data-room]').forEach(c => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-selected', String(c === chip)); });
    const id = chip.dataset.room, now = $('.room__now'), soon = $('.room__soon');
    gsap.to([now, soon], { opacity: 0, duration: .25, onComplete() {
      now.src = `/assets/img/room-${id}-now.webp`; soon.src = `/assets/img/room-${id}-soon.webp`;
      now.alt = id === '3805' ? 'The planter bench under construction today' : 'The bar area under construction today';
      soon.alt = id === '3805' ? 'The same view, finished: olive trees, cushions and tables' : 'The same view, finished: stone niches, white bar and espresso machine';
      Promise.all([now.decode().catch(() => {}), soon.decode().catch(() => {})]).then(() => {
        gsap.to([now, soon], { opacity: 1, duration: .4 });
        gsap.fromTo(L, { room: .1 }, { room: .5, duration: 1.2, ease: 'power2.inOut', onUpdate: syncRoom });
      });
    } });
  }));
  syncRoom();

  /* ---- refill-o-meter: the founder's one stage */
  const answers = ['Double espresso. No talking. We understand.', 'A flat white, and five quiet minutes.',
                   'Add a croissant. You have earned it.', 'Iced latte on the terrace. Keep it going.',
                   'Look at you. Now go and refill a friend.'];
  const mPoses = ['sleepy', 'waiter', 'point', 'wave', 'jump'];
  const mStage = $('.js-meter-founder'), mOut = $('.js-meter-answer');
  $$('.meter .mcup').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.level; tap();
    $$('.meter .mcup').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    setPose(mStage, mPoses[i], { draw: true, dur: 1.1 });
    if (RM) { mOut.textContent = answers[i]; return; }
    gsap.to(mOut, { opacity: 0, y: -10, duration: .2, onComplete() { mOut.textContent = answers[i]; gsap.fromTo(mOut, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }); } });
    if (i === 4) gsap.fromTo(mStage, { y: 0 }, { y: -24, duration: .4, ease: 'power2.out', yoyo: true, repeat: 3, delay: .5 });
  }));

  /* ---- cursor + magnetic buttons (fine pointers only) */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !RM) {
    const c = $('.cursor'), label = $('.cursor__label'), xTo = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', e => { c.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const lab = e.target.closest('[data-cursor]'), link = e.target.closest('a,button');
      c.classList.toggle('is-label', !!lab); c.classList.toggle('is-link', !lab && !!link);
      label.textContent = lab ? lab.dataset.cursor : '';
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' }); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.45)' }));
    });
  }

  /* ---- tab title, and quiet when hidden */
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Your coffee is getting cold · REFILL' : title;
    if (audio && sbtn.getAttribute('aria-pressed') === 'true') document.hidden ? audio.pause() : audio.play().catch(() => {});
  });

  /* ---- loader, then the intro */
  const loader = $('.loader'), count = $('.js-loader-count');
  const ready = document.fonts.ready.then(() => { fitWordmarks(); layoutHero(); });
  addEventListener('resize', () => { fitWordmarks(); if (RM || innerWidth > 900) layoutHero(); });
  addEventListener('load', () => ScrollTrigger.refresh());

  function intro() {
    if (lenis) lenis.start();
    body.classList.remove('is-loading');
    choreograph();
    if (RM) return;
    gsap.to(media, { opacity: 1, duration: 1.4, ease: 'power2.out', delay: .15 });
    gsap.to('.hero__slot .cup__lid', { scaleX: 1, duration: 1.2, ease: 'power3.inOut', delay: .2 });
    gsap.to('.hero__h1', { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out', delay: .25 });
    gsap.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: .5 });
  }
  if (RM) { loader.remove(); ready.then(() => { intro(); $$('.founder').forEach(f => f.classList.add('is-instant')); }); return; }
  const fillT = gsap.to(L, { loader: 1, duration: 1.8, ease: 'power1.inOut', onUpdate() { count.textContent = Math.round(L.loader * 100); } });
  Promise.all([ready, fillT.then()]).then(() => {
    gsap.timeline()
      .to('.loader__inner', { opacity: 0, y: -30, duration: .5, ease: 'power2.in' }, .15)
      .add(intro, .45)
      .to(loader, { yPercent: -100, y: () => -$('.loader__skirt').getBoundingClientRect().height - 4, duration: 1.25, ease: 'power3.inOut' }, .35)
      .add(() => { waves.filter(w => loader.contains(w.path)).forEach(w => { w.on = false; waves.splice(waves.indexOf(w), 1); }); loader.remove(); });
  });
}

document.body.classList.contains('page-body') ? initPage() : initSite();
})();

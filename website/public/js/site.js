/* REFILL v3 — shared behaviour: top bar, index, links, reveals, smooth scroll, counter rail. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var CFG = window.REFILL || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- time in El Shorouk ---------- */
  var fmtParts = (function () {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch (e) { return null; }
  })();
  function cairoMinutes() {
    var d = new Date();
    if (!fmtParts) return d.getHours() * 60 + d.getMinutes();
    var h = 0, m = 0;
    fmtParts.formatToParts(d).forEach(function (p) { if (p.type === 'hour') h = +p.value % 24; if (p.type === 'minute') m = +p.value; });
    return h * 60 + m;
  }
  function hhmm(t) {
    t = Math.round(t); var h = Math.floor(t / 60) % 24, m = t % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  window.R = { $: $, $$: $$, cairoMinutes: cairoMinutes, hhmm: hhmm, reduce: reduce, finePointer: finePointer, cfg: CFG };

  /* ---------- loader: the Refill cup fills with coffee, the lid drops, the page opens ---------- */
  window.R.loader = (function () {
    var cur = $('.js-curtain'); if (!cur) return null;
    var coffee = $('.js-coffee', cur), crema = $('.js-crema', cur), pct = $('.js-curtain-pct', cur), cnt = $('.js-curtain-count', cur);
    var TOP = 25.5, BOT = 89.5, target = 0, shown = 0, t0 = performance.now(), done = false, cbs = [];
    cnt.textContent = hhmm(cairoMinutes()) + ' · El Shorouk';
    function surface(y, ph, amp) {
      var pts = [];
      for (var x = 10; x <= 90; x += 4) pts.push(x + ' ' + (y + Math.sin(x * 0.13 + ph) * amp + Math.sin(x * 0.29 - ph * 1.7) * amp * 0.4).toFixed(2));
      return pts;
    }
    function frame(now) {
      shown += (target - shown) * 0.09;
      if (target >= 1 && 1 - shown < 0.004) shown = 1;
      var y = BOT - (BOT - TOP) * shown, ph = (now - t0) / 380, amp = 1.7 * (1 - shown * 0.55);
      var pts = surface(y, ph, amp);
      coffee.setAttribute('d', 'M' + pts.join(' L') + ' L90 100 L10 100Z');
      crema.setAttribute('d', 'M' + pts.join(' L'));
      pct.textContent = 'Refilling ' + Math.round(shown * 100) + '%';
      if (shown >= 1) { done = true; cur.classList.add('is-closed'); setTimeout(function () { var f = cbs; cbs = []; f.forEach(function (fn) { fn(); }); }, 620); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      el: cur,
      set: function (k) { target = Math.max(target, Math.min(k, 1)); },
      onFull: function (f) { cbs.push(f); },
      lift: function (after) {
        try { sessionStorage.setItem('refill-seen', '1'); } catch (e) {}
        if (!window.gsap || reduce) { cur.parentNode.removeChild(cur); if (after) after(); return; }
        window.gsap.to(cur, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut', onComplete: function () { if (cur.parentNode) cur.parentNode.removeChild(cur); } });
        if (after) setTimeout(after, 380);
      }
    };
  })();
  var seenBefore = false; try { seenBefore = sessionStorage.getItem('refill-seen') === '1'; } catch (e) {}
  window.R.seenBefore = seenBefore;
  if (window.R.loader && reduce) { var lc = window.R.loader.el; lc.parentNode.removeChild(lc); window.R.loader = null; }

  /* ---------- configured links ---------- */
  $$('[data-link]').forEach(function (a) {
    var url = CFG[a.getAttribute('data-link')];
    if (url) a.setAttribute('href', url);
  });
  if (CFG.instagram) $$('.js-no-ig').forEach(function (el) { el.hidden = true; });

  /* ---------- status pill ---------- */
  var status = $('.js-status');
  function paintStatus() {
    if (!status) return;
    var txt = $('.js-status-text', status), t = cairoMinutes();
    var hours = (window.MENU && window.MENU.hours) || { open: 420, close: 1440 };
    if (!CFG.isOpen) { txt.textContent = 'Opening soon · El Shorouk'; status.classList.remove('is-open'); return; }
    var open = t >= hours.open && t < hours.close;
    status.classList.toggle('is-open', open);
    txt.textContent = open ? 'Open now · until ' + hhmm(hours.close) : 'Closed · opens ' + hhmm(hours.open);
  }
  paintStatus(); setInterval(paintStatus, 30000);

  /* ---------- smooth scroll (wheel only) ---------- */
  var lenis = null;
  if (!reduce && finePointer && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, smoothTouch: false });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }
  if (window.ScrollTrigger) window.ScrollTrigger.config({ ignoreMobileResize: true });
  function scrollToEl(el, offset) {
    if (!el) return;
    var off = offset != null ? offset : window.R.anchorOffset ? window.R.anchorOffset() : -(parseFloat(getComputedStyle(doc).getPropertyValue('--toph')) || 64) - 8;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset + off, behavior: reduce ? 'auto' : 'smooth' });
  }
  window.R.scrollToEl = scrollToEl;
  window.R.lenis = lenis;

  /* ---------- index overlay ---------- */
  var index = $('.js-index'), indexBtn = $('.js-index-btn');
  function setIndex(open) {
    if (!index) return;
    indexBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('index-open', open);
    if (open) {
      index.hidden = false; void index.offsetWidth; index.classList.add('is-open');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    } else {
      index.classList.remove('is-open');
      setTimeout(function () { if (!index.classList.contains('is-open')) index.hidden = true; }, 800);
      if (lenis) lenis.start(); document.body.style.overflow = '';
    }
  }
  if (indexBtn) indexBtn.addEventListener('click', function () { setIndex(indexBtn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('index-open')) setIndex(false); });

  /* ---------- in-page anchors ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    var href = a.getAttribute('href'), hash = href.slice(href.indexOf('#'));
    if (href.charAt(0) === '/' && location.pathname !== '/') return;
    var el = hash.length > 1 && document.getElementById(hash.slice(1));
    if (!el) return;
    e.preventDefault();
    var wasOpen = document.body.classList.contains('index-open');
    if (wasOpen) setIndex(false);
    setTimeout(function () { scrollToEl(el); }, wasOpen ? 260 : 0);
    if (history.replaceState) history.replaceState(null, '', hash);
  });

  /* ---------- top bar: light over the hero, solid after, tucks away on the way down ---------- */
  var top = $('.js-top'), hero = $('.js-day');
  var lastY = window.pageYOffset;
  function paintTop() {
    if (!top) return;
    var y = window.pageYOffset, toph = top.offsetHeight;
    if (hero) {
      var over = y < hero.offsetHeight - toph;
      top.classList.toggle('is-over', over);
      top.classList.toggle('is-solid', !over);
    }
    var tuck = y > (hero ? hero.offsetHeight : 300) && y > lastY + 2 && !document.body.classList.contains('index-open');
    if (y < lastY - 2 || y < 120) tuck = false;
    if (Math.abs(y - lastY) > 2) top.classList.toggle('is-tucked', tuck);
    lastY = y;
  }
  paintTop();
  window.addEventListener('scroll', paintTop, { passive: true });

  /* ---------- reveals ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  window.R.reveal = function (root) {
    $$('[data-reveal]', root).forEach(function (el, i) {
      if (!io || reduce) { el.classList.add('is-in'); return; }
      io.observe(el);
    });
  };
  window.R.reveal();

  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (gsap && ST) gsap.registerPlugin(ST);

  /* words that rise into place */
  $$('.js-words').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w"><i>' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</i></span>'; }).join(' ');
    if (!gsap || reduce) return;
    var inner = $$('.w > i', el);
    gsap.set(inner, { yPercent: 110 });
    ST.create({ trigger: el, start: 'top 82%', once: true, onEnter: function () {
      gsap.to(inner, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.028 });
    } });
  });

  /* pictures that open as they arrive */
  if (gsap && ST && !reduce) {
    $$('.js-pic').forEach(function (fig) {
      var img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(12% 8% 12% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'top 45%', scrub: true } });
      gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.act__arch img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: 10 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var word = $('.foot__word');
    if (word) gsap.fromTo(word, { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'top 40%', scrub: true } });
  }

  /* page titles (menu, small pages) */
  function titleIn() {
    var lines = $$('.mn-hero__title .ln > span, .pg__title .ln > span');
    if (gsap && !reduce && lines.length) gsap.from(lines, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
  }
  var L = window.R.loader;
  if (L && !$('.js-day')) {
    /* every page but home: a short refill, tied to the page actually loading */
    var t0 = performance.now(), loaded = document.readyState === 'complete', minMs = seenBefore ? 450 : 1300;
    window.addEventListener('load', function () { loaded = true; });
    setTimeout(function () { loaded = true; }, 4000);
    (function feed() {
      var k = (performance.now() - t0) / minMs;
      L.set(loaded ? k : Math.min(k, 0.85));
      if (k < 1 || !loaded) requestAnimationFrame(feed); else L.set(1);
    })();
    L.onFull(function () { L.lift(titleIn); });
  } else if (!L && !$('.js-day')) titleIn();
  window.R.introLines = function () {
    var l = $$('.day__title .ln > span');
    if (gsap && !reduce) gsap.from(l, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.09 });
  };

  /* ---------- counter rail (home) ---------- */
  var rail = $('.js-rail');
  if (rail && window.MENU) {
    var pick = ['butter-croissant', 'plaster', 'pistachio-cruffin', 'flat-white', 'cardamom-knot', 'shorouk', 'basque-cheesecake', 'v60', 'zaatar-twist', 'karkade', 'sourdough', 'ahwa'];
    var all = {};
    window.MENU.sections.forEach(function (s) { s.groups.forEach(function (g) { g.items.forEach(function (it) { all[it.id] = it; }); }); });
    rail.innerHTML = pick.filter(function (id) { return all[id]; }).map(function (id) {
      var it = all[id], sig = (it.tags || []).indexOf('sig') > -1;
      return '<a class="ci" href="/menu#i-' + id + '" draggable="false">' +
        '<div class="ci__plate">' + (sig ? '<span class="ci__tag">Signature</span>' : '') +
        '<img src="/assets/menu/' + it.img + '.webp" alt="' + it.name + '" loading="lazy" width="900" height="900" draggable="false"></div>' +
        '<div class="ci__row"><span class="ci__name">' + it.name + '</span><span class="ci__price">' + (Array.isArray(it.price) ? it.price.filter(function (p) { return p != null; })[0] : it.price) + ' EGP</span></div>' +
        '<p class="ci__desc">' + it.desc + '</p></a>';
    }).join('');
    var prev = $('.js-rail-prev'), next = $('.js-rail-next');
    function step(dir) { var c = rail.querySelector('.ci'); rail.scrollBy({ left: dir * (c ? c.offsetWidth : 300) * 2, behavior: reduce ? 'auto' : 'smooth' }); }
    function paintArrows() {
      if (!prev) return;
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 4;
    }
    if (prev) { prev.addEventListener('click', function () { step(-1); }); next.addEventListener('click', function () { step(1); }); }
    rail.addEventListener('scroll', paintArrows, { passive: true }); paintArrows();
    /* drag with a mouse */
    var down = null, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, s: rail.scrollLeft }; moved = false; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x;
      if (Math.abs(dx) > 4) { moved = true; rail.classList.add('is-drag'); }
      rail.scrollLeft = down.s - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = null;
      setTimeout(function () { rail.classList.remove('is-drag'); }, 0);
    });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    if (gsap && ST && !reduce) {
      gsap.from($$('.ci', rail).slice(0, 5), { x: 80, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
    }
  }
})();

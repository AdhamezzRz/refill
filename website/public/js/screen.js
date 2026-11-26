/* REFILL · in-store menu screens. Two portrait 43" TVs behind the bar: /screen/1 (drinks) and /screen/2 (bakehouse & kitchen).
   Everything is a function of time, render(t), on one 72-second loop:
     0–26 s   page A   (screen 1: coffee · screen 2: bakehouse) with motion clips
    26–36 s   takeover across both screens: the Refill Card, six cups filling
    36–62 s   page B   (screen 1: not coffee · screen 2: kitchen)
    62–72 s   takeover across both screens: order ahead, skip the line
   Both screens read the same clock (the server's), so the takeovers line up across the pair.
   Prices and names come from /js/menu-data.js, so the screens update with the menu. ?capture=1 is used to export the MP4s. */
(function () {
  'use strict';
  var M = window.MENU, $ = function (s, r) { return (r || document).querySelector(s); };
  var q = new URLSearchParams(location.search);
  var SCREEN = /\/screen\/2/.test(location.pathname) || q.get('s') === '2' ? 2 : 1;
  var CAPTURE = q.has('capture');
  var LOOP = 72, SLOT = 6.5, FADE = 0.7;
  document.body.classList.add('screen-' + SCREEN);
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  /* ---------- menu data ---------- */
  var byId = {}, secs = {};
  M.sections.forEach(function (s) { secs[s.id] = s; s.groups.forEach(function (g) { g.items.forEach(function (it) { byId[it.id] = it; }); }); });
  function price(it, temp, opt) {
    if (it.options && it.options[opt || 0] && it.options[opt || 0][2] != null) return +it.options[opt || 0][2];
    var p = it.price; if (p == null) return null;
    if (typeof p === 'object') return p[temp] != null ? +p[temp] : null;
    return +p;
  }
  function range(it) {
    if (!it.options) return null;
    var ps = it.options.map(function (o) { return o[2] != null ? +o[2] : price(it, (it.serve || [null])[0]); }).filter(function (v) { return v != null; });
    if (!ps.length) return null;
    var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
    return lo === hi ? String(lo) : lo + '–' + hi;
  }

  /* ---------- what each screen shows ---------- */
  var CLIPS = SCREEN === 1
    ? [{ f: 'latte', id: 'latte', t: 'hot' }, { f: 'spanish', id: 'spanish-latte', t: 'iced' }, { f: 'matcha', id: 'spanish-matcha', t: 'iced' }, { f: 'hotchoc', id: 'hot-chocolate', t: 'hot' }]
    : [{ f: 'fudge', id: 'fudge' }, { f: 'sansebastian', id: 'san-sebastian' }, { f: 'croissant', id: 'croissant' }, { f: 'frenchtoast', id: 'french-toast' }];
  var PAGES = SCREEN === 1 ? ['coffee', 'not-coffee'] : ['bakehouse', 'kitchen'];

  /* ---------- build: hero clips + titles ---------- */
  var clipEls = CLIPS.map(function (c) {
    var el;
    if (CAPTURE) { el = document.createElement('img'); }
    else {
      el = document.createElement('video');
      el.muted = true; el.playsInline = true; el.preload = 'auto'; el.loop = false;
      el.setAttribute('muted', ''); el.setAttribute('playsinline', '');
      el.src = '/assets/screens/' + c.f + '.mp4'; el.poster = '/assets/screens/' + c.f + '.jpg';
    }
    $('.js-clips').appendChild(el); return el;
  });
  var titleEls = CLIPS.map(function (c) {
    var it = byId[c.id], p = it.options ? range(it) : price(it, c.t);
    var label = (c.t === 'iced' && it.serve && it.serve.length > 1 ? 'Iced ' : '') + it.name;
    var d = document.createElement('div');
    d.innerHTML = '<p class="hero__name">' + esc(label) + '</p><div class="hero__meta"><b>' +
      [it.options ? it.options.length + ' fillings' : (c.t ? (c.t === 'hot' ? 'Hot' : 'Iced') : ''), p != null ? (it.options ? 'from ' + String(p).split('–')[0] : p) + ' EGP' : ''].filter(Boolean).join(' · ') +
      '</b><span class="ar">' + esc(it.ar) + '</span></div>';
    $('.js-title').appendChild(d); return d;
  });
  $('.js-tag').innerHTML = '<i></i>' + (SCREEN === 1 ? 'Now pouring' : 'Fresh today');

  /* ---------- build: the two menu pages ---------- */
  var ROW = 50, HEAD = 64;
  var pages = PAGES.map(function (sid) {
    var s = secs[sid], rows = 0, groups = s.groups.length;
    var html = s.groups.map(function (g) {
      var drinks = g.items.some(function (it) { return it.serve; });
      var hot = drinks && g.items.some(function (it) { return it.serve && it.serve.indexOf('hot') > -1; });
      var iced = drinks && g.items.some(function (it) { return it.serve && it.serve.indexOf('iced') > -1; });
      var two = hot && iced;
      var out = '<div class="grp"><div class="grp__h"><b>' + esc(g.title) + '</b>' + (g.ar ? '<span class="ar">' + esc(g.ar) + '</span>' : '') +
        (two ? '<span class="cols"><span>HOT</span><span>ICED</span></span>' : '') + '</div>';
      g.items.forEach(function (it) {
        if ((it.tags || []).indexOf('soon') > -1) return;
        rows++;
        var cells;
        if (it.options) cells = (two ? '<span class="row__p is-na"></span>' : '') + '<span class="row__p row__p--r">' + (range(it) || '') + '</span>';
        else if (two) cells = ['hot', 'iced'].map(function (k) { var v = it.serve.indexOf(k) > -1 ? price(it, k) : null; return '<span class="row__p' + (v == null ? ' is-na' : '') + '">' + (v == null ? '—' : v) + '</span>'; }).join('');
        else cells = '<span class="row__p">' + (price(it, (it.serve || [null])[0]) || '') + '</span>';
        out += '<div class="row' + (it.options ? ' row--opts' : '') + '"><span class="row__n">' + esc(it.name) +
          (it.options ? '<small>' + it.options.map(function (o) { return esc(o[0]); }).join(' · ') + '</small>' : '') +
          '</span><span class="ar">' + esc(it.ar) + '</span><span class="row__dots"></span>' + cells + '</div>';
      });
      return out + '</div>';
    }).join('');
    var el = document.createElement('div'); el.className = 'page'; el.innerHTML = html; $('.js-list').appendChild(el);
    var need = rows * ROW + groups * HEAD + (groups - 1) * 26;
    var heroH = Math.max(540, Math.min(810, 1920 - 96 - 140 - 44 - need));
    return { el: el, sec: s, heroH: heroH, rows: [].slice.call(el.querySelectorAll('.grp__h, .row')) };
  });

  /* ---------- build: takeovers (2160 px wide; each screen shows its half) ---------- */
  function cupSvg(id) {
    return '<svg viewBox="-8 -8 116 116"><defs><clipPath id="' + id + '"><path d="M16.72 55.52V27.04H83.28V55.52A33.28 33.28 0 0 1 16.72 55.52Z"/></clipPath>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7ad91"/><stop offset=".16" stop-color="#2f1a0f"/></linearGradient></defs>' +
      '<circle class="glow" cx="50" cy="58" r="50" fill="#c7ad91" opacity="0"/>' +
      '<g clip-path="url(#' + id + ')"><rect class="liq" x="0" y="88.8" width="100" height="62" fill="url(#' + id + 'g)"/></g>' +
      '<g fill="none" stroke="#f2e9db" stroke-width="5"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>';
  }
  function qr(text) { if (!window.qrcode) return ''; var x = window.qrcode(0, 'M'); x.addData(text); x.make(); return x.createSvgTag({ cellSize: 8, margin: 0, scalable: true }); }
  var CUPX = [250, 540, 830, 1330, 1620, 1910];
  var tk1 = $('.js-tk1'); tk1.className = 'tk tk--card js-tk1';
  tk1.innerHTML = '<div class="tk__w">' +
    '<p class="abs tk__kick" style="left:0;width:1080px;top:150px;text-align:center;color:#c7ad91">The Refill Card</p>' +
    '<p class="abs tk__script t1-a" style="left:0;width:1080px;top:260px;text-align:center">Five cups.</p>' +
    '<p class="abs tk__script t1-b" style="left:1080px;width:1080px;top:170px;text-align:center;line-height:1.05">the sixth<br>is on us.</p>' +
    CUPX.map(function (x, i) {
      return '<div class="cupx t1-cup" style="left:' + (x - 115) + 'px;top:760px">' + cupSvg('tc' + i) + '</div>' +
        (i < 5 ? '<p class="abs t1-num" style="left:' + (x - 60) + 'px;width:120px;top:1010px;text-align:center;font:700 22px/1 Montserrat;letter-spacing:.3em;color:#c7ad91">0' + (i + 1) + '</p>'
          : '<p class="abs t1-onus" style="left:' + (x - 140) + 'px;width:280px;top:990px;text-align:center;font:400 84px/1 Script;color:#f2e9db">on us</p>');
    }).join('') +
    '<p class="abs ar t1-ar" style="left:0;width:1080px;top:1240px;text-align:center;color:#f2e9db">خمس أختام، والسادس علينا</p>' +
    '<p class="abs tk__p t1-p" style="left:140px;width:800px;top:1360px;text-align:center;color:rgba(242,233,219,.8)">One stamp for every drink. Ask at the bar, or scan to get your card.</p>' +
    '<div class="qr t1-qr" style="left:' + (1620 - 230) + 'px;top:1180px;width:460px">' + qr('https://therefillcafe.com/card') + '<p>THEREFILLCAFE.COM/CARD</p></div>' +
    '<p class="abs tk__kick" style="left:1080px;width:1080px;top:1780px;text-align:center;color:#c7ad91">Works in Apple Wallet</p>' +
    '<p class="abs tk__kick" style="left:0;width:1080px;top:1780px;text-align:center;color:#c7ad91">REFILL · El Shorouk</p></div>';

  var tk2 = $('.js-tk2');
  tk2.innerHTML = '<div class="tk__w">' +
    '<p class="abs tk__kick" style="left:96px;top:190px;color:#8a6a4f">Order ahead</p>' +
    '<p class="abs tk__script t2-s" style="left:80px;top:250px;font-size:190px;color:#653d26">skip the line</p>' +
    ['Scan the code', 'Order &amp; pay on your phone', 'We call your name'].map(function (t, i) {
      return '<div class="abs step t2-step" style="left:110px;top:' + (640 + i * 150) + 'px"><b>' + (i + 1) + '</b><span>' + t + '</span></div>';
    }).join('') +
    '<p class="abs ar t2-ar" style="left:96px;width:900px;top:1110px;text-align:left;color:#653d26">اطلب من موبايلك، واستلم من غير طابور</p>' +
    '<div class="notif t2-n" style="left:160px;top:1380px"><span class="notif__ic"><i></i></span><div><b>REFILL <span>now</span></b><p>Order #012: Ready at the bar</p></div></div>' +
    '<p class="abs tk__kick t2-wl" style="left:160px;width:760px;top:1610px;text-align:center;color:#8a6a4f">Add your order to Apple Wallet. We ping you when it’s ready.</p>' +
    '<svg class="abs t2-cup" style="left:' + (1620 - 400) + 'px;top:300px;width:800px;height:800px;overflow:visible" viewBox="0 0 100 100"><g fill="none" stroke="#653d26" stroke-width="3.2"><path d="M6.2 3.36H93.8"/><path d="M13.36 55.52V23.68H86.64V55.52A36.64 36.64 0 0 1 13.36 55.52Z"/></g></svg>' +
    '<div class="qr t2-qr" style="left:' + (1620 - 230) + 'px;top:520px;width:460px;box-shadow:0 20px 50px rgba(101,61,38,.18)">' + qr('https://therefillcafe.com/menu') + '<p>THEREFILLCAFE.COM</p></div>' +
    '<p class="abs tk__big t2-big" style="left:1080px;width:1080px;top:1240px;text-align:center;color:#653d26">Scan.<br>Order.<br>Pick up.</p>' +
    '<p class="abs tk__kick" style="left:1080px;width:1080px;top:1780px;text-align:center;color:#8a6a4f">Card or mobile wallet · Secure by Kashier</p></div>';

  /* ---------- easing ---------- */
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
  var inOut = function (x) { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var win = function (t, a, d) { return ease((t - a) / d); };

  /* ---------- render(t) ---------- */
  var secEl = $('.js-sec'), hero = $('.js-hero'), list = $('.js-list'), lastPage = -1;
  function setSec(i) {
    if (i === lastPage) return; lastPage = i;
    var s = pages[i].sec;
    secEl.innerHTML = '<span>0' + (SCREEN === 1 ? i + 1 : i + 3) + ' · ' + esc(s.title) + '</span><span class="ar">' + esc(s.ar) + '</span>';
    hero.style.height = pages[i].heroH + 'px';
    list.style.top = (140 + pages[i].heroH + 44) + 'px';
  }
  function render(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    var page = t < 31 ? 0 : t < 67 ? 1 : 0, pStart = page === 0 ? (t >= 67 ? 72 : 0) : 36;
    if (t >= 67) pStart = 72;   // page A comes back under the end of the second takeover
    setSec(page);
    var lt = t - pStart; if (lt < -10) lt += LOOP;

    /* list rows rise in, one after another */
    pages.forEach(function (pg, i) {
      var on = i === page;
      pg.el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      pg.rows.forEach(function (r, k) {
        var e = win(lt, 0.55 + k * 0.045, 0.8);
        r.style.opacity = e; r.style.transform = 'translateY(' + ((1 - e) * 26).toFixed(1) + 'px)';
      });
    });

    /* hero clips: four slots of 6.5 s, cross-faded */
    var off = page === 0 ? 0 : 2, slotF = clamp(lt, 0, 25.99) / SLOT, slot = Math.floor(slotF), within = lt - slot * SLOT;
    CLIPS.forEach(function (c, ci) {
      var el = clipEls[ci], tl = titleEls[ci], k = (ci - off + 4) % 4;   // the slot this clip plays in
      var start = k * SLOT, o = 0;
      if (k === slot) o = k === 0 ? 1 : clamp((lt - start + FADE) / FADE, 0, 1);
      else if (k === slot + 1 && within > SLOT - FADE) o = clamp((within - (SLOT - FADE)) / FADE, 0, 1);
      el.style.opacity = o;
      var local = clamp(lt - start + FADE, 0, 6.5);
      el.style.transform = 'scale(' + (1.06 - 0.06 * clamp(local / 6.5, 0, 1)).toFixed(4) + ')';
      if (CAPTURE) {
        if (o > 0) { var fr = String(Math.min(164, Math.floor(local * 25) + 1)).padStart(3, '0'), src = '/screens/frames/' + c.f + '/' + fr + '.jpg'; if (el.getAttribute('src') !== src) el.setAttribute('src', src); }
      } else if (o > 0) {
        if (el.paused || Math.abs(el.currentTime - local) > 0.35) { try { el.currentTime = local; } catch (e) { /* not loaded */ } var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else if (!el.paused) el.pause();
      var te = k === slot ? win(within, 0.4, 0.9) * (1 - win(within, SLOT - 0.5, 0.4)) : 0;
      if (k === 0 && slot === 0) te = win(lt, 0.9, 0.9) * (1 - win(within, SLOT - 0.5, 0.4));
      tl.style.opacity = te; tl.style.transform = 'translateY(' + ((1 - te) * 24).toFixed(1) + 'px)';
    });

    /* takeovers: a pour-down reveal in, and out */
    [[tk1, 26], [tk2, 62]].forEach(function (x, n) {
      var el = x[0], a = x[1], l = t - a;
      if (l < 0 || l > 10) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = 'visible';
      var inn = inOut(l / 0.9), out = inOut((l - 9.1) / 0.9);
      el.style.clipPath = l < 9.1 ? 'inset(0 0 ' + ((1 - inn) * 100).toFixed(2) + '% 0)' : 'inset(' + (out * 100).toFixed(2) + '% 0 0 0)';
      if (n === 0) renderCard(l); else renderOrder(l);
    });
  }
  function fade(sel, root, l, a, d, dy) {
    [].forEach.call(root.querySelectorAll(sel), function (el, i) {
      var e = win(l, a + i * 0.12, d || 0.8);
      el.style.opacity = e; el.style.transform = 'translateY(' + ((1 - e) * (dy == null ? 30 : dy)).toFixed(1) + 'px)';
    });
  }
  function renderCard(l) {
    fade('.t1-a', tk1, l, 0.5); fade('.t1-b', tk1, l, 0.8); fade('.t1-ar, .t1-p', tk1, l, 6.0); fade('.t1-num', tk1, l, 1.0, 0.6, 12);
    [].forEach.call(tk1.querySelectorAll('.t1-cup'), function (c, i) {
      var start = 1.4 + i * 0.7, f = inOut((l - start) / 0.55), y = 88.8 - (88.8 - 27.04) * (i === 5 ? 1 : 0.86) * f;
      c.querySelector('.liq').setAttribute('y', y.toFixed(2));
      var pop = i === 5 ? 1 + 0.08 * Math.sin(clamp((l - start - 0.4) / 0.6, 0, 1) * Math.PI) : 1;
      c.style.transform = 'scale(' + pop.toFixed(3) + ')';
      if (i === 5) c.querySelector('.glow').setAttribute('opacity', (0.22 * win(l, start + 0.3, 0.8)).toFixed(3));
    });
    var on = tk1.querySelector('.t1-onus'), e = win(l, 5.2, 0.7); on.style.opacity = e; on.style.transform = 'scale(' + (0.8 + 0.2 * e).toFixed(3) + ')';
    var qe = win(l, 1.6, 0.9), qq = tk1.querySelector('.t1-qr'); qq.style.opacity = qe; qq.style.transform = 'translateY(' + ((1 - qe) * 40).toFixed(1) + 'px)';
  }
  function renderOrder(l) {
    fade('.t2-s', tk2, l, 0.5); fade('.t2-step', tk2, l, 1.3, 0.7, 24); fade('.t2-ar', tk2, l, 2.6);
    var n = tk2.querySelector('.t2-n'), ne = win(l, 4.4, 0.9); n.style.opacity = ne; n.style.transform = 'translateY(' + ((1 - ne) * 80).toFixed(1) + 'px) scale(' + (0.96 + 0.04 * ne).toFixed(3) + ')';
    fade('.t2-wl', tk2, l, 5.2);
    var c = tk2.querySelector('.t2-cup'), ce = win(l, 0.6, 1.2); c.style.opacity = ce; c.style.transform = 'translateY(' + ((1 - ce) * 40).toFixed(1) + 'px)';
    var qq = tk2.querySelector('.t2-qr'), qe = win(l, 1.1, 0.9); qq.style.opacity = qe; qq.style.transform = 'scale(' + (0.9 + 0.1 * qe).toFixed(3) + ')';
    fade('.t2-big', tk2, l, 2.0);
  }

  /* ---------- fit any TV resolution ---------- */
  /* Rotation, for TVs that are mounted upright but whose picture cannot be rotated in their own settings:
     ?rotate=90 turns the picture a quarter turn clockwise, ?rotate=270 the other way, ?rotate=0 never turns it.
     With no ?rotate, a landscape screen is turned 90 automatically and a portrait one is left alone. */
  var ROT = q.has('rotate') ? ((parseInt(q.get('rotate'), 10) || 0) % 360 + 360) % 360 : null;
  function fit() {
    var w = innerWidth, h = innerHeight, tv = $('.js-tv');
    var rot = ROT == null ? (w > h ? 90 : 0) : ROT, side = rot === 90 || rot === 270;
    var s = side ? Math.min(w / 1920, h / 1080) : Math.min(w / 1080, h / 1920);
    document.documentElement.style.cssText = 'width:' + w + 'px;height:' + h + 'px';
    document.body.style.cssText = 'width:' + w + 'px;height:' + h + 'px';
    tv.style.transform = 'translate(' + (w / 2) + 'px,' + (h / 2) + 'px) rotate(' + rot + 'deg) scale(' + s + ') translate(-540px,-960px)';
  }

  if (CAPTURE) { window.__render = render; window.__ready = true; render(0); return; }
  fit(); addEventListener('resize', fit);

  /* ---------- one clock for both screens: the server's ---------- */
  var offset = 0;
  function sync() {
    var t0 = Date.now();
    fetch('/api/time', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { var t1 = Date.now(); offset = j.now + (t1 - t0) / 2 - t1; }).catch(function () {});
  }
  sync(); setInterval(sync, 10 * 60 * 1000);
  (function loop() { render((Date.now() + offset) / 1000); requestAnimationFrame(loop); })();

  /* keep the screen awake, and pick up menu changes every morning at 04:00 */
  function wake() { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(function () {}); }
  wake(); document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  document.addEventListener('click', function () { if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); wake(); });
  setInterval(function () { var h = new Date().getHours(); if (h === 4 && performance.now() > 3600e3) location.reload(); }, 5 * 60 * 1000);
})();

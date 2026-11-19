/* REFILL — the menu.
   Contents page, four numbered sections, every item named plainly, with its Arabic name underneath.
   Hot / Iced switch: flip it and every drink is re-poured (photos swap to the iced version, the rest steps back).
   Flavour chips swap the photo. "Can't decide?" spins the bar like the reel: tap Stop, that's your order.
   Desktop: the item you point at is served in the Refill cup on the right. Phone: tap for a detail sheet.
   Everything comes from /js/menu-data.js. */
(function () {
  'use strict';
  var R = window.R, $ = R.$, $$ = R.$$, M = window.MENU;
  var root = $('.js-menu'); if (!root || !M) return;
  var gsap = window.gsap, reduce = R.reduce;
  var TONE = { coffee: '#DCD0C2', 'not-coffee': '#D6D2BE', bakehouse: '#CDB9A2', kitchen: '#D3C4B1' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var SHORT = { v: 'V', n: 'N', new: 'New', soon: 'Soon' };

  var byId = {}, secOf = {}, grpOf = {}, list = [], total = 0;
  M.sections.forEach(function (s) { s.groups.forEach(function (g) { g.items.forEach(function (it) { byId[it.id] = it; secOf[it.id] = s; grpOf[it.id] = g; list.push(it); total++; }); }); });
  var hasPrices = list.some(function (it) { return it.price != null; });
  document.body.classList.toggle('no-prices', !hasPrices);

  /* ---------- state ---------- */
  var temp = 'all', opt = {};
  function has(it, t) { return (it.tags || []).indexOf(t) > -1; }
  function isDrink(it) { return !!it.serve; }
  function fits(it) { return temp === 'all' || !isDrink(it) || it.serve.indexOf(temp) > -1; }
  function imgFor(it) {
    if (it.options) return it.options[opt[it.id] || 0][1];
    if (temp === 'iced' && it.iced) return it.iced;
    if (temp === 'hot' && it.img) return it.img;
    return it.img || it.iced || null;
  }
  function both(it) { return it.serve && it.serve.length > 1; }
  function nameFor(it) { return temp === 'iced' && both(it) ? 'Iced ' + it.name : it.name; }
  function optLabel(it) { return it.options ? it.options[opt[it.id] || 0][0] : ''; }
  function priceText(it) {
    if (it.price == null) return '';
    return (Array.isArray(it.price) ? it.price.filter(function (p) { return p != null; }).join(' / ') : it.price) + ' ' + M.currency;
  }
  function serve(it) {
    if (!it.serve) return '';
    return '<span class="serve">' + it.serve.map(function (k) { return '<i class="serve__' + k + '">' + (k === 'hot' ? 'Hot' : 'Iced') + '</i>'; }).join('') + '</span>';
  }
  function tags(it) {
    return (it.tags || []).filter(function (k) { return SHORT[k] && k !== 'v'; }).map(function (k) {
      return '<span class="tag tag--' + k + '" title="' + esc(M.legend[k]) + '">' + SHORT[k] + '</span>';
    }).join('');
  }
  function opts(it, cls) {
    if (!it.options) return '';
    return '<div class="opts ' + (cls || '') + '" role="radiogroup" aria-label="' + esc(it.name) + ' flavour">' + it.options.map(function (o, i) {
      return '<button type="button" class="opt' + ((opt[it.id] || 0) === i ? ' is-on' : '') + '" role="radio" aria-checked="' + ((opt[it.id] || 0) === i) + '" data-opt="' + i + '">' + esc(o[0]) + '</button>';
    }).join('') + '</div>';
  }
  var src = function (f, small) { return '/assets/menu/' + f + (small ? '-s' : '') + '.webp'; };

  /* ---------- contents page ---------- */
  $('.js-toc').innerHTML = M.sections.map(function (s, si) {
    return '<div class="toc__col"><a class="toc__sec" href="#' + s.id + '"><span>0' + (si + 1) + '</span>' + esc(s.title) +
      '<em class="ar" lang="ar" dir="rtl">' + s.ar + '</em></a><ol>' + s.groups.map(function (g) {
        return '<li><a href="#g-' + g.id + '"><span>' + esc(g.title) + '</span><span class="toc__n">' + g.items.length + '</span></a></li>';
      }).join('') + '</ol></div>';
  }).join('');
  var count = $('.js-count'); if (count) count.textContent = total + ' things, ' + list.filter(isDrink).length + ' of them to drink';

  function pizza() {
    return '<div class="pizza-card"><img src="/assets/menu/margherita.webp" alt="" loading="lazy" width="900" height="900">' +
      '<p class="label">After dark · coming soon</p><h3>The pizza oven is on its way.</h3>' +
      '<a data-link="instagram" target="_blank" rel="noopener">Follow for the first slice</a></div>';
  }

  /* ---------- the menu ---------- */
  root.innerHTML = M.sections.map(function (s, si) {
    return '<section class="mn-sec" id="' + s.id + '" data-sec="' + s.id + '">' +
      '<header class="mn-sec__head">' +
        '<p class="label mn-sec__num" data-reveal><span>0' + (si + 1) + '</span><span>' + esc(s.when) + '</span></p>' +
        '<h2 class="mn-sec__title" data-reveal>' + esc(s.title) + '<span class="ar" lang="ar" dir="rtl">' + s.ar + '</span></h2>' +
        '<p class="mn-sec__intro" data-reveal>' + esc(s.intro) + '</p>' +
      '</header>' +
      s.groups.map(function (g, gi) {
        return '<div class="grp" id="g-' + g.id + '" data-grp="' + g.id + '">' +
          '<div class="grp__head"><div><h3 class="grp__title"><span class="grp__num">' + (si + 1) + '.' + (gi + 1) + '</span>' + esc(g.title) +
            (g.ar ? '<span class="ar grp__ar" lang="ar" dir="rtl">' + g.ar + '</span>' : '') + '</h3>' +
            (g.desc ? '<p class="grp__desc">' + esc(g.desc) + '</p>' : '') + '</div></div>' +
          g.items.map(function (it) {
            var im = imgFor(it);
            return '<div class="item' + (im ? '' : ' item--text') + '" id="i-' + it.id + '" data-id="' + it.id + '">' +
              '<button class="item__open" type="button" aria-label="' + esc(it.name + (priceText(it) ? ', ' + priceText(it) : '')) + '">' +
                '<span class="item__name"><span class="item__nm">' + esc(it.name) + '</span>' + (tags(it) ? ' <span class="tags">' + tags(it) + '</span>' : '') + '</span>' +
                '<span class="item__real"><span class="ar" lang="ar" dir="rtl">' + esc(it.ar) + '</span></span>' +
              '</button>' +
              '<span class="item__side">' + (priceText(it) ? '<span class="item__p">' + priceText(it) + '</span>' : '') + serve(it) + '</span>' +
              '<p class="item__desc">' + esc(it.desc) + '</p>' +
              opts(it) +
              (im ? '<span class="item__thumb cupf" style="--tone:' + TONE[s.id] + '"><img src="' + src(im, true) + '" alt="" loading="lazy" width="240" height="240"></span>' : '') +
            '</div>';
          }).join('') +
        '</div>';
      }).join('') + (s.special === 'pizza' ? pizza() : '') + '</section>';
  }).join('');

  var legend = $('.js-legend');
  if (legend) legend.innerHTML = '<span><span class="serve"><i class="serve__hot">Hot</i></span>Served hot</span><span><span class="serve"><i class="serve__iced">Iced</i></span>Served over ice</span>' +
    '<span><span class="tag tag--n">N</span>' + esc(M.legend.n) + '</span>';

  $$('[data-link]', root).forEach(function (a) { var u = R.cfg[a.getAttribute('data-link')]; if (u) a.setAttribute('href', u); });
  R.reveal(root);

  /* ---------- anchors land below the sticky bars ---------- */
  var tabsBar = $('.js-tabs'), topBar = $('.js-top');
  R.anchorOffset = function () { return -((topBar ? topBar.offsetHeight : 64) + tabsBar.offsetHeight + 12); };

  /* ---------- table mode: /order?table=4 or /menu?table=4 ---------- */
  var table = (new URLSearchParams(location.search).get('table') || '').replace(/\D/g, '').slice(0, 3);
  if (table) {
    var pill = $('.js-table'); pill.hidden = false;
    pill.innerHTML = '<b>Table ' + (table.length < 2 ? '0' + table : table) + '</b> Order at the bar, we bring it over.';
  }

  /* ---------- Hot / Iced: re-pour the whole menu ---------- */
  var tempLine = $('.js-temp-line');
  var LINES = { all: 'Everything, hot and iced.', hot: 'Hot drinks only. Food stays on the table.', iced: 'Over ice. Every drink that comes cold, poured cold.' };
  function paintItem(el) {
    var it = byId[el.getAttribute('data-id')], im = imgFor(it), th = $('.item__thumb img', el);
    el.classList.toggle('is-dim', !fits(it));
    var nm = $('.item__nm', el); if (nm) nm.textContent = nameFor(it);
    if (th && im && th.getAttribute('src') !== src(im, true)) {
      if (gsap && !reduce) gsap.fromTo(th, { opacity: 0, y: 10, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'expo.out' });
      th.src = src(im, true);
    }
    $$('.opt', el).forEach(function (b, i) { var on = (opt[it.id] || 0) === i; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
  }
  function setTemp(t) {
    if (t === temp) return; temp = t;
    document.documentElement.setAttribute('data-temp', t);
    $$('[data-temp-set]').forEach(function (b) { var on = b.getAttribute('data-temp-set') === t; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
    $$('.temp').forEach(function (sw) { sw.style.setProperty('--i', ['all', 'hot', 'iced'].indexOf(t)); });
    if (tempLine) tempLine.textContent = LINES[t];
    $$('.item', root).forEach(paintItem);
    var cur = picked || hoverEl; if (cur) showItem(byId[cur.getAttribute('data-id')]); else if (curSec) showSection(curSec);
    if (t !== 'all' && !reduce) {
      var drinksTop = $('#coffee').getBoundingClientRect().top;
      if (drinksTop > window.innerHeight) R.scrollToEl($('#coffee'));
    }
  }
  $$('[data-temp-set]').forEach(function (b) { b.addEventListener('click', function () { setTemp(b.getAttribute('data-temp-set')); }); });

  /* ---------- section tabs, category chips, scroll-spy ---------- */
  var tabs = $$('.js-tabs .tabs__in a'), ink = $('.js-ink'), subs = $('.js-subs');
  var secs = $$('.mn-sec', root), grps = $$('.grp', root), curSec = null, curGrp = null;
  function paintInk(a) { if (!a) return; ink.style.width = a.offsetWidth + 'px'; ink.style.transform = 'translateX(' + a.offsetLeft + 'px)'; }
  function setSec(id) {
    if (id === curSec) return; curSec = id; curGrp = null;
    tabs.forEach(function (a) {
      var on = a.getAttribute('data-tab') === id; a.classList.toggle('is-active', on);
      if (on) { paintInk(a); var bar = a.parentNode; if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' }); }
    });
    var s = M.sections.filter(function (x) { return x.id === id; })[0];
    subs.innerHTML = s.groups.map(function (g) { return '<a href="#g-' + g.id + '" data-g="' + g.id + '">' + esc(g.title) + '<span>' + g.items.length + '</span></a>'; }).join('');
    if (!picked && !hoverEl) showSection(id);
  }
  function setGrp(id) {
    if (id === curGrp) return; curGrp = id;
    $$('a', subs).forEach(function (a) {
      var on = a.getAttribute('data-g') === id; a.classList.toggle('is-on', on);
      if (on) subs.scrollTo({ left: a.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
  function spy() {
    var y = Math.max(-R.anchorOffset() + 40, window.innerHeight * 0.36), sec = secs[0].id, grp = null;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) sec = s.id; });
    setSec(sec);
    grps.forEach(function (g) { if (g.getBoundingClientRect().top <= y && g.closest('.mn-sec').id === sec) grp = g.getAttribute('data-grp'); });
    if (!grp) { var first = $('#' + sec + ' .grp'); grp = first && first.getAttribute('data-grp'); }
    setGrp(grp);
  }
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', function () { paintInk($('.js-tabs .tabs__in a.is-active')); });

  /* ---------- stage (desktop): the item, served in the Refill cup ---------- */
  var stageCup = $('.js-stage-cup');
  var imgs = stageCup ? [$('.js-stage-img'), $('.js-stage-img2')] : [], front = 0, shownImg = '';
  var picked = null, hoverEl = null;
  var desktop = window.matchMedia('(min-width: 901px)');
  function setImg(f) {
    if (!stageCup || f === shownImg) return; shownImg = f;
    var next = imgs[1 - front], prev = imgs[front];
    next.src = f; front = 1 - front;
    if (gsap && !reduce) {
      gsap.killTweensOf(imgs);
      gsap.fromTo(next, { opacity: 0, y: 46, rotation: -5, scale: 0.94 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.95, ease: 'expo.out' });
      gsap.to(prev, { opacity: 0, y: -34, rotation: 4, duration: 0.55, ease: 'power2.in' });
    } else { next.style.opacity = 1; prev.style.opacity = 0; }
  }
  function showItem(it) {
    if (!stageCup || !it) return;
    var s = secOf[it.id], g = grpOf[it.id], im = imgFor(it);
    stageCup.style.setProperty('--tone', TONE[s.id]);
    if (im) setImg(src(im));
    var temps = it.serve && it.serve.length ? (temp !== 'all' && it.serve.indexOf(temp) > -1 ? (temp === 'hot' ? 'Hot' : 'Iced') : it.serve.map(function (k) { return k === 'hot' ? 'Hot' : 'Iced'; }).join(' or ')) : '';
    $('.js-stage-kicker').textContent = [g.title, temps, optLabel(it), priceText(it)].filter(Boolean).join(' · ');
    $('.js-stage-name').textContent = nameFor(it);
    $('.js-stage-real').innerHTML = '<span class="ar" lang="ar" dir="rtl">' + esc(it.ar) + '</span>';
    var pair = it.pairs && byId[it.pairs];
    $('.js-stage-notes').textContent = it.desc + (pair ? '  Goes well with ' + pair.name + '.' : '');
  }
  function showSection(id) {
    var s = M.sections.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var first = null;
    s.groups.some(function (g) { return g.items.some(function (it) { if (imgFor(it) && fits(it)) { first = it; return true; } }); });
    if (first) showItem(first);
  }
  function mark(el) { $$('.item.is-on', root).forEach(function (x) { if (x !== el) x.classList.remove('is-on'); }); if (el) el.classList.add('is-on'); }

  root.addEventListener('pointerover', function (e) {
    if (!desktop.matches || e.pointerType === 'touch') return;
    var b = e.target.closest('.item'); if (!b || b === hoverEl) return;
    hoverEl = b; mark(b); showItem(byId[b.getAttribute('data-id')]);
  });
  root.addEventListener('pointerleave', function () {
    hoverEl = null;
    if (picked) { mark(picked); showItem(byId[picked.getAttribute('data-id')]); } else mark(null);
  });
  root.addEventListener('focusin', function (e) { var b = e.target.closest('.item'); if (b && desktop.matches) { mark(b); showItem(byId[b.getAttribute('data-id')]); } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.item'); if (!b) return;
    var it = byId[b.getAttribute('data-id')], o = e.target.closest('.opt');
    if (o) { opt[it.id] = +o.getAttribute('data-opt'); paintItem(b); if (desktop.matches) { picked = b; mark(b); showItem(it); } return; }
    if (e.target.closest('a')) return;
    if (desktop.matches) { picked = b; mark(b); showItem(it); }
    else openSheet(it);
  });

  /* ---------- sheet (phones) ---------- */
  var sheet = $('.js-sheet'), card = sheet && $('.sheet__card', sheet), lastFocus = null, sheetItem = null;
  function paintSheet(it) {
    var s = secOf[it.id], g = grpOf[it.id], im = imgFor(it);
    var cup = $('.js-sheet-cup'); cup.style.setProperty('--tone', TONE[s.id]); cup.classList.toggle('is-empty', !im);
    var img = $('.js-sheet-img');
    if (im && img.getAttribute('src') !== src(im)) { img.src = src(im); img.alt = it.name; if (gsap && !reduce && !sheet.hidden) gsap.fromTo(img, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'expo.out' }); }
    $('.js-sheet-kicker').textContent = s.title + ' · ' + g.title;
    $('.js-sheet-name').textContent = nameFor(it);
    $('.js-sheet-real').innerHTML = '<span class="ar" lang="ar" dir="rtl">' + esc(it.ar) + '</span>';
    $('.js-sheet-price').textContent = priceText(it);
    $('.js-sheet-desc').textContent = it.desc;
    $('.js-sheet-opts').innerHTML = opts(it, 'opts--sheet') + serve(it);
    var pair = it.pairs && byId[it.pairs], pb = $('.js-sheet-pair');
    pb.hidden = !pair;
    if (pair) { pb.innerHTML = '<span>Goes well with <b>' + esc(pair.name) + '</b></span><span aria-hidden="true">→</span>'; pb.onclick = function () { openSheet(pair); }; }
  }
  function openSheet(it) {
    sheetItem = it; paintSheet(it);
    card.scrollTop = 0;
    if (!sheet.hidden) return;
    lastFocus = document.activeElement;
    sheet.hidden = false; void sheet.offsetWidth; sheet.classList.add('is-open');
    document.body.style.overflow = 'hidden'; if (R.lenis) R.lenis.stop();
    $('.sheet__close', sheet).focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', '#i-' + it.id);
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open'); card.style.removeProperty('--drag');
    document.body.style.overflow = ''; if (R.lenis) R.lenis.start();
    setTimeout(function () { if (!sheet.classList.contains('is-open')) sheet.hidden = true; }, 600);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }
  if (sheet) {
    $('.js-sheet-opts').addEventListener('click', function (e) {
      var o = e.target.closest('.opt'); if (!o || !sheetItem) return;
      opt[sheetItem.id] = +o.getAttribute('data-opt'); paintSheet(sheetItem); paintItem($('#i-' + sheetItem.id));
    });
    $$('.js-sheet-close', sheet).forEach(function (b) { b.addEventListener('click', closeSheet); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSheet(); closeSpin(); } });
    var y0 = null, dy = 0;
    card.addEventListener('touchstart', function (e) { if (card.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    card.addEventListener('touchmove', function (e) {
      if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 0) { sheet.classList.add('is-drag'); card.style.setProperty('--drag', dy + 'px'); }
    }, { passive: true });
    card.addEventListener('touchend', function () {
      if (y0 == null) return; y0 = null; sheet.classList.remove('is-drag');
      if (dy > 110) closeSheet(); else card.style.setProperty('--drag', '0px');
    });
  }

  /* ---------- Can't decide? Stop the reel ---------- */
  var spin = $('.js-spin'), spinTimer = null, spinIdx = 0, pool = [], landed = null, stopping = false;
  function poolNow() {
    return list.filter(function (it) { return imgFor(it) && fits(it) && !has(it, 'soon'); }).sort(function () { return Math.random() - 0.5; });
  }
  function spinShow(it, small) {
    var s = secOf[it.id];
    $('.js-spin-cup').style.setProperty('--tone', TONE[s.id]);
    $('.js-spin-img').src = src(imgFor(it), small);
    $('.js-spin-name').textContent = nameFor(it);
    $('.js-spin-real').textContent = [optLabel(it), it.ar].filter(Boolean).join(' · ');
  }
  function tick(delay) {
    spinIdx = (spinIdx + 1) % pool.length; spinShow(pool[spinIdx], true);
    if (!stopping) { spinTimer = setTimeout(function () { tick(70); }, delay); return; }
    if (delay > 300) { land(pool[spinIdx]); return; }
    spinTimer = setTimeout(function () { tick(delay * 1.38); }, delay);
  }
  function startSpin() {
    pool = poolNow(); if (!pool.length) return;
    pool.forEach(function (it) { var i = new Image(); i.src = src(imgFor(it), true); });
    landed = null; stopping = false; spin.classList.remove('is-landed');
    $('.js-spin-stop').hidden = false; $('.js-spin-done').hidden = true;
    clearTimeout(spinTimer);
    if (reduce) { stopping = true; land(pool[0]); return; }
    tick(70);
    spinTimer2 = setTimeout(stopSpin, 5200);
  }
  var spinTimer2 = null;
  function stopSpin() { if (stopping) return; stopping = true; clearTimeout(spinTimer2); clearTimeout(spinTimer); tick(90); }
  function land(it) {
    clearTimeout(spinTimer); clearTimeout(spinTimer2); landed = it;
    spinShow(it, false); spin.classList.add('is-landed');
    if (gsap && !reduce) gsap.fromTo('.js-spin-img', { y: 40, rotation: -6, scale: .9 }, { y: 0, rotation: 0, scale: 1, duration: 1, ease: 'elastic.out(1, .6)' });
    $('.js-spin-stop').hidden = true; $('.js-spin-done').hidden = false;
    $('.js-spin-go').focus({ preventScroll: true });
  }
  function openSpin() {
    if (!spin) return;
    spin.hidden = false; void spin.offsetWidth; spin.classList.add('is-open');
    document.body.style.overflow = 'hidden'; if (R.lenis) R.lenis.stop();
    startSpin(); $('.js-spin-stop').focus({ preventScroll: true });
  }
  function closeSpin() {
    if (!spin || spin.hidden) return;
    clearTimeout(spinTimer); clearTimeout(spinTimer2);
    spin.classList.remove('is-open');
    document.body.style.overflow = ''; if (R.lenis) R.lenis.start();
    setTimeout(function () { if (!spin.classList.contains('is-open')) spin.hidden = true; }, 500);
  }
  if (spin) {
    $$('.js-spin-open').forEach(function (b) { b.addEventListener('click', openSpin); });
    $$('.js-spin-close', spin).forEach(function (b) { b.addEventListener('click', closeSpin); });
    $('.js-spin-stop').addEventListener('click', stopSpin);
    $('.js-spin-again').addEventListener('click', startSpin);
    $('.js-spin-go').addEventListener('click', function () {
      var it = landed; closeSpin(); if (!it) return;
      var el = $('#i-' + it.id);
      setTimeout(function () {
        R.scrollToEl(el, -window.innerHeight * 0.4);
        el.classList.add('is-flash'); setTimeout(function () { el.classList.remove('is-flash'); }, 2400);
        if (desktop.matches) { picked = el; mark(el); showItem(it); } else setTimeout(function () { openSheet(it); }, 800);
      }, 350);
    });
  }

  /* ---------- arriving with #i-item, #g-category or #section ---------- */
  spy(); paintInk($('.js-tabs .tabs__in a.is-active'));
  var h = location.hash.slice(1);
  if (h) setTimeout(function () {
    var el = document.getElementById(h);
    if (!el) return;
    R.scrollToEl(el, h.indexOf('i-') === 0 ? -window.innerHeight * 0.4 : undefined);
    if (h.indexOf('i-') === 0) {
      var it = byId[h.slice(2)];
      if (desktop.matches) { picked = el; mark(el); showItem(it); }
      else setTimeout(function () { openSheet(it); }, 700);
    }
  }, 120);
})();

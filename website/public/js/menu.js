/* REFILL v3 — the menu. Renders /js/menu-data.js into a typeset menu with a
   desktop "stage" (the item you point at, on an arch) and a mobile detail sheet. */
(function () {
  'use strict';
  var R = window.R, $ = R.$, $$ = R.$$, M = window.MENU;
  var root = $('.js-menu'); if (!root || !M) return;
  var gsap = window.gsap, reduce = R.reduce;
  var TONE = { coffee: '#DCD0C2', bakehouse: '#CDB9A2', kitchen: '#D3C4B1' };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };

  var byId = {}, secOf = {}, grpOf = {};
  M.sections.forEach(function (s) { s.groups.forEach(function (g) { g.items.forEach(function (it) { byId[it.id] = it; secOf[it.id] = s; grpOf[it.id] = g; }); }); });

  function tags(it) {
    return (it.tags || []).filter(function (k) { return k !== 'soon'; }).map(function (k) {
      var short = { sig: 'Sig', v: 'V', vg: 'VG', n: 'N', new: 'New' }[k] || k;
      return '<span class="tag tag--' + k + '" title="' + esc(M.legend[k] || k) + '">' + short + '</span>';
    }).join('');
  }
  function isSoon(it) { return (it.tags || []).indexOf('soon') > -1; }

  /* ---------- specials ---------- */
  function beans() {
    return '<div class="beans">' + M.beans.map(function (b) {
      return '<article class="bean"><p class="label bean__role">' + esc(b.role) + '</p><h3 class="bean__name">' + esc(b.name) + '</h3>' +
        '<p class="bean__origin">' + esc(b.origin) + ' · ' + esc(b.process) + '</p><p class="bean__notes">' + esc(b.notes) + '</p>' +
        '<div class="roast"><div class="roast__track"><span class="roast__dot" style="left:' + (b.roast * 100) + '%"></span></div>' +
        '<div class="roast__lbl"><span>Light</span><span>Roast</span><span>Dark</span></div></div></article>';
    }).join('') + '</div>';
  }
  function oven(s) {
    return '<div class="oven js-oven"><div class="oven__head"><p class="label">Out of the oven today</p><p class="label muted js-oven-clock"></p></div>' +
      '<p class="oven__next js-oven-next"></p><ol class="oven__list">' + s.oven.map(function (o) {
        return '<li data-at="' + o.at + '"><time>' + R.hhmm(o.at) + '</time><span>' + esc(o.what) + '</span><span class="oven__state"></span></li>';
      }).join('') + '</ol></div>';
  }
  function pizza() {
    return '<div class="pizza-card"><img src="/assets/menu/margherita.webp" alt="" loading="lazy" width="900" height="900">' +
      '<p class="label">Act III · after dark</p><h3>The oven is being built. Pizza from 19:00, opening soon.</h3>' +
      '<a data-link="instagram" target="_blank" rel="noopener">Follow for the first slice</a></div>';
  }

  /* ---------- render ---------- */
  root.innerHTML = M.sections.map(function (s, si) {
    var special = s.special === 'beans' ? beans() : s.special === 'oven' ? oven(s) : s.special === 'pizza' ? pizza() : '';
    return '<section class="mn-sec" id="' + s.id + '" data-sec="' + s.id + '">' +
      '<header class="mn-sec__head">' +
        '<p class="label mn-sec__num" data-reveal><span>0' + (si + 1) + '</span><span>' + esc(s.when) + '</span></p>' +
        '<h2 class="mn-sec__title" data-reveal>' + esc(s.title) + '<span class="ar" lang="ar" dir="rtl">' + s.ar + '</span></h2>' +
        '<p class="mn-sec__intro" data-reveal>' + esc(s.intro) + '</p>' +
      '</header>' + special +
      s.groups.map(function (g) {
        return '<div class="grp"><div class="grp__head"><h3 class="grp__title">' + esc(g.title) + '</h3>' + (g.note ? '<span class="grp__note">' + esc(g.note) + '</span>' : '') + '</div>' +
          g.items.map(function (it) {
            return '<button class="item' + (isSoon(it) ? ' item--soon' : '') + '" type="button" id="i-' + it.id + '" data-id="' + it.id + '">' +
              '<span class="item__name">' + esc(it.name) + (tags(it) ? ' <span class="tags">' + tags(it) + '</span>' : '') + '</span>' +
              '<span class="item__lead" aria-hidden="true"></span>' +
              '<span class="item__price">' + it.price + '<span class="muted"> ' + (isSoon(it) ? 'EGP · soon' : 'EGP') + '</span></span>' +
              '<span class="item__desc">' + esc(it.desc) + '</span>' +
              (it.img ? '<span class="item__thumb" style="--tone:' + TONE[s.id] + '"><img src="/assets/menu/' + it.img + '-s.webp" alt="" loading="lazy" width="240" height="240"></span>' : '') +
            '</button>';
          }).join('') + '</div>';
      }).join('') + '</section>';
  }).join('');

  $('.js-legend').innerHTML = Object.keys(M.legend).map(function (k) {
    return '<span><span class="tag tag--' + k + '">' + ({ sig: 'Sig', v: 'V', vg: 'VG', n: 'N', new: 'New', soon: '' }[k] || '') + '</span>' + esc(M.legend[k]) + '</span>';
  }).filter(function (h) { return h.indexOf('tag--soon') < 0; }).join('');

  /* configured links inside the rendered menu */
  $$('[data-link]', root).forEach(function (a) { var u = R.cfg[a.getAttribute('data-link')]; if (u) a.setAttribute('href', u); });
  R.reveal(root);

  /* ---------- table mode: /order?table=4 or /menu?table=4 ---------- */
  var table = (new URLSearchParams(location.search).get('table') || '').replace(/\D/g, '').slice(0, 3);
  if (table) {
    var pill = $('.js-table'); pill.hidden = false;
    pill.innerHTML = '<b>Table ' + (table.length < 2 ? '0' + table : table) + '</b> Order at the bar, we bring it over.';
  }

  /* ---------- oven clock ---------- */
  var ovenEl = $('.js-oven');
  function paintOven() {
    if (!ovenEl) return;
    var now = R.cairoMinutes(), next = null;
    $('.js-oven-clock').textContent = R.hhmm(now) + ' in El Shorouk';
    $$('li', ovenEl).forEach(function (li) {
      var at = +li.getAttribute('data-at'), st = $('.oven__state', li);
      li.classList.remove('is-done', 'is-next');
      if (at <= now) { li.classList.add('is-done'); st.textContent = 'Out'; }
      else if (next == null) { next = li; li.classList.add('is-next'); st.textContent = 'Next'; }
      else st.textContent = 'Later';
    });
    var line = $('.js-oven-next');
    if (!next) line.innerHTML = 'That was the last bake. <b>What’s in the case is what’s left.</b>';
    else {
      var mins = +next.getAttribute('data-at') - now, h = Math.floor(mins / 60), m = mins % 60;
      var when = (h ? h + ' h ' : '') + (m ? m + ' min' : '');
      line.innerHTML = 'Next out of the oven: <b>' + esc($('span', next).textContent) + '</b> in ' + when.trim() + '.';
    }
  }
  paintOven(); setInterval(paintOven, 30000);

  /* ---------- tabs: scroll-spy + ink ---------- */
  var tabs = $$('.js-tabs a'), ink = $('.js-ink'), secs = $$('.mn-sec', root), current = null;
  function paintInk(a) {
    if (!a) return;
    ink.style.width = a.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function setTab(id) {
    if (id === current) return; current = id;
    tabs.forEach(function (a) { var on = a.getAttribute('data-tab') === id; a.classList.toggle('is-active', on); if (on) paintInk(a); });
    hovering = false;
    if (!picked) showSection(id);
  }
  function spy() {
    var y = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toph')) || 64) + 120, id = secs[0].id;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) id = s.id; });
    setTab(id);
  }
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', function () { paintInk($('.js-tabs a.is-active')); });

  /* ---------- stage (desktop) ---------- */
  var stage = $('.js-stage'), arch = stage && $('.stage__arch', stage);
  var imgs = stage ? [$('.js-stage-img'), $('.js-stage-img2')] : [], front = 0, shownImg = '';
  var picked = null, hovering = false;
  var desktop = window.matchMedia('(min-width: 901px)');
  function setImg(src) {
    if (!stage || src === shownImg) return; shownImg = src;
    var next = imgs[1 - front], prev = imgs[front];
    next.src = src; front = 1 - front;
    if (gsap && !reduce) {
      gsap.killTweensOf(imgs);
      gsap.fromTo(next, { opacity: 0, y: 40, rotation: -4, scale: 0.96 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'expo.out' });
      gsap.to(prev, { opacity: 0, y: -30, rotation: 3, duration: 0.6, ease: 'power2.in' });
    } else { next.style.opacity = 1; prev.style.opacity = 0; }
  }
  function showItem(it) {
    if (!stage) return;
    var s = secOf[it.id];
    arch.style.setProperty('--stage', TONE[s.id]);
    var img = it.img || firstImg(s);
    if (img) setImg('/assets/menu/' + img + '.webp');
    $('.js-stage-kicker').textContent = grpOf[it.id].title + ' · ' + it.price + ' EGP' + (isSoon(it) ? ' · soon' : '');
    $('.js-stage-name').textContent = it.name;
    var pair = it.pairs && byId[it.pairs];
    $('.js-stage-notes').textContent = (it.notes || it.desc) + (pair ? '  ·  Pairs with ' + pair.name.toLowerCase() : '');
  }
  function firstImg(s) { var f = null; s.groups.some(function (g) { return g.items.some(function (it) { if (it.img) { f = it.img; return true; } }); }); return f; }
  function showSection(id) {
    var s = M.sections.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var first = null; s.groups.some(function (g) { return g.items.some(function (it) { if (it.img && (it.tags || []).indexOf('sig') > -1) { first = it; return true; } }); });
    if (!first) s.groups.some(function (g) { return g.items.some(function (it) { if (it.img) { first = it; return true; } }); });
    if (first) showItem(first);
  }
  function mark(el) { $$('.item.is-on', root).forEach(function (x) { if (x !== el) x.classList.remove('is-on'); }); if (el) el.classList.add('is-on'); }

  root.addEventListener('pointerover', function (e) {
    if (!desktop.matches || e.pointerType === 'touch') return;
    var b = e.target.closest('.item'); if (!b) return;
    hovering = true; mark(b); showItem(byId[b.getAttribute('data-id')]);
  });
  root.addEventListener('pointerleave', function () {
    hovering = false;
    if (picked) { mark(picked); showItem(byId[picked.getAttribute('data-id')]); } else mark(null);
  });
  root.addEventListener('focusin', function (e) { var b = e.target.closest('.item'); if (b && desktop.matches) { mark(b); showItem(byId[b.getAttribute('data-id')]); } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.item'); if (!b) return;
    var it = byId[b.getAttribute('data-id')];
    if (desktop.matches) { picked = b; mark(b); showItem(it); }
    else openSheet(it);
  });

  /* ---------- sheet (phones) ---------- */
  var sheet = $('.js-sheet'), card = sheet && $('.sheet__card', sheet), lastFocus = null;
  function openSheet(it) {
    var s = secOf[it.id];
    var a = $('.sheet__arch', sheet); a.style.setProperty('--tone', TONE[s.id]);
    var img = $('.js-sheet-img'); a.classList.toggle('is-empty', !it.img);
    if (it.img) { img.src = '/assets/menu/' + it.img + '.webp'; img.alt = it.name; }
    $('.js-sheet-kicker').textContent = s.title + ' · ' + grpOf[it.id].title;
    $('.js-sheet-name').textContent = it.name;
    $('.js-sheet-price').textContent = it.price + ' EGP';
    $('.js-sheet-desc').textContent = it.desc;
    $('.js-sheet-notes').textContent = it.notes ? 'Tastes like: ' + it.notes : '';
    $('.js-sheet-tags').innerHTML = (it.tags || []).map(function (k) { return '<span>' + esc(M.legend[k] || k) + '</span>'; }).join('');
    var pair = it.pairs && byId[it.pairs], pb = $('.js-sheet-pair');
    pb.hidden = !pair;
    if (pair) { pb.innerHTML = '<span>Pairs well with <b>' + esc(pair.name) + '</b></span><span aria-hidden="true">→</span>'; pb.onclick = function () { swap(pair); }; }
    card.scrollTop = 0;
    if (!sheet.hidden) return;
    lastFocus = document.activeElement;
    sheet.hidden = false; void sheet.offsetWidth; sheet.classList.add('is-open');
    document.body.style.overflow = 'hidden'; if (R.lenis) R.lenis.stop();
    $('.sheet__close', sheet).focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', '#i-' + it.id);
  }
  function swap(it) {
    if (gsap && !reduce) gsap.fromTo($('.sheet__arch img', sheet), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.05 });
    openSheet(it);
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
    $$('.js-sheet-close', sheet).forEach(function (b) { b.addEventListener('click', closeSheet); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    /* swipe down to dismiss */
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

  /* ---------- arriving with #i-item or #section ---------- */
  spy(); paintInk($('.js-tabs a.is-active'));
  var h = location.hash.slice(1);
  if (h) setTimeout(function () {
    var el = document.getElementById(h);
    if (!el) return;
    R.scrollToEl(el, h.indexOf('i-') === 0 ? -window.innerHeight * 0.35 : undefined);
    if (h.indexOf('i-') === 0) {
      var it = byId[h.slice(2)];
      if (desktop.matches) { picked = el; mark(el); showItem(it); }
      else setTimeout(function () { openSheet(it); }, 700);
    }
  }, 120);
  if (!h) showSection('coffee');
})();

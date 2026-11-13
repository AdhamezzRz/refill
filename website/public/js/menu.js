/* REFILL v3 — the menu, set like a printed restaurant menu.
   Contents page, numbered sections and categories, price columns (Hot / Iced, Slice / Whole),
   add-ons, dietary filter. Desktop: the item you point at is served in the Refill cup on the right.
   Phone: tap an item for a detail sheet. Everything comes from /js/menu-data.js. */
(function () {
  'use strict';
  var R = window.R, $ = R.$, $$ = R.$$, M = window.MENU;
  var root = $('.js-menu'); if (!root || !M) return;
  var gsap = window.gsap, reduce = R.reduce;
  var TONE = { coffee: '#DCD0C2', bakehouse: '#CDB9A2', kitchen: '#D3C4B1' };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var SHORT = { sig: 'Sig', v: 'V', vg: 'VG', n: 'N', new: 'New' };

  var byId = {}, secOf = {}, grpOf = {}, total = 0;
  M.sections.forEach(function (s) { s.groups.forEach(function (g) { g.items.forEach(function (it) { byId[it.id] = it; secOf[it.id] = s; grpOf[it.id] = g; total++; }); }); });

  function has(it, t) { return (it.tags || []).indexOf(t) > -1; }
  function priceList(it, g) {
    var cols = g.cols || [null], p = Array.isArray(it.price) ? it.price : [it.price];
    return cols.map(function (c, i) { return { col: c, v: p[i] == null ? null : p[i] }; });
  }
  function priceText(it, g) {
    var l = priceList(it, g).filter(function (x) { return x.v != null; });
    if (!g.cols) return l[0].v + ' EGP';
    return l.map(function (x) { return x.col + ' ' + x.v; }).join(' · ') + ' EGP';
  }
  function tags(it) {
    return (it.tags || []).filter(function (k) { return SHORT[k]; }).map(function (k) {
      return '<span class="tag tag--' + k + '" title="' + esc(M.legend[k]) + '">' + SHORT[k] + '</span>';
    }).join('');
  }

  /* ---------- contents page ---------- */
  $('.js-toc').innerHTML = M.sections.map(function (s, si) {
    return '<div class="toc__col"><a class="toc__sec" href="#' + s.id + '"><span>0' + (si + 1) + '</span>' + esc(s.title) +
      '<em class="ar" lang="ar" dir="rtl">' + s.ar + '</em></a><ol>' + s.groups.map(function (g) {
        return '<li><a href="#g-' + g.id + '"><span>' + esc(g.title) + (g.note ? '<em>Soon</em>' : '') + '</span><span class="toc__n">' + g.items.length + '</span></a></li>';
      }).join('') + '</ol></div>';
  }).join('');

  /* ---------- specials ---------- */
  function beans() {
    return '<div class="special"><p class="label">This week’s beans</p><div class="beans">' + M.beans.map(function (b) {
      return '<article class="bean"><p class="label bean__role">' + esc(b.role) + '</p><h3 class="bean__name">' + esc(b.name) + '</h3>' +
        '<p class="bean__origin">' + esc(b.origin) + ' · ' + esc(b.process) + '</p><p class="bean__notes">' + esc(b.notes) + '</p>' +
        '<div class="roast"><div class="roast__track"><span class="roast__dot" style="left:' + (b.roast * 100) + '%"></span></div>' +
        '<div class="roast__lbl"><span>Light</span><span>Roast</span><span>Dark</span></div></div></article>';
    }).join('') + '</div></div>';
  }
  function oven(s) {
    return '<div class="special js-oven"><p class="label">Out of the oven today</p><div class="oven">' +
      '<div class="oven__head"><p class="oven__next js-oven-next"></p><p class="label muted js-oven-clock"></p></div><ol class="oven__list">' +
      s.oven.map(function (o) { return '<li data-at="' + o.at + '"><time>' + R.hhmm(o.at) + '</time><span>' + esc(o.what) + '</span><span class="oven__state"></span></li>'; }).join('') +
      '</ol></div></div>';
  }
  function pizza() {
    return '<div class="pizza-card"><img src="/assets/menu/margherita.webp" alt="" loading="lazy" width="900" height="900">' +
      '<p class="label">After dark</p><h3>The oven is being built. Pizza from 19:00, opening soon.</h3>' +
      '<a data-link="instagram" target="_blank" rel="noopener">Follow for the first slice</a></div>';
  }

  /* ---------- the menu ---------- */
  root.innerHTML = M.sections.map(function (s, si) {
    var sectionSpecial = s.special === 'beans' ? beans() : s.special === 'oven' ? oven(s) : '';
    return '<section class="mn-sec" id="' + s.id + '" data-sec="' + s.id + '">' +
      '<header class="mn-sec__head">' +
        '<p class="label mn-sec__num" data-reveal><span>0' + (si + 1) + '</span><span>' + esc(s.when) + '</span></p>' +
        '<h2 class="mn-sec__title" data-reveal>' + esc(s.title) + '<span class="ar" lang="ar" dir="rtl">' + s.ar + '</span></h2>' +
        '<p class="mn-sec__intro" data-reveal>' + esc(s.intro) + '</p>' +
      '</header>' +
      s.groups.map(function (g, gi) {
        var n = (g.cols || [1]).length;
        return '<div class="grp" id="g-' + g.id + '" data-grp="' + g.id + '">' +
          '<div class="grp__head"><div><h3 class="grp__title"><span class="grp__num">' + (si + 1) + '.' + (gi + 1) + '</span>' + esc(g.title) + '</h3>' +
            (g.desc ? '<p class="grp__desc">' + esc(g.desc) + '</p>' : '') + (g.note ? '<span class="grp__note">' + esc(g.note) + '</span>' : '') + '</div>' +
            (g.cols ? '<div class="cols" aria-hidden="true">' + g.cols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
          '</div>' +
          (g.special === 'pizza' ? pizza() : '') +
          g.items.map(function (it) {
            return '<button class="item' + (has(it, 'soon') ? ' item--soon' : '') + '" type="button" id="i-' + it.id + '" data-id="' + it.id + '" style="--n:' + n + '" aria-label="' + esc(it.name + ', ' + priceText(it, g)) + '">' +
              '<span class="item__name">' + esc(it.name) + (tags(it) ? ' <span class="tags">' + tags(it) + '</span>' : '') + '</span>' +
              '<span class="item__lead" aria-hidden="true"></span>' +
              '<span class="item__prices">' + priceList(it, g).map(function (x) {
                return '<span class="item__p' + (x.v == null ? ' is-na' : '') + '"' + (x.col ? ' data-col="' + esc(x.col) + '"' : '') + '>' + (x.v == null ? '—' : x.v) + '</span>';
              }).join('') + '</span>' +
              '<span class="item__desc">' + esc(it.desc) + '</span>' +
              (it.img ? '<span class="item__thumb cupf" style="--tone:' + TONE[s.id] + '"><img src="/assets/menu/' + it.img + '-s.webp" alt="" loading="lazy" width="240" height="240"></span>' : '') +
            '</button>';
          }).join('') +
          (g.extras ? '<p class="extras"><b>Add</b>' + g.extras.map(function (e) { return '<span>' + esc(e[0]) + '<i>' + (e[1] ? '+' + e[1] : 'free') + '</i></span>'; }).join('') + '</p>' : '') +
        '</div>';
      }).join('') + sectionSpecial + '</section>';
  }).join('');

  $('.js-legend').innerHTML = ['sig', 'v', 'vg', 'n', 'new'].map(function (k) {
    return '<span><span class="tag tag--' + k + '">' + SHORT[k] + '</span>' + esc(M.legend[k]) + '</span>';
  }).join('');

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

  /* ---------- dietary filter ---------- */
  var count = $('.js-diet-count');
  $$('[data-diet]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.getAttribute('data-diet'), shown = 0;
      $$('[data-diet]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $$('.item', root).forEach(function (el) {
        var it = byId[el.getAttribute('data-id')];
        var ok = !d || (d === 'v' ? has(it, 'v') || has(it, 'vg') : d === 'vg' ? has(it, 'vg') : !has(it, 'n'));
        el.classList.toggle('is-dim', !ok); if (ok) shown++;
      });
      count.textContent = d ? shown + ' of ' + total : '';
    });
  });

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
      line.innerHTML = 'Next: <b>' + esc($('span', next).textContent) + '</b> in ' + ((h ? h + ' h ' : '') + (m ? m + ' min' : '')).trim() + '.';
    }
  }
  paintOven(); setInterval(paintOven, 30000);

  /* ---------- section tabs, category chips, scroll-spy ---------- */
  var tabs = $$('.js-tabs .tabs__in a'), ink = $('.js-ink'), subs = $('.js-subs');
  var secs = $$('.mn-sec', root), grps = $$('.grp', root), curSec = null, curGrp = null;
  function paintInk(a) { if (!a) return; ink.style.width = a.offsetWidth + 'px'; ink.style.transform = 'translateX(' + a.offsetLeft + 'px)'; }
  function setSec(id) {
    if (id === curSec) return; curSec = id; curGrp = null;
    tabs.forEach(function (a) { var on = a.getAttribute('data-tab') === id; a.classList.toggle('is-active', on); if (on) paintInk(a); });
    var s = M.sections.filter(function (x) { return x.id === id; })[0];
    subs.innerHTML = s.groups.map(function (g) { return '<a href="#g-' + g.id + '" data-g="' + g.id + '">' + esc(g.title) + '<span>' + g.items.length + '</span></a>'; }).join('');
    hovering = false;
    if (!picked) showSection(id);
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
  var picked = null, hovering = false;
  var desktop = window.matchMedia('(min-width: 901px)');
  function setImg(src) {
    if (!stageCup || src === shownImg) return; shownImg = src;
    var next = imgs[1 - front], prev = imgs[front];
    next.src = src; front = 1 - front;
    if (gsap && !reduce) {
      gsap.killTweensOf(imgs);
      gsap.fromTo(next, { opacity: 0, y: 46, rotation: -5, scale: 0.94 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.95, ease: 'expo.out' });
      gsap.to(prev, { opacity: 0, y: -34, rotation: 4, duration: 0.55, ease: 'power2.in' });
    } else { next.style.opacity = 1; prev.style.opacity = 0; }
  }
  function firstImg(s) { var f = null; s.groups.some(function (g) { return g.items.some(function (it) { if (it.img) { f = it.img; return true; } }); }); return f; }
  function showItem(it) {
    if (!stageCup) return;
    var s = secOf[it.id], g = grpOf[it.id];
    stageCup.style.setProperty('--tone', TONE[s.id]);
    var img = it.img || firstImg(s);
    if (img) setImg('/assets/menu/' + img + '.webp');
    $('.js-stage-kicker').textContent = g.title + ' · ' + priceText(it, g) + (has(it, 'soon') ? ' · soon' : '');
    $('.js-stage-name').textContent = it.name;
    var pair = it.pairs && byId[it.pairs];
    $('.js-stage-notes').textContent = (it.notes || it.desc) + (pair ? '  ·  Pairs with ' + pair.name.toLowerCase() : '');
  }
  function showSection(id) {
    var s = M.sections.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var first = null;
    s.groups.some(function (g) { return g.items.some(function (it) { if (it.img && has(it, 'sig')) { first = it; return true; } }); });
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
    var s = secOf[it.id], g = grpOf[it.id];
    var cup = $('.js-sheet-cup'); cup.style.setProperty('--tone', TONE[s.id]); cup.classList.toggle('is-empty', !it.img);
    var img = $('.js-sheet-img');
    if (it.img) { img.src = '/assets/menu/' + it.img + '.webp'; img.alt = it.name; }
    $('.js-sheet-kicker').textContent = s.title + ' · ' + g.title;
    $('.js-sheet-name').textContent = it.name;
    $('.js-sheet-price').innerHTML = priceList(it, g).filter(function (x) { return x.v != null; }).map(function (x) {
      return (x.col ? '<small>' + esc(x.col) + '</small>' : '') + x.v + ' EGP';
    }).join('<br>');
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
    if (gsap && !reduce) gsap.fromTo($('.js-sheet-img'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.05 });
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

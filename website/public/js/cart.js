/* REFILL — the order bag and checkout (menu page).
   Shows only when ordering is switched on (Kashier keys set and the menu has prices).
   The bag lives in localStorage; prices shown here are for display, the server recalculates everything. */
(function () {
  'use strict';
  var R = window.R, $ = R.$, $$ = R.$$, M = window.MENU, C = window.REFILL || {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var byId = {}; M.sections.forEach(function (s) { s.groups.forEach(function (g) { g.items.forEach(function (it) { byId[it.id] = it; }); }); });

  function unitPrice(it, temp, opt) {
    if (it.options && it.options[opt] && it.options[opt][2] != null) return +it.options[opt][2];
    var p = it.price; if (p == null) return null;
    if (typeof p === 'object' && !Array.isArray(p)) return p[temp] != null ? +p[temp] : null;
    if (Array.isArray(p)) { for (var i = 0; i < p.length; i++) if (p[i] != null) return +p[i]; return null; }
    return +p;
  }
  function orderable(it) {
    if ((it.tags || []).indexOf('soon') > -1) return false;
    var temps = it.serve || [null], n = it.options ? it.options.length : 1;
    for (var t = 0; t < temps.length; t++) for (var o = 0; o < n; o++) if (unitPrice(it, temps[t], o) != null) return true;
    return false;
  }
  var cart = R.cart = { enabled: !!C.ordering, unitPrice: unitPrice, orderable: orderable };
  if (!cart.enabled) return;
  document.body.classList.add('can-order');

  var KEY = 'refill-cart', lines = [];
  try { lines = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (l) { return byId[l.id] && l.qty > 0; }); } catch (e) { lines = []; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* private mode */ } }
  function labelOf(l) {
    var it = byId[l.id], both = it.serve && it.serve.length > 1;
    return (l.temp === 'iced' && both ? 'Iced ' : '') + it.name + (it.options ? ' · ' + it.options[l.opt || 0][0] : '');
  }
  function total() { return lines.reduce(function (s, l) { return s + (unitPrice(byId[l.id], l.temp, l.opt || 0) || 0) * l.qty; }, 0); }
  function count() { return lines.reduce(function (s, l) { return s + l.qty; }, 0); }
  var fmt = function (n) { return (Math.round(n * 100) / 100).toLocaleString('en-US') + ' EGP'; };

  cart.add = function (it, opt, temp) {
    if (!orderable(it)) return;
    temp = it.serve ? (it.serve.indexOf(temp) > -1 ? temp : it.serve[0]) : null; opt = opt || 0;
    if (unitPrice(it, temp, opt) == null) return;
    var key = it.id + '|' + opt + '|' + temp, l = lines.filter(function (x) { return x.key === key; })[0];
    if (l) l.qty = Math.min(20, l.qty + 1); else lines.push({ key: key, id: it.id, opt: opt, temp: temp, qty: 1 });
    persist(); paint();
    var b = $('.js-bag');
    if (window.gsap && !R.reduce) window.gsap.fromTo(b, { scale: 1.08 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .5)' });
    toast('Added ' + labelOf({ id: it.id, opt: opt, temp: temp }));
  };
  cart.clear = function () { lines = []; persist(); paint(); };

  var toastT = null;
  function toast(msg) {
    var t = $('.js-toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
  }

  /* ---------- table mode: the order is brought to the table ---------- */
  var table = (new URLSearchParams(location.search).get('table') || '').replace(/\D/g, '').slice(0, 3);

  /* ---------- bag + checkout ---------- */
  var bag = $('.js-bag'), co = $('.js-co'), card = co && $('.co__card', co), pickup = 'asap', lastFocus = null;
  function paint() {
    var n = count();
    bag.hidden = !n;
    $('.js-bag-count').textContent = n + (n === 1 ? ' item' : ' items');
    $('.js-bag-total').textContent = fmt(total());
    if (co.hidden) return;
    $('.js-co-lines').innerHTML = lines.length ? lines.map(function (l, i) {
      var u = unitPrice(byId[l.id], l.temp, l.opt || 0);
      return '<li><div><b>' + esc(labelOf(l)) + '</b><span>' + fmt(u) + '</span></div>' +
        '<div class="qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="One less">−</button><output>' + l.qty + '</output>' +
        '<button type="button" data-q="1" data-i="' + i + '" aria-label="One more">+</button></div></li>';
    }).join('') : '<li class="co__empty">Your bag is empty.</li>';
    $('.js-co-total').textContent = fmt(total());
    $('.js-co-pay').textContent = 'Pay ' + fmt(total());
    $('.js-co-pay').disabled = !lines.length;
  }
  function open() {
    lastFocus = document.activeElement; co.hidden = false; void co.offsetWidth; co.classList.add('is-open');
    document.body.style.overflow = 'hidden'; if (R.lenis) R.lenis.stop();
    $('.js-co-err').textContent = ''; paint(); card.scrollTop = 0;
    $('.co__close', co).focus({ preventScroll: true });
  }
  function close() {
    co.classList.remove('is-open'); document.body.style.overflow = ''; if (R.lenis) R.lenis.start();
    setTimeout(function () { if (!co.classList.contains('is-open')) co.hidden = true; }, 600);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  bag.addEventListener('click', open);
  $$('.js-co-close', co).forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !co.hidden) close(); });
  $('.js-co-lines').addEventListener('click', function (e) {
    var b = e.target.closest('[data-q]'); if (!b) return;
    var l = lines[+b.getAttribute('data-i')]; if (!l) return;
    l.qty = Math.max(0, Math.min(20, l.qty + +b.getAttribute('data-q')));
    lines = lines.filter(function (x) { return x.qty > 0; }); persist(); paint();
  });

  if (table) {
    $('.js-co-when').innerHTML = '<p class="co__table">We will bring it to <b>table ' + (table.length < 2 ? '0' + table : table) + '</b>.</p>';
  } else {
    $('.js-co-when').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]'); if (!b) return; pickup = b.getAttribute('data-pick');
      $$('[data-pick]', co).forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
    });
  }
  if (C.payMode === 'test') $('.js-co-test').hidden = false;

  var form = $('.js-co-form');
  try { var me = JSON.parse(localStorage.getItem('refill-me') || '{}'); form.name.value = me.name || ''; form.phone.value = me.phone || ''; } catch (e) { /* none */ }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('.js-co-err'), pay = $('.js-co-pay'); err.textContent = '';
    if (!lines.length) return;
    var name = form.name.value.trim(), phone = form.phone.value.replace(/[^\d+]/g, '');
    if (name.length < 2) { err.textContent = 'Add your name so we can call it out.'; form.name.focus(); return; }
    if (!/^(\+?20|0)?1[0125]\d{8}$/.test(phone)) { err.textContent = 'Add a mobile number like 01xxxxxxxxx.'; form.phone.focus(); return; }
    try { localStorage.setItem('refill-me', JSON.stringify({ name: name, phone: phone })); } catch (x) { /* private mode */ }
    pay.disabled = true; pay.textContent = 'Opening secure payment…';
    fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines.map(function (l) { return { id: l.id, opt: l.opt, temp: l.temp, qty: l.qty }; }),
        name: name, phone: phone, note: form.note.value, pickup: pickup, table: table })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (x) {
      if (!x.ok || !x.j.url) throw new Error(x.j.error || 'Something went wrong. Try again.');
      try { var mine = JSON.parse(localStorage.getItem('refill-orders') || '{}'); mine[x.j.id] = x.j.token; localStorage.setItem('refill-orders', JSON.stringify(mine)); } catch (y) { /* private mode */ }
      location.href = x.j.url;
    }).catch(function (x) { err.textContent = x.message; pay.disabled = false; pay.textContent = 'Pay ' + fmt(total()); });
  });

  paint();
})();

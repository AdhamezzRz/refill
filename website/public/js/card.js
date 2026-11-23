/* REFILL — the Refill Card in the browser: join, see your stamps, show the QR code at the bar. */
(function () {
  'use strict';
  var $ = window.R.$, C = window.REFILL || {};
  var mine = null; try { mine = JSON.parse(localStorage.getItem('refill-card') || 'null'); } catch (e) { /* private mode */ }
  var join = $('.js-rc-join'), view = $('.js-rc-card');

  function show(c) {
    join.hidden = true; view.hidden = false;
    $('.js-rc-free').textContent = c.free ? c.free + (c.free > 1 ? ' drinks' : ' drink') : '—';
    $('.js-rc-strip').src = '/wallet/art/card-' + Math.min(c.have, 5) + '@2x.png';
    $('.js-rc-strip').alt = c.have + ' of ' + c.of + ' stamps';
    $('.js-rc-stamps').textContent = c.have + ' of ' + c.of;
    $('.js-rc-name').textContent = c.name;
    $('.js-rc-next').textContent = c.free ? 'Your next drink is on us. Show this card at the bar.' : (c.of - c.have) + ' more ' + (c.of - c.have === 1 ? 'drink' : 'drinks') + ' to a free one.';
    $('.js-rc-code').textContent = c.code;
    if (window.qrcode) { var q = window.qrcode(0, 'M'); q.addData('RFC:' + c.code); q.make(); $('.js-rc-qr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 0, scalable: true }); }
    var w = $('.js-rc-wallet');
    if (c.wallet && mine) { w.hidden = false; w.href = '/wallet/card.pkpass?id=' + encodeURIComponent(mine.id) + '&t=' + encodeURIComponent(mine.token); }
  }
  function load() {
    fetch('/api/card?id=' + encodeURIComponent(mine.id) + '&t=' + encodeURIComponent(mine.token), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('gone'); return r.json(); }).then(show)
      .catch(function () { mine = null; join.hidden = false; view.hidden = true; });
  }
  if (mine) load(); else join.hidden = false;
  join.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = join.querySelector('button'); b.disabled = true;
    fetch('/api/card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: join.name.value.trim() }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Try again.'); return j; }); })
      .then(function (c) { mine = { id: c.id, token: c.token }; try { localStorage.setItem('refill-card', JSON.stringify(mine)); } catch (x) { /* */ } show(c); })
      .catch(function (x) { $('.js-rc-err').textContent = x.message; b.disabled = false; });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && mine) load(); });
})();

/* REFILL — the rating page behind the table QR signs. Posts to /api/rate. */
(function () {
  'use strict';
  var R = window.R, $ = R.$, $$ = R.$$, cfg = R.cfg;
  var table = (new URLSearchParams(location.search).get('table') || '').replace(/\D/g, '').slice(0, 3);
  if (table) $('.js-table-label').textContent = 'Table ' + (table.length < 2 ? '0' + table : table) + ' · How was your visit?';
  var LINES = ['', 'Sorry about that. Tell us what went wrong and we will fix it.', 'Not quite there. What would have made it better?', 'Halfway full. We can do better.', 'A good day. We will take it.', 'Fully refilled. That is the whole point.'];
  var score = 0, cups = $$('.cup'), send = $('.js-send');
  cups.forEach(function (c) {
    c.addEventListener('click', function () {
      score = +c.getAttribute('data-score');
      cups.forEach(function (x) { var s = +x.getAttribute('data-score'); x.setAttribute('aria-checked', String(s === score)); x.classList.toggle('is-under', s < score); });
      $('.js-answer').textContent = LINES[score]; send.disabled = false;
    });
  });
  $('.js-rate').addEventListener('submit', function (e) {
    e.preventDefault(); if (!score) return; send.disabled = true; send.textContent = 'Sending';
    fetch('/api/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: score, table: table, note: $('.js-note').value }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
      .catch(function () { send.disabled = false; send.textContent = 'Try again'; });
  });
  function done() {
    $('.js-rate').hidden = true; $('.js-thanks').hidden = false;
    if (score >= 4 && cfg.googleReview) { var a = $('.js-review'); a.href = cfg.googleReview; a.hidden = false; }
  }
})();

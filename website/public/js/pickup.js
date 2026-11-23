/* REFILL — the customer's order status after paying. Polls /api/order every few seconds. */
(function () {
  'use strict';
  var $ = window.R.$, root = $('.js-pk'); if (!root) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var id = new URLSearchParams(location.search).get('id') || '', token = '';
  try { token = (JSON.parse(localStorage.getItem('refill-orders') || '{}'))[id] || ''; } catch (e) { /* private mode */ }
  var tries = 0, timer = null, last = '';

  function set(title, lede, kicker) { $('.js-pk-title').textContent = title; $('.js-pk-lede').textContent = lede; if (kicker) $('.js-pk-kicker').textContent = kicker; }
  function actions(html) { $('.js-pk-actions').innerHTML = html; }
  var when = function (o) {
    if (o.table) return 'We will bring it to table ' + (o.table.length < 2 ? '0' + o.table : o.table) + '.';
    return o.pickup === 'asap' ? 'Pick it up at the bar as soon as it is ready.' : 'Pick it up at the bar in about ' + (o.pickup === '60' ? 'an hour' : o.pickup + ' minutes') + '.';
  };

  if (!id || !token) {
    root.setAttribute('data-state', 'unknown');
    set('Order not found here', 'Open this page on the phone you ordered with. If you paid, show your Kashier receipt at the bar and we will sort it out.');
    actions('<a class="btn" href="/menu">Back to the menu</a>');
    return;
  }

  function paint(o) {
    var key = o.status + o.no;
    root.setAttribute('data-state', o.status);
    $('.js-pk-items').innerHTML = o.items.map(function (l) { return '<li><span>' + l.qty + ' × ' + esc(l.label) + '</span><span>' + (l.unit * l.qty) + ' ' + o.currency + '</span></li>'; }).join('') +
      '<li class="pk__total"><span>Total</span><span>' + o.total + ' ' + o.currency + '</span></li>';
    if (o.status === 'pending') {
      set('Waiting for the payment', 'This usually takes a few seconds. Keep this page open.', 'Your order');
      return;
    }
    if (o.status === 'failed') {
      set('The payment did not go through', 'Nothing was charged. Your bag is still saved, so you can try again.', 'Your order');
      actions('<a class="btn" href="/menu">Try again</a>');
      return;
    }
    if (o.status === 'refunded') { set('This order was refunded', 'If that is a surprise, ask us at the bar.'); return; }
    try { localStorage.removeItem('refill-cart'); } catch (e) { /* private mode */ }
    $('.js-pk-no').hidden = false; $('.js-pk-num').textContent = '#' + o.no;
    $('.js-pk-steps').hidden = false;
    var stage = o.status === 'paid' ? 1 : 2;
    [].forEach.call($('.js-pk-steps').children, function (li, i) { li.classList.toggle('is-done', i <= stage); li.classList.toggle('is-now', i === stage); });
    if (o.status === 'paid') set('Thank you, ' + o.name + '.', 'Paid. We are making it now. ' + when(o), o.mode === 'test' ? 'Test order · no real money' : 'Order confirmed');
    else if (o.status === 'ready') set('It\'s ready!', o.table ? 'On its way to your table.' : 'Come to the bar and say order #' + o.no + '.', 'Ready');
    else set('Enjoy it, ' + o.name + '.', 'Collected. See you for the next refill.', 'Done');
    $('.js-pk-meta').textContent = o.mode === 'test' ? 'This was a test payment.' : '';
    actions('<a class="btn btn--ghost" href="/menu">Order something else</a>');
    if (key !== last && last && o.status === 'ready' && navigator.vibrate) navigator.vibrate([120, 60, 120]);
    last = key;
  }
  function poll() {
    fetch('/api/order?id=' + encodeURIComponent(id) + '&t=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(function (o) {
        paint(o); tries++;
        var wait = o.status === 'pending' ? (tries < 20 ? 2500 : 8000) : o.status === 'collected' || o.status === 'failed' ? 0 : 6000;
        if (wait) timer = setTimeout(poll, wait);
      })
      .catch(function () {
        root.setAttribute('data-state', 'unknown');
        set('Order not found here', 'Open this page on the phone you ordered with, or show your Kashier receipt at the bar.');
        actions('<a class="btn" href="/menu">Back to the menu</a>');
      });
  }
  poll();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { clearTimeout(timer); poll(); } });
})();

/* Apply the trip's single booking list to the calendar, programme, map and tasks. */
(function () {
  'use strict';
  var config = window.tripBookings;
  var source = document.getElementById('rk-data');
  if (!config || !source) return;
  var data = JSON.parse(source.textContent);
  var format = new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'short', timeZone: 'Pacific/Auckland'
  });
  function stamp(value) { return format.format(new Date(value + 'T12:00:00+13:00')).replace(/\./g, ''); }
  function badge(parent) {
    if (!parent || parent.querySelector('.booking-status')) return;
    var el = document.createElement('span');
    el.className = 'tag k booking-status';
    el.textContent = 'Booket';
    parent.appendChild(document.createTextNode(' '));
    parent.appendChild(el);
  }
  function markCard(card, description) {
    var title = card.querySelector('h3');
    if (title && !card.querySelector('.booking-status')) {
      var tags = document.createElement('div'); tags.className = 'tags';
      title.insertAdjacentElement('afterend', tags); badge(tags);
    }
    var facts = card.querySelector('.spot-facts');
    if (facts) {
      var booking;
      [].slice.call(facts.querySelectorAll('dt')).forEach(function (dt) {
        if (dt.textContent.trim() === 'Booking') booking = dt.parentElement;
      });
      [].slice.call(facts.querySelectorAll('dt')).forEach(function (dt) {
        if (dt.textContent.trim() !== 'Ledighed') return;
        if (booking) dt.parentElement.remove();
        else { booking = dt.parentElement; dt.textContent = 'Booking'; }
      });
      if (!booking) {
        booking = document.createElement('div'); booking.className = 'wide';
        var term = document.createElement('dt'); term.textContent = 'Booking';
        booking.appendChild(term); booking.appendChild(document.createElement('dd')); facts.appendChild(booking);
      }
      booking.querySelector('dd').textContent = description;
    }
    [].slice.call(card.querySelectorAll('a')).forEach(function (a) {
      if (/^Book(?:\b|$)/.test(a.textContent.trim())) a.textContent = 'Booking og oplysninger';
    });
    card.setAttribute('data-booked', 'true');
  }
  Object.keys(config).forEach(function (anchor) {
    var record = config[anchor], base = data.bases[record.base];
    var card = document.getElementById(anchor);
    if (!base || !card || !(record.until > record.from)) throw new Error('Ugyldig booking: ' + anchor);
    var nights = Math.round((Date.parse(record.until) - Date.parse(record.from)) / 86400000);
    var description = 'Booket · ' + stamp(record.from) + '–' + stamp(record.until) + ' · ' + nights + (nights === 1 ? ' nat' : ' nætter');
    if (record.total != null) description += ' · NZ$' + record.total + ' i alt' + (record.adults ? ' for ' + record.adults + ' voksne' : '');
    markCard(card, description);
    var fragment = document.createElement('div'); fragment.innerHTML = base.html;
    markCard(fragment, description); base.html = fragment.innerHTML;
    base.booking = { from: record.from, until: record.until, nights: nights };
    if (record.total != null) base.booking.total = record.total;
    [].slice.call(document.querySelectorAll('[data-calendar-day]')).forEach(function (link) {
      var time = link.querySelector('time'), date = time && time.getAttribute('datetime');
      if (!date || date < record.from || date >= record.until) return;
      var day = data.locationPlan.days.find(function (d) { return d.date === date; });
      if (!day || day.stay.name !== base.name) return;
      badge(link.querySelector('.calendar-sleep'));
      var aria = link.getAttribute('aria-label') || '';
      if (aria.indexOf(' · Booket') < 0) link.setAttribute('aria-label', aria + ' · Booket');
      day.stay.booked = true;
      var programme = document.getElementById(link.getAttribute('data-calendar-day'));
      if (!programme) return;
      [].slice.call(programme.querySelectorAll('.keys > li')).forEach(function (li) {
        var b = li.querySelector('b'), val = li.querySelector('.val');
        if (!b || !val) return;
        if (b.textContent.trim() === 'Sov') {
          [].slice.call(val.childNodes).forEach(function (node) {
            if (node.nodeType === 3) node.textContent = node.textContent.replace(/\.?\s*Bookes hos pladsen\s*/g, ' ');
          });
          badge(val);
          [].slice.call(val.querySelectorAll('a.pin')).forEach(function (a) {
            if (/^Book/.test(a.textContent.trim())) a.textContent = 'Booking';
          });
        }
        if (b.textContent.trim() === 'Husk' && /^Book\b/.test(val.textContent.trim())) {
          var first = val.firstChild;
          if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^Book\b/, 'Booket:');
        }
      });
    });
    var task = [].slice.call(document.querySelectorAll('.todo input')).find(function (el) { return el.dataset.k === record.task; });
    if (task) {
      task.dataset.confirmed = 'true'; task.checked = true; task.disabled = true;
      var text = task.parentElement.querySelector('span');
      if (text) text.textContent = 'Booket: ' + base.name + ' · ' + stamp(record.from) + '–' + stamp(record.until);
    }
  });
  source.textContent = JSON.stringify(data);
})();

/* Lyserøde forslag: sjove ting, der ikke er vandring, som kan vælges til undervejs.
   Gule punkter er forslag, hvor et gavekort eller en kredit kan bruges (feltet vouchers).
   Data ligger i turens egen fil (window.tripIdeas og window.tripIdeaNotes).
   Kortet henter punkterne med TripIdeas.spots(); programmet får en liste under hver dag. */
(function (root) {
  'use strict';
  var ideas = root.tripIdeas || [];
  var notes = root.tripIdeaNotes || {};
  var icons = {
    kayak: 'surf', surf: 'surf', boat: 'ferry', raft_jet: 'ferry', fishing: 'ferry',
    hot_pool: 'hot', wild_swim: 'swim', wildlife: 'paw', horse: 'paw', glowworm: 'cave', cave: 'cave',
    bike: 'bike', scenic_flight: 'airport', gondola: 'vista', food_drink: 'food', brewery_winery: 'drink',
    culture: 'city', museum: 'city', craft_workshop: 'city', rainy_day: 'city'
  };
  function safe(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fact(label, value) {
    return value ? '<div class="wide"><dt>' + label + '</dt><dd>' + safe(value) + '</dd></div>' : '';
  }
  function link(text, url) {
    var outside = !/^(#|tel:)/.test(url);
    return '<a class="pin" href="' + safe(url) + '"' + (outside ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + safe(text) + '</a>';
  }
  function price(x) {
    return x.price === 0 ? 'Gratis' : x.price == null ? 'Pris ukendt' : '$' + x.price + ' pr. person';
  }
  // Samme kort bruges i kortets ark og under dagen i programmet.
  function card(x, inProgramme) {
    var pay = x.vouchers || [];
    var tags = pay.map(function (v) { return '<span class="tag voucher">' + safe(v.kind) + ' · tjek prisen</span>'; }).join('') +
      '<span class="tag idea">Forslag</span>' + (x.top ? '<span class="tag k">Bedste bud</span>' : '') +
      '<span class="tag">' + price(x) + '</span>' + (x.walk ? '<span class="tag">Til fods fra pladsen</span>' : '') +
      (x.conf === 'low' ? '<span class="tag">Ikke bekræftet</span>' : '');
    var source = x.priceSource === 'third_party' ? ' Prisen er ikke fra udbyderens egen side, så ring og få den bekræftet.' : '';
    var links = pay.map(function (v) { return v.url ? link(v.kind, v.url) : ''; }).join('') +
      (x.links || []).map(function (l) { return link(l[0], l[1]); }).join('') +
      (x.phone ? link('Ring', 'tel:' + x.phone.replace(/[^+\d]/g, '')) : '') +
      link('Google Maps', 'https://www.google.com/maps/search/?api=1&query=' + x.ll[0] + ',' + x.ll[1]) +
      (inProgramme ? '' : link('Se i programmet', '#idea-' + x.id));
    return '<span class="rk-sub">' + (pay.length ? 'Gult forslag · kan betales med gavekort eller kredit' : 'Lyserødt forslag') + ' · ' + safe(x.area) + '</span><h3 class="spot-name">' + safe(x.name) + '</h3>' +
      '<div class="tags">' + tags + '</div><dl class="spot-facts">' +
      fact('Hvornår', x.when) + pay.map(function (v) { return fact(safe(v.kind), v.text); }).join('') +
      fact('Pris', (x.priceText || price(x)) + (x.bookme ? ' · ' + x.bookme : '')) +
      fact('Udbyder', x.maker) +
      fact('Varighed', x.duration) + fact('Omvej', x.detour ? 'ca. ' + x.detour + ' min hver vej fra ruten' : '') +
      fact('Åbent', x.open) + fact('Booking', x.booking) + fact('Vejr', x.weather) + fact('Tidevand', x.tide) + '</dl>' +
      (x.sum ? '<p class="spot-sum">' + safe(x.sum) + '</p>' : '') + (x.note ? '<p class="note">' + safe(x.note) + '</p>' : '') +
      '<p class="note">Tjekket ' + safe(x.checked) + '.' + source + ' Intet er booket.</p><div class="links">' + links + '</div>';
  }
  root.TripIdeas = {
    hasVoucher: ideas.some(function (x) { return (x.vouchers || []).length > 0; }),
    spots: function () {
      return ideas.map(function (x) {
        // Gul = Helenas gavekort eller kredit kan bruges her.
        return { ll: x.ll, name: x.name, st: (x.vouchers || []).length ? 'idea voucher' : 'idea', activity: icons[x.cat] || 'star', html: '<div class="rk-body">' + card(x) + '</div>' };
      });
    }
  };
  if (!root.document) return;
  var placed = {};
  function block(list, date, title, note) {
    var box = document.createElement('details');
    box.className = 'day-reference day-ideas';
    box.innerHTML = '<summary>' + title + '</summary>' + (note ? '<p class="note">' + safe(note) + '</p>' : '') + '<div class="spots">' +
      list.map(function (x) {
        var first = !placed[x.id];
        placed[x.id] = true;
        return '<article class="spot"' + (first ? ' id="idea-' + safe(x.id) + '"' : '') + '><div class="spot-body">' +
          card(Object.assign({}, x, { top: date ? x.top === date : x.top }), true) + '</div></article>';
      }).join('') + '</div>';
    return box;
  }
  // Under hver dag i programmet: dagens forslag, det bedste bud først.
  [].slice.call(document.querySelectorAll('[data-calendar-day]')).forEach(function (cell) {
    var time = cell.querySelector('time'), date = time && time.getAttribute('datetime');
    var day = document.getElementById(cell.getAttribute('data-calendar-day'));
    var list = ideas.filter(function (x) { return (x.dates || []).indexOf(date) >= 0; });
    if (!day || !list.length) return;
    list.sort(function (a, b) { return (b.top === date) - (a.top === date); });
    day.appendChild(block(list, date, 'Lyserøde forslag · ' + list.length + ' sjove ting uden vandring', notes[date]));
    var mark = document.createElement('span');
    mark.className = 'calendar-ideas';
    mark.textContent = list.length + ' forslag';
    cell.appendChild(mark);
  });
  // Forslag efter sidste kalenderdag, fx fra Auckland, står i fanen Efter.
  var later = ideas.filter(function (x) { return !placed[x.id]; });
  var after = document.getElementById('efter');
  if (later.length && after) after.appendChild(block(later, null, 'Lyserøde forslag efter ankomsten · ' + later.length, notes.after));
})(typeof globalThis !== 'undefined' ? globalThis : this);

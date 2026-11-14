/* A small travel story on top of the existing map. No account or tracking service. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var paths = {
    camp: '<path d="m3 19 9-15 9 15H3Zm9-15v15m-4 0 4-7 4 7"/>',
    hike: '<path d="m3 19 6-11 4 7 3-5 5 9H3ZM8 10l2 2m6 0 2 2"/><circle cx="17" cy="5" r="2"/>',
    surf: '<path d="M3 17c3 3 5 3 8 0s5-3 10 0M3 21c3 2 5 2 8 0s5-2 10 0M5 12c8-1 8-10 14-9-2 2-3 5-2 7 1 2 3 2 4 2"/>',
    food: '<path d="M3 17h18L18 8H6L3 17Zm2 0v4h14v-4M7 7l1-3m4 3V3m5 4-1-3M7 12h.1m5 0h.1m5 0h.1"/>',
    cave: '<path d="m2 20 5-15 6-2 6 7 3 10H2Zm6 0 2-9h4l3 9M8 5l2 3m8 2-3 2"/>',
    waterfall: '<path d="M3 4h8v10m3-10h7M8 4v10m7-10v10M3 19c3-3 5-3 9 0s6 3 9 0M5 23c4-2 8-2 13 0"/>',
    vista: '<path d="m3 17 3-9h4l1 9m2 0 1-9h4l3 9M10 11h4M7 8V4m10 4V4"/><circle cx="7" cy="17" r="4"/><circle cx="17" cy="17" r="4"/>',
    airport: '<path d="m12 2 2 7 8 5v3l-8-2-1 5 3 2H8l3-2-1-5-8 2v-3l8-5 2-7Z"/>',
    city: '<path d="M3 21V9h6V3h8v10h4v8H3Zm6 0V9m8 12v-8M5 12h1m-1 4h1m6-10h2m-2 4h2m-2 4h2m-2 4h2"/>',
    ferry: '<path d="m2 14 4 6h13l3-6H2Zm4 0V7h12v7M9 7V3h6v4M2 23c3-2 6-2 10 0s7 2 10 0"/>',
    walk: '<path d="M7 21c-5-3-3-6 2-8s6-5 1-8M14 21c-2-3 0-5 4-7s4-4 1-7"/>',
    check: '<path d="m5 12 5 5L20 6"/>'
  };
  function icon(activity) {
    var kind = /surf/.test(activity) ? 'surf' : /beach|swim|kayak/.test(activity) ? 'surf' : paths[activity] ? activity : 'walk';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[kind] + '</svg>';
  }
  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function time(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
  function stamp(date, minutes) { return new Date(date + 'T' + time(minutes) + ':00+13:00'); }
  function indexFor(days, date) {
    var index = days.findIndex(function (day) { return day.date === date; });
    return index >= 0 ? index : date < days[0].date ? 0 : days.length - 1;
  }
  function latest(updates, date) {
    return (updates || []).filter(function (entry) { return entry.date <= date; }).sort(function (a, b) { return b.date.localeCompare(a.date); })[0] || null;
  }
  function build(data, articles) {
    return data.locationPlan.days.map(function (day, index) {
      var article = articles[index] || {}, stay = (data.bases || []).find(function (base) { return base.name === day.stay.name; });
      var stops = (article.anchors || []).map(function (anchor) { return data.spots.find(function (spot) { return spot.anchor === anchor; }); })
        .filter(function (spot) { return spot && !/^(out|maybe|after)$/.test(spot.st); });
      var alternatives = (data.bases || []).filter(function (base) { return base.optional && (article.anchors || []).indexOf(base.anchor) >= 0; });
      var candidates = stops.concat(stay ? [stay] : []), picture = null;
      candidates.some(function (item) {
        var match = item.html && item.html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/);
        if (match) { picture = match[0]; return true; }
        return false;
      });
      return {date: day.date, title: article.title || day.stay.name, overview: article.overview || '', stay: stay,
        stops: stops, alternatives: alternatives, picture: picture, segments: day.segments, uncertain: !!day.uncertain};
    });
  }
  function mount(options) {
    var data = options.data, map = options.map, box = options.box, L = options.L;
    if (!data.locationPlan || !window.TripPosition) return null;
    var dates = new Intl.DateTimeFormat('da-DK', {weekday:'long', day:'numeric', month:'long', timeZone:'Pacific/Auckland'});
    var shortDate = new Intl.DateTimeFormat('da-DK', {day:'numeric', month:'short', timeZone:'Pacific/Auckland'});
    var articles = [].slice.call(document.querySelectorAll('[data-calendar-day]')).map(function (link) {
      var article = document.getElementById(link.getAttribute('data-calendar-day'));
      return {title: article.querySelector('.day-title').textContent, overview: (article.querySelector('.day-overview') || {}).textContent || '',
        anchor: article.id, anchors: [].slice.call(article.querySelectorAll('article.spot[id]')).map(function (spot) { return spot.id; })};
    });
    var days = build(data, articles), active = false, playing = false, timer = null, follow = true, index = 0, minute = 720, previewState = null;
    var route = L.layerGroup(), returnFocus = null, frame = null;
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'rk-btn rk-story-launch'; button.innerHTML = icon('walk') + '<span>Rejs med</span>';
    button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'rk-story');
    options.toolbar.appendChild(button);
    var panel = document.createElement('section');
    panel.id = 'rk-story'; panel.className = 'rk-story'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Rejs med Karsten og Helena');
    panel.innerHTML = '<header class="rk-story-header"><div><b>Karsten & Helena</b><span>Rejs med gennem New Zealand</span></div><button type="button" class="rk-story-close" aria-label="Luk Rejs med">×</button></header>' +
      '<div class="rk-story-dates" role="group" aria-label="Vælg en dag på turen"></div><div class="rk-story-scroll"><div class="rk-story-chapter"></div>' +
      '<div class="rk-story-playback"><div class="rk-story-clock"><span>Rejseplan · anslået</span><output></output></div><label class="rk-story-slider-label">Tidspunkt i New Zealand<input type="range" min="420" max="1320" step="5" aria-label="Tidspunkt i New Zealand"></label>' +
      '<div class="rk-story-scale"><span>07:00</span><span>15:00</span><span>22:00</span></div><div class="rk-story-controls"><button type="button" data-s="previous" aria-label="Forrige rejsedag">‹</button><button type="button" data-s="play">Afspil dagen</button><button type="button" data-s="next" aria-label="Næste rejsedag">›</button></div>' +
      '<div class="rk-story-secondary"><button type="button" data-s="overview">Vis etapen</button><button type="button" data-s="follow" aria-pressed="true">Følg figuren</button><button type="button" data-s="now">Tilbage til nu</button></div></div>' +
      '<div class="rk-story-stops"></div><div class="rk-story-update"></div><p class="rk-story-honest">Afspilningen følger rejseplanen. Positioner, tider og aktiviteter er anslået.</p></div>';
    box.appendChild(panel); L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
    // Keep the clock and playback controls reachable while the journal scrolls.
    panel.appendChild(panel.querySelector('.rk-story-playback'));
    var strip = panel.querySelector('.rk-story-dates'), chapter = panel.querySelector('.rk-story-chapter');
    var input = panel.querySelector('input'), output = panel.querySelector('output'), play = panel.querySelector('[data-s="play"]');
    output.setAttribute('aria-live', 'off');
    var next = panel.querySelector('[data-s="next"]'), previous = panel.querySelector('[data-s="previous"]');
    var followButton = panel.querySelector('[data-s="follow"]');
    days.forEach(function (day, i) {
      var item = document.createElement('button'); item.type = 'button'; item.dataset.index = i;
      item.textContent = shortDate.format(stamp(day.date, 720)).replace(/\./g, '');
      item.setAttribute('aria-label', 'Vis ' + dates.format(stamp(day.date, 720)));
      item.addEventListener('click', function () { select(i, 720); }); strip.appendChild(item);
    });
    function pause() {
      if (timer) clearInterval(timer); timer = null; playing = false;
      play.textContent = 'Afspil dagen'; play.setAttribute('aria-pressed', 'false'); box.classList.remove('rk-story-playing');
    }
    function setFollow(on) { follow = !!on; followButton.setAttribute('aria-pressed', String(follow)); }
    function focus(ll) {
      var point = map.project(ll, map.getZoom());
      if (window.innerWidth >= 720) point.x += panel.offsetWidth / 2;
      else point.y += Math.max(0, panel.offsetHeight / 2 - 50);
      map.panTo(map.unproject(point, map.getZoom()), {animate:false});
    }
    function renderTime(center) {
      if (!active) return;
      input.value = minute; input.setAttribute('aria-valuetext', time(minute) + ' i New Zealand'); output.textContent = time(minute);
      var state = options.preview(stamp(days[index].date, minute));
      previewState = state;
      if (center && follow && state) focus(state.ll);
    }
    function fitDay() {
      var points = [], seen = {};
      days[index].segments.forEach(function (segment) {
        if (segment.leg != null && !seen['leg' + segment.leg]) { points = points.concat(data.legs[segment.leg].pts); seen['leg' + segment.leg] = true; }
        if (segment.point) points.push(segment.point);
        if (segment.ferry != null) points = points.concat(data.ferries[segment.ferry].pts);
      });
      if (days[index].stay) points.push(days[index].stay.ll);
      if (!points.length) return;
      route.clearLayers();
      Object.keys(seen).forEach(function (key) {
        var pts = data.legs[Number(key.slice(3))].pts;
        L.polyline(pts, {className:'rk-story-route-halo', weight:12, interactive:false}).addTo(route);
        L.polyline(pts, {className:'rk-story-route', weight:5, interactive:false}).addTo(route);
      });
      route.addTo(map);
      if (follow && previewState) {
        map.stop(); map.setView(previewState.ll, 10, {animate:false}); focus(previewState.ll); return;
      }
      var sidebar = window.innerWidth >= 720;
      map.fitBounds(points, {paddingTopLeft:[24,150], paddingBottomRight: sidebar ? [panel.offsetWidth + 36,30] : [24,panel.offsetHeight + 24], maxZoom:12, animate:!options.reducedMotion.matches});
    }
    function openPlace(item) { close(false); options.open(item.html, item.ll); }
    function renderStops() {
      var target = panel.querySelector('.rk-story-stops'); target.innerHTML = '';
      var heading = document.createElement('h4'); heading.textContent = 'Dagens stop'; target.appendChild(heading);
      var day = days[index], items = day.stops.concat(day.stay ? [day.stay] : [], day.alternatives);
      items.forEach(function (item) {
        var stay = item === day.stay, control = document.createElement('button');
        control.type = 'button'; control.className = 'rk-story-stop' + (stay ? ' rk-story-stop--camp' : '');
        control.innerHTML = '<span class="rk-story-stop-icon">' + icon(stay || item.optional ? 'camp' : item.activity) + '</span><span><b>' + escape(item.name) + '</b><small>' + (item.optional ? 'Måske · alternativ overnatning · ikke booket' : stay ? (item.booking ? 'Her sover I · booket' : 'Her sover I ifølge planen') : 'Se stedet på kortet') + '</small></span>';
        if (stay && stamp(day.date, 720) < new Date(data.helenaFlight.arrival)) control.querySelector('small').textContent = item.booking ? 'Karstens overnatning · booket' : 'Karstens overnatning';
        control.addEventListener('click', function () { openPlace(item); }); target.appendChild(control);
      });
      var link = document.createElement('a'); link.href = '#' + articles[index].anchor; link.textContent = 'Åbn hele dagsprogrammet'; link.className = 'rk-story-program'; target.appendChild(link);
    }
    function renderUpdate() {
      var latestEntry = latest(window.tripUpdates, window.TripPosition.clock(new Date()).date);
      var area = panel.querySelector('.rk-story-update'); area.hidden = !latestEntry;
      if (!latestEntry) return;
      var place = latestEntry.anchor ? data.bases.find(function (base) { return base.anchor === latestEntry.anchor; }) : null;
      area.innerHTML = '<span class="rk-story-confirmed">' + icon('check') + ' Senest bekræftet · ' + escape(shortDate.format(stamp(latestEntry.date, 720))) + '</span><b>' + escape(latestEntry.place) + '</b><p>' + escape(latestEntry.text) + '</p>';
      if (place) {
        var control = document.createElement('button'); control.type = 'button'; control.textContent = 'Vis stedet';
        control.addEventListener('click', function () { openPlace(place); }); area.appendChild(control);
      }
    }
    function select(value, at) {
      pause(); index = Math.max(0, Math.min(days.length - 1, value)); minute = Math.max(420, Math.min(1320, Math.round(at / 5) * 5));
      var day = days[index];
      strip.querySelectorAll('button').forEach(function (item, i) { item.setAttribute('aria-pressed', String(i === index)); });
      var selected = strip.children[index]; strip.scrollLeft = selected.offsetLeft - strip.clientWidth / 2 + selected.offsetWidth / 2;
      chapter.innerHTML = '<div class="rk-story-day"><span>' + escape(dates.format(stamp(day.date, 720))) + '</span><span>Dag ' + (index + 1) + ' af ' + days.length + '</span></div><h3>' + escape(day.title) + '</h3>' +
        (day.picture ? '<div class="rk-story-picture">' + day.picture + '</div>' : '') + '<p>' + escape(day.overview || 'En dag på turen gennem New Zealand.') + '</p>';
      previous.disabled = index === 0; next.disabled = index === days.length - 1;
      renderStops(); renderUpdate(); panel.querySelector('.rk-story-scroll').scrollTop = 0;
      setFollow(true); renderTime(false); requestAnimationFrame(function () { if (active) fitDay(); });
    }
    function show() {
      if (active) { close(); return; }
      options.closeSheet(); options.setQuiet(false); active = true; returnFocus = document.activeElement;
      box.classList.add('rk-story-open'); panel.hidden = false; button.setAttribute('aria-expanded', 'true');
      var now = window.TripPosition.clock(new Date()); select(indexFor(days, now.date), now.minutes);
      panel.querySelector('.rk-story-close').focus({preventScroll:true});
    }
    function close(center) {
      if (!active) return;
      pause(); if (frame) cancelAnimationFrame(frame); frame = null; active = false; route.remove(); panel.hidden = true;
      box.classList.remove('rk-story-open'); button.setAttribute('aria-expanded', 'false'); options.restore(center !== false);
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({preventScroll:true});
    }
    button.addEventListener('click', show);
    panel.querySelector('.rk-story-close').addEventListener('click', function () { close(); });
    panel.querySelector('[data-s="now"]').addEventListener('click', function () { close(); });
    panel.querySelector('[data-s="follow"]').addEventListener('click', function () { setFollow(!follow); if (follow) renderTime(true); });
    panel.querySelector('[data-s="overview"]').addEventListener('click', function () { setFollow(false); map.stop(); fitDay(); });
    previous.addEventListener('click', function () { select(index - 1, 720); });
    next.addEventListener('click', function () { select(index + 1, 720); });
    input.addEventListener('input', function () {
      pause(); minute = Number(input.value);
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = null; renderTime(true); });
    });
    play.addEventListener('click', function () {
      if (playing) { pause(); return; }
      if (options.reducedMotion.matches) { play.textContent = 'Brug tidsskyderen'; return; }
      minute = 420; playing = true; setFollow(true); map.stop(); renderTime(true);
      play.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); box.classList.add('rk-story-playing');
      timer = setInterval(function () {
        minute = Math.min(1320, minute + 15); renderTime(true);
        if (minute === 1320) pause();
      }, 800);
    });
    map.on('dragstart', function () { if (active) setFollow(false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    options.reducedMotion.addEventListener('change', function () { if (options.reducedMotion.matches) pause(); });
    window.addEventListener('pagehide', pause);
    window.addEventListener('resize', function () { requestAnimationFrame(function () { if (active) renderTime(true); }); });
    window.addEventListener('hashchange', function () { if (location.hash !== '#kort') close(false); });
    return {close:close, isOpen:function () { return active; }, pause:pause};
  }
  return {icon:icon, time:time, stamp:stamp, indexFor:indexFor, latest:latest, build:build, mount:mount};
});

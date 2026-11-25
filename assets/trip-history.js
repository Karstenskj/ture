/* Optional historical routes. These never enter the current trip's position plan. */
(function (root) {
  'use strict';
  function mount(options) {
    var trips = (options.trips || []).filter(function (trip) { return trip.pts && trip.pts.length > 1; });
    if (!trips.length) return null;
    var map = options.map, L = options.L, doc = options.document || root.document;
    var pane = map.createPane('rk-history-pane');
    pane.style.zIndex = '390';
    var layer = L.featureGroup(), points = [];
    trips.forEach(function (trip) {
      points = points.concat(trip.pts);
      layer.addLayer(L.polyline(trip.pts, {pane: 'rk-history-pane', className: 'rk-history-case', weight: 9, interactive: false}));
      layer.addLayer(L.polyline(trip.pts, {pane: 'rk-history-pane', className: 'rk-history-line', weight: 5, dashArray: '14 7', interactive: false}));
      var hit = L.polyline(trip.pts, {pane: 'rk-history-pane', weight: 24, opacity: 0, bubblingMouseEvents: false});
      hit.on('click', function () { options.open(trip.html); });
      layer.addLayer(hit);
    });
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'rk-btn rk-history-toggle';
    button.setAttribute('data-a', 'history');
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Vis tidligere ture i New Zealand';
    button.textContent = 'SHOW old trips';
    options.controls.appendChild(button);
    var summary = doc.createElement('button');
    summary.type = 'button';
    summary.className = 'rk-history-summary';
    summary.hidden = true;
    summary.textContent = trips.length + ' tidligere NZ-ture · genskabt fra planer';
    summary.setAttribute('aria-label', 'Se oplysninger og kilder til tidligere NZ-ture');
    map.getContainer().appendChild(summary);
    L.DomEvent.disableClickPropagation(summary);
    summary.addEventListener('click', function () {
      options.open('<div class="rk-body"><h3>Tidligere ture i New Zealand</h3><p>Grå linjer er genskabt fra dine gemte rejseplaner. De viser hovedruter mellem stederne, ikke registrerede GPS-spor eller bekræftede besøg ved hvert stop.</p></div>' + trips.map(function (trip) { return trip.html; }).join(''));
    });
    var visible = false, previousView = null;
    function setVisible(show) {
      show = !!show;
      if (show === visible) return;
      if (show) {
        var center = map.getCenter();
        previousView = {center: [center.lat, center.lng], zoom: map.getZoom()};
      }
      if (options.close) options.close();
      visible = show;
      button.setAttribute('aria-pressed', String(show));
      button.textContent = show ? 'HIDE old trips' : 'SHOW old trips';
      summary.hidden = !show;
      options.box.classList.toggle('rk-history-visible', show);
      if (show) {
        layer.addTo(map);
        map.fitBounds(L.latLngBounds(points), {padding: [44, 100], maxZoom: 8, animate: false});
      } else {
        map.removeLayer(layer);
        if (previousView) map.setView(previousView.center, previousView.zoom, {animate: false});
      }
    }
    button.addEventListener('click', function () { setVisible(!visible); });
    return {setVisible: setVisible, button: button, summary: summary, layer: layer};
  }
  var api = {mount: mount};
  root.TripHistory = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

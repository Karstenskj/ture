/* ==========================================================================
   Ture — rigtigt kort med ruten, bygget på Leaflet og OpenStreetMap.

   Sådan bruges den på en turside:

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
     <div class="rk" id="rk"><div class="rk-map" id="rk-map"></div></div>
     <script type="application/json" id="rk-data">{ ... }</script>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
     <script src="../assets/rutekort.js"></script>

   Data (alt html er bygget og escapet på forhånd):
     legs:    [{pts: [[lat, lon], ...], label: "4 t 26", mid: [lat, lon], html}]   køredage, fuld linje
     extras:  [{pts, html}]                                                       det der ikke er med, stiplet
     after:   [{pts, html, maybe}]                                                efter turen, stiplet orange, grøn med maybe
     ferries: [{pts, html}]                                                       færger, stiplet grå
     bases:   [{ll: [lat, lon], label: "tir 17 nov", name, html}]                  hvor I sover
     spots:   [{ll, n, name, left, k: egen ønske, st: out/after/maybe, html}]     nummererede steder, navnet fra zoom 8
     legend:  "<span>…</span>"                                                    forklaringen på farverne i bunden af kortet

   Et tryk åbner et kort nedefra med alt om stedet, som i en kortapp.
   Knapperne giver fuld skærm og "her er vi". Gør ingenting uden data eller Leaflet.
   ========================================================================== */

(function () {
  var box = document.getElementById('rk');
  var src = document.getElementById('rk-data');
  if (!box || !src || !window.L) return;
  var D = JSON.parse(src.textContent);
  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  var mobile = window.matchMedia('(max-width: 719px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // I kortfanen og fuld skærm kan kortet flyttes med én finger.
  var map = L.map('rk-map', { zoomControl: false, dragging: !touch, tap: false });
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom ind', zoomOutTitle: 'Zoom ud' }).addTo(map);

  var osm = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  var layers = {
    'Kort': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: osm }),
    'Terræn': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: osm + ', <a href="https://opentopomap.org">OpenTopoMap</a> (CC BY-SA)' }),
    'Satellit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' })
  };
  layers['Kort'].addTo(map);
  L.control.layers(layers, null, { position: 'topright' }).addTo(map);

  // arket nedefra
  var sheet = document.createElement('div');
  sheet.className = 'rk-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Detaljer om stedet');
  sheet.innerHTML = '<div class="rk-sheet-bar"><button type="button" class="rk-expand" aria-expanded="false">Udvid detaljer</button><button type="button" class="rk-close" aria-label="Luk stedets detaljer">&times;</button></div><div class="rk-in"></div>';
  box.appendChild(sheet);
  var inner = sheet.querySelector('.rk-in');
  L.DomEvent.disableClickPropagation(sheet);
  L.DomEvent.disableScrollPropagation(sheet);

  var lastTrigger = null;
  var selectedPoint = null;
  var expand = sheet.querySelector('.rk-expand');
  function positionPoint() {
    if (!selectedPoint || sheet.hidden) return;
    map.panTo(selectedPoint, { animate: false });
    map.panBy(window.innerWidth >= 720 ? [sheet.offsetWidth / 2, 0] : [0, sheet.offsetHeight / 2], { animate: !reducedMotion.matches });
  }
  function open(html, ll) {
    lastTrigger = document.activeElement;
    selectedPoint = ll || null;
    inner.innerHTML = html;
    sheet.hidden = false;
    sheet.classList.remove('expanded');
    expand.setAttribute('aria-expanded', 'false');
    expand.textContent = 'Udvid detaljer';
    sheet.scrollTop = 0;
    box.classList.add('rk-sheet-open');
    box.classList.remove('rk-legend-open');
    if (legendBtn) legendBtn.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(function () {
      if (sheet.hidden) return;
      sheet.classList.add('open');
      positionPoint();
      sheet.querySelector('.rk-close').focus({ preventScroll: true });
    });
  }
  function close() {
    if (sheet.hidden) return;
    sheet.classList.remove('open', 'expanded');
    sheet.hidden = true;
    box.classList.remove('rk-sheet-open');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    selectedPoint = null;
    lastTrigger = null;
  }
  expand.addEventListener('click', function () {
    var expanded = sheet.classList.toggle('expanded');
    expand.setAttribute('aria-expanded', String(expanded));
    expand.textContent = expanded ? 'Vis mere af kortet' : 'Udvid detaljer';
    positionPoint();
  });
  sheet.querySelector('.rk-close').addEventListener('click', close);
  map.on('click', close);

  function tap(layer, html, ll) {
    layer.on('click', function (e) { L.DomEvent.stopPropagation(e); open(html, ll || e.latlng); });
    return layer;
  }

  function icon(cls, text) {
    return L.divIcon({ className: cls.indexOf('rk-pin') === 0 ? 'rk-spot-marker' : cls === 'rk-night' ? 'rk-camp-marker' : '', iconSize: null, html: '<div class="' + cls + '">' + text + '</div>' });
  }

  var all = [];
  var spotLabels = [];
  (D.extras || []).forEach(function (x) {
    L.polyline(x.pts, { className: 'rk-case', weight: 7, dashArray: '8 8', interactive: false }).addTo(map);
    tap(L.polyline(x.pts, { className: 'rk-extra', weight: 4, dashArray: '8 8', bubblingMouseEvents: false }).addTo(map), x.html);
  });
  (D.after || []).forEach(function (x) {
    L.polyline(x.pts, { className: 'rk-case', weight: 7, dashArray: '8 8', interactive: false }).addTo(map);
    tap(L.polyline(x.pts, { className: x.maybe ? 'rk-maybe' : 'rk-after', weight: 4, dashArray: '8 8', bubblingMouseEvents: false }).addTo(map), x.html);
  });
  (D.ferries || []).forEach(function (x) {
    tap(L.polyline(x.pts, { className: 'rk-ferry', weight: 3, dashArray: '6 8', bubblingMouseEvents: false }).addTo(map), x.html);
  });

  var times = L.layerGroup();
  (D.legs || []).forEach(function (x) {
    // bred usynlig linje under, så den er nem at ramme med en finger
    tap(L.polyline(x.pts, { weight: 22, opacity: 0, bubblingMouseEvents: false }).addTo(map), x.html);
    // mørk kant under en lys linje, så ruten ses på både kort, terræn og satellit
    L.polyline(x.pts, { className: 'rk-case', weight: 9, interactive: false }).addTo(map);
    L.polyline(x.pts, { className: 'rk-leg', weight: 5, interactive: false }).addTo(map);
    all = all.concat(x.pts);
    if (x.label) tap(L.marker(x.mid, { icon: icon('rk-time', x.label), keyboard: false }), x.html, x.mid).addTo(times);
  });
  // Mobil viser færre etiketter i overblikket; campingnavne har førsteprioritet.
  function showTimes() {
    if (map.getZoom() >= (mobile.matches ? 8 : 7)) times.addTo(map); else times.remove();
    box.classList.toggle('rk-names', map.getZoom() >= (mobile.matches ? 10 : 8));
    box.classList.toggle('rk-camp-names', map.getZoom() >= 8);
    box.classList.toggle('rk-mobile-overview', mobile.matches && map.getZoom() < 7);
    layoutLabels();
  }
  map.on('zoomend', showTimes);

  (D.spots || []).forEach(function (x) {
    var cls = 'rk-pin' + (x.k ? ' k' : '') + (x.st ? ' ' + x.st : '');
    var m = tap(L.marker(x.ll, { icon: icon(cls, x.st === 'out' ? '' : (x.n || '')), title: x.name || String(x.n), zIndexOffset: 100 }).addTo(map), x.html, x.ll);
    if (x.name) {
      m.bindTooltip(x.name, { permanent: true, direction: x.left ? 'left' : 'right', offset: [x.left ? -10 : 10, 0], opacity: 1, className: 'rk-label' });
      spotLabels.push({ marker: m, data: x });
    }
  });
  (D.bases || []).forEach(function (x) {
    var m = tap(L.marker(x.ll, { icon: icon('rk-night', x.label), title: x.name || x.label, zIndexOffset: 200 }).addTo(map), x.html, x.ll);
    if (x.name) {
      function showName() {
        var el = m.getElement();
        if (!el) return;
        var badge = el.querySelector('.rk-night');
        var offset = badge ? badge.offsetWidth / 2 + 6 : 32;
        m.bindTooltip(x.name, { permanent: true, direction: 'right', offset: [offset, 0], opacity: 1, className: 'rk-label rk-camp-label' });
      }
      m.on('add', showName);
      showName();
    }
  });

  // Ved nærliggende campingpladser lægges stednavnet på modsatte side på mobil.
  function layoutLabels() {
    spotLabels.forEach(function (entry) {
      var point = map.latLngToContainerPoint(entry.data.ll);
      var nearCamp = mobile.matches && (D.bases || []).some(function (camp) {
        return point.distanceTo(map.latLngToContainerPoint(camp.ll)) < 70;
      });
      var left = nearCamp || entry.data.left;
      var tooltip = entry.marker.getTooltip();
      tooltip.options.direction = left ? 'left' : 'right';
      tooltip.options.offset = L.point(left ? -18 : 10, 0);
      tooltip.update();
    });
  }

  // forklaringen på farverne står i bunden, under kortet
  if (D.legend) {
    var legend = document.createElement('div');
    legend.className = 'rk-legend';
    legend.id = 'rk-legend';
    legend.innerHTML = D.legend;
    box.appendChild(legend);
  }

  // kortet kan ligge i en skjult fane; tilpas og zoom ind på ruten, når det bliver synligt
  var fitted = false;
  function fit() {
    syncDragging();
    map.invalidateSize({ pan: false });
    if (!fitted && box.offsetWidth) { map.fitBounds(all.length ? all : [[-47.3, 166.4], [-34.4, 178.6]], { padding: [16, 16] }); fitted = true; }
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
  fit();
  showTimes();

  // CSS-baseret fuld skærm virker også i Safari på iPhone.
  var topbar = document.createElement('div');
  topbar.className = 'rk-topbar';
  topbar.innerHTML = '<button type="button" class="rk-btn" data-a="full" aria-pressed="false">Fuld skærm</button>' +
    (document.getElementById('program') ? '<a class="rk-btn rk-program" href="#program">Program</a>' : '');
  var btns = document.createElement('div');
  btns.className = 'rk-btns';
  btns.innerHTML = '<button type="button" class="rk-btn" data-a="route">Vis ruten</button><button type="button" class="rk-btn" data-a="me">Find os</button>' +
    (D.legend ? '<button type="button" class="rk-btn" data-a="legend" aria-expanded="false" aria-controls="rk-legend">Forklaring</button>' : '');
  map.getContainer().appendChild(topbar);
  map.getContainer().appendChild(btns);
  [btns, topbar].forEach(function (element) { L.DomEvent.disableClickPropagation(element); });
  var fullBtn = topbar.querySelector('[data-a="full"]');
  var savedScroll = 0;
  function syncDragging() {
    if (!touch || box.classList.contains('full') || (box.closest('#kort') && !box.closest('#kort').hidden)) map.dragging.enable();
    else map.dragging.disable();
  }
  function setFull(on) {
    if (on === box.classList.contains('full')) return;
    if (on) savedScroll = window.scrollY;
    box.classList.toggle('full', on);
    document.body.classList.toggle('rk-lock', on);
    document.body.style.top = on ? -savedScroll + 'px' : '';
    fullBtn.textContent = on ? 'Luk fuld skærm' : 'Fuld skærm';
    fullBtn.setAttribute('aria-pressed', String(on));
    syncDragging();
    if (!on) window.scrollTo(0, savedScroll);
    requestAnimationFrame(function () { map.invalidateSize({ pan: false }); });
  }
  fullBtn.addEventListener('click', function () { setFull(!box.classList.contains('full')); });
  btns.querySelector('[data-a="route"]').addEventListener('click', function () {
    close();
    map.fitBounds(all.length ? all : [[-47.3, 166.4], [-34.4, 178.6]], { padding: mobile.matches ? [36, 72] : [28, 48], animate: !reducedMotion.matches });
  });
  var legendBtn = btns.querySelector('[data-a="legend"]');
  if (legendBtn) legendBtn.addEventListener('click', function () {
    var on = box.classList.toggle('rk-legend-open');
    legendBtn.setAttribute('aria-expanded', String(on));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!sheet.hidden) close();
      else if (box.classList.contains('full')) setFull(false);
    }
  });
  window.addEventListener('hashchange', function () {
    var target = document.getElementById(location.hash.slice(1));
    if (target && !box.contains(target) && target.id !== 'kort') {
      close();
      setFull(false);
    }
  });
  window.addEventListener('resize', function () { showTimes(); map.invalidateSize({ pan: false }); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { map.invalidateSize({ pan: false }); });
  mobile.addEventListener('change', function () { showTimes(); syncDragging(); });

  var me = null;
  var locateBtn = btns.querySelector('[data-a="me"]');
  function locateDone() { locateBtn.disabled = false; locateBtn.textContent = 'Find os'; }
  locateBtn.addEventListener('click', function () {
    locateBtn.disabled = true;
    locateBtn.textContent = 'Finder…';
    map.locate({ setView: true, maxZoom: 12, timeout: 12000, enableHighAccuracy: true });
  });
  map.on('locationfound', function (e) {
    locateDone();
    if (me) me.remove();
    me = L.marker(e.latlng, { icon: icon('rk-me', ''), keyboard: false, interactive: false, zIndexOffset: 300 }).addTo(map);
  });
  map.on('locationerror', function (e) {
    locateDone();
    var message = e.code === 1 ? 'Tillad placering for siden i browseren, og prøv igen.' : 'Placeringen er ikke tilgængelig lige nu. Kontrollér GPS og forbindelse, og prøv igen.';
    open('<div class="rk-body"><h3>Kunne ikke finde jer</h3><p class="spot-sum">' + message + '</p></div>');
  });
})();

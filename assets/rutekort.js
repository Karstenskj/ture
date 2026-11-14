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
     after:   [{pts, html, maybe}]                                                efter turen, stiplet orange
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
  var phoneView = window.matchMedia('(max-width: 719px), (max-width: 960px) and (max-height: 500px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var smoothZooming = false;
  var worldReady = false;
  var quietMap = false, phoneMapWasVisible = false;

  // I kortfanen og fuld skærm kan kortet flyttes med én finger.
  var map = L.map('rk-map', {
    zoomControl: false, dragging: !touch, tap: false,
    minZoom: 3,
    zoomSnap: 0, zoomDelta: 0.5,
    wheelPxPerZoomLevel: 90, wheelDebounceTime: 20,
    zoomAnimation: !reducedMotion.matches,
    fadeAnimation: !reducedMotion.matches,
    markerZoomAnimation: !reducedMotion.matches
  });
  map.getContainer().setAttribute('role','region');
  var rememberedView = null, resizingMap = false, knownSize = null;
  map.on('moveend', function () {
    if (resizingMap || map.getZoom() == null) return;
    var center = map.getCenter();
    rememberedView = {center:L.latLng(center.lat,center.lng),zoom:map.getZoom()};
  });
  function resizeMap() {
    var element = map.getContainer(), width = element.clientWidth, height = element.clientHeight;
    if (!width || !height) return;
    var actualSize = map.getSize();
    if (knownSize && knownSize[0] === width && knownSize[1] === height && actualSize.x === width && actualSize.y === height) return;
    knownSize = [width,height];
    var view = rememberedView;
    resizingMap = true;
    map.invalidateSize({pan:false,animate:false});
    if (view) map.setView(view.center,view.zoom,{animate:false});
    resizingMap = false;
  }
  function setQuiet(on) {
    quietMap = !!on && phoneView.matches;
    box.classList.toggle('rk-quiet',quietMap);
    map.getContainer().setAttribute('aria-label',phoneView.matches ? (quietMap ? 'Kort over turen. Tryk for at vise menu, knapper og nøgletal.' : 'Kort over turen. Tryk på et frit sted for at skjule menu, knapper og nøgletal.') : 'Kort over turen med rute, overnatninger og steder.');
  }
  function syncPhoneView() {
    var phone = phoneView.matches, pane = box.closest('#kort');
    var visible = !pane || !pane.hidden;
    box.classList.toggle('rk-phone',phone);
    document.body.classList.toggle('rk-phone-view',phone);
    if (phone && visible) {
      setFull(true);
      if (!phoneMapWasVisible) setQuiet(true);
    } else setQuiet(false);
    phoneMapWasVisible = phone && visible;
    resizeMap();
  }
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom ind', zoomOutTitle: 'Zoom ud' }).addTo(map);
  // Follow the wheel continuously instead of starting a new stepped zoom for
  // every wheel burst. Pinch, keyboard and +/- keep Leaflet's native controls.
  map.scrollWheelZoom.disable();
  var wheelFrame = null, wheelTarget = null, wheelPoint = null, wheelStamp = 0;
  var wheelGestureZoom = null, lastWheelInput = 0;
  map.getContainer().addEventListener('wheel', function (event) {
    if (map.getZoom() == null) return;
    event.preventDefault();
    var inputTime = performance.now();
    if (wheelGestureZoom == null || inputTime-lastWheelInput > 180) wheelGestureZoom = map.getZoom();
    lastWheelInput = inputTime;
    var delta = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? map.getSize().y : 1);
    if (!wheelFrame) wheelTarget = map.getZoom();
    wheelTarget = Math.max(map.getMinZoom(),wheelGestureZoom-3,Math.min(map.getMaxZoom(),wheelGestureZoom+3,wheelTarget-delta/180));
    wheelPoint = L.DomEvent.getMousePosition(event, map.getContainer());
    if (reducedMotion.matches) {map.setZoomAround(wheelPoint,wheelTarget,{animate:false});return;}
    if (wheelFrame) return;
    smoothZooming = true;
    wheelStamp = performance.now();
    function frame(stamp) {
      var difference = wheelTarget - map.getZoom();
      var amount = 1 - Math.exp(-Math.min(40,stamp-wheelStamp)/45);
      wheelStamp = stamp;
      if (Math.abs(difference) < .002 || document.hidden) {
        map.setZoomAround(wheelPoint,wheelTarget,{animate:false});
        wheelFrame = null; smoothZooming = false;
        showTimes(); refreshWorld(); showAnimals();
        return;
      }
      map.setZoomAround(wheelPoint,map.getZoom()+difference*amount,{animate:false});
      wheelFrame = requestAnimationFrame(frame);
    }
    wheelFrame = requestAnimationFrame(frame);
  }, {passive:false});

  var osm = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  var layers = {
    'Kort': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: osm }),
    'Terræn': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: osm + ', <a href="https://opentopomap.org">OpenTopoMap</a> (CC BY-SA)' }),
    'Satellit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' })
  };
  layers['Satellit'].addTo(map);
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
    setQuiet(false);
    lastTrigger = document.activeElement;
    selectedPoint = ll || null;
    inner.innerHTML = html;
    if (window.TripForecast) window.TripForecast.mount();
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
    if (atmosphere) refreshWorld();
  }
  function close() {
    if (sheet.hidden) return;
    sheet.classList.remove('open', 'expanded');
    sheet.hidden = true;
    box.classList.remove('rk-sheet-open');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    selectedPoint = null;
    lastTrigger = null;
    if (atmosphere) refreshWorld();
  }
  expand.addEventListener('click', function () {
    var expanded = sheet.classList.toggle('expanded');
    expand.setAttribute('aria-expanded', String(expanded));
    expand.textContent = expanded ? 'Vis mere af kortet' : 'Udvid detaljer';
    positionPoint();
  });
  sheet.querySelector('.rk-close').addEventListener('click', close);
  map.on('click', function (event) {
    var target = event.originalEvent && event.originalEvent.target;
    if (target && target.closest && target.closest('.rk-world-hud')) return;
    if (!sheet.hidden) {close();return;}
    if (phoneView.matches) setQuiet(!quietMap);
  });
  map.getContainer().addEventListener('keydown', function (event) {
    if (phoneView.matches && event.target === map.getContainer() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();setQuiet(!quietMap);
    }
  });

  function tap(layer, html, ll) {
    layer.on('click', function (e) { L.DomEvent.stopPropagation(e); open(html, ll || e.latlng); });
    return layer;
  }

  function icon(cls, text, activity) {
    var symbol = activity && window.TripIcons ? window.TripIcons.icon(activity) : '';
    return L.divIcon({ className: cls.indexOf('rk-pin') === 0 ? 'rk-spot-marker' + (symbol ? ' rk-symbol-marker' : '') : cls.indexOf('rk-night') === 0 ? 'rk-camp-marker' : '',
      iconSize: symbol || cls.indexOf('rk-night') === 0 ? [30,30] : null, iconAnchor: symbol || cls.indexOf('rk-night') === 0 ? [15,15] : null,
      html: '<div class="' + cls + '">' + (symbol ? '<span class="rk-pin-number">' + text + '</span>' + symbol : text) + '</div>' });
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
    if (smoothZooming) return;
    if (map.getZoom() == null) return;
    if (map.getZoom() >= (mobile.matches ? 8 : 7)) times.addTo(map); else times.remove();
    box.classList.toggle('rk-names', map.getZoom() >= (mobile.matches ? 10 : 8));
    box.classList.toggle('rk-camp-names', map.getZoom() >= 8);
    box.classList.toggle('rk-overview', map.getZoom() < 7);
    box.classList.toggle('rk-mobile-overview', mobile.matches && map.getZoom() < 7);
    layoutLabels();
  }
  map.on('zoomend', showTimes);

  (D.spots || []).forEach(function (x) {
    var cls = 'rk-pin' + (x.k ? ' k' : '') + (x.st ? ' ' + x.st : '');
    var normalIcon = icon(cls, x.st === 'out' ? '' : (x.n || ''), x.activity);
    var m = tap(L.marker(x.ll, { icon: normalIcon, title: x.name || String(x.n), zIndexOffset: 100 }).addTo(map), x.html, x.ll);
    if (x.name) {
      m.bindTooltip(x.name, { permanent: true, direction: x.left ? 'left' : 'right', offset: [x.left ? -10 : 10, 0], opacity: 1, className: 'rk-label' });
      var imageMatch = x.html && x.html.match(/<img[^>]+src="([^"]+)"/);
      spotLabels.push({ marker: m, data: x, normalIcon: normalIcon, photo: imageMatch && imageMatch[1], showingPhoto: false });
    }
  });
  (D.bases || []).forEach(function (x) {
    var campLabel = (window.TripIcons ? window.TripIcons.icon('camp') : '') + safe(x.label) + (x.booking ? '<span class="rk-booked-mark" aria-hidden="true">✓</span>' : '');
    var m = tap(L.marker(x.ll, { icon: icon('rk-night' + (x.optional ? ' rk-night--optional' : ''), campLabel), title: x.name || x.label, zIndexOffset: x.optional ? 80 : 200 }).addTo(map), x.html, x.ll);
    if (x.optional && m.getElement()) m.getElement().setAttribute('aria-label', 'Måske · ' + x.name);
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
    updatePhotos();
  }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function updatePhotos() {
    if (smoothZooming) return;
    if (map.getZoom() == null) return;
    var occupied = [];
    spotLabels.forEach(function (entry) {
      var point = map.latLngToContainerPoint(entry.data.ll);
      var show = !!entry.photo && map.getZoom() >= 9 && map.getBounds().contains(entry.data.ll) &&
        !occupied.some(function (other) { return point.distanceTo(other) < 70; });
      if (show) occupied.push(point);
      if (show === entry.showingPhoto) return;
      entry.showingPhoto = show;
      entry.marker.setIcon(show ? L.divIcon({ className: 'rk-photo-marker', iconSize: [58,48], iconAnchor: [29,24],
        html: '<span class="rk-photo ' + safe(entry.data.st || '') + '"><img src="' + safe(entry.photo) + '" alt="" decoding="async"><b>' + safe(entry.data.n || '') + '</b></span>' }) : entry.normalIcon);
    });
  }
  map.on('moveend', updatePhotos);

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
    resizeMap();
    var pane = box.closest('#kort');
    if (!fitted && (!pane || !pane.hidden) && box.offsetWidth && box.offsetHeight && document.readyState !== 'loading') { map.fitBounds(all.length ? all : [[-47.3, 166.4], [-34.4, 178.6]], { padding: [16, 16], animate: false }); fitted = true; showTimes(); }
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(map.getContainer());
  document.addEventListener('DOMContentLoaded', fit, { once: true });
  // Vent til fanens endelige layout er på plads, før hele ruten indrammes.
  requestAnimationFrame(function () { fit(); showTimes(); });

  // CSS-baseret fuld skærm virker også i Safari på iPhone.
  var topbar = document.createElement('div');
  topbar.className = 'rk-topbar';
  topbar.innerHTML = '<button type="button" class="rk-btn rk-menu" data-a="menu" aria-haspopup="dialog">Menu</button><button type="button" class="rk-btn" data-a="full" aria-pressed="false">Fuld skærm</button>' +
    (document.getElementById('program') ? '<a class="rk-btn rk-program" href="#program">Program</a>' : '');
  var btns = document.createElement('div');
  btns.className = 'rk-btns';
  btns.innerHTML = '<button type="button" class="rk-btn" data-a="route">Vis ruten</button><button type="button" class="rk-btn" data-a="me">Find os</button>' +
    (D.legend ? '<button type="button" class="rk-btn" data-a="legend" aria-expanded="false" aria-controls="rk-legend">Forklaring</button>' : '');
  map.getContainer().appendChild(topbar);
  map.getContainer().appendChild(btns);
  var metrics = document.createElement('div');
  metrics.className = 'rk-map-metrics';
  metrics.setAttribute('role','group');
  metrics.setAttribute('aria-label','Turens nøgletal');
  metrics.innerHTML = [].slice.call(document.querySelectorAll('.trip-overview .fact')).map(function (fact) {
    return '<span><b>' + safe(fact.querySelector('dd').textContent) + '</b> ' + safe(fact.querySelector('dt').textContent.toLowerCase()) + '</span>';
  }).join('');
  map.getContainer().appendChild(metrics);
  L.DomEvent.disableClickPropagation(metrics);
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
    requestAnimationFrame(resizeMap);
  }
  fullBtn.addEventListener('click', function () { setFull(!box.classList.contains('full')); });
  topbar.querySelector('[data-a="menu"]').addEventListener('click', function () {
    var links = [].slice.call(document.querySelectorAll('.tabs a')).filter(function (link) {return link.getAttribute('href') !== '#kort';});
    open('<div class="rk-body"><h3>Turmenu</h3><nav class="rk-menu-links" aria-label="Turens sider">' + links.map(function (link) {return '<a href="' + safe(link.getAttribute('href')) + '">' + safe(link.textContent) + '</a>';}).join('') + '</nav></div>');
  });
  btns.querySelector('[data-a="route"]').addEventListener('click', function () {
    close();
    resizeMap();
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
      else if (phoneView.matches && !quietMap) setQuiet(true);
      else if (box.classList.contains('full')) setFull(false);
    }
  });
  window.addEventListener('hashchange', function () {
    var target = document.getElementById(location.hash.slice(1));
    if (target && !box.contains(target) && target.id !== 'kort') {
      close();
      setFull(false);
      phoneMapWasVisible = false;
    }
    requestAnimationFrame(syncPhoneView);
  });
  window.addEventListener('resize', function () { resizeMap();showTimes();syncPhoneView(); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeMap);
  mobile.addEventListener('change', function () { showTimes(); syncDragging(); });
  phoneView.addEventListener('change',syncPhoneView);

  var me = null, helenaMarker = null, flightPath = null;
  var position = window.TripPosition, scenes = window.TripScenes;
  var gps = null, gpsReason = 'Placering hentes', current = null, helena = null;
  var atmosphere = null;
  var centerOnFix = false, worldTimer = null, focusedTraveller = 'karsten';
  var vehicleIcon = L.icon({ iconUrl: '../assets/honda-accord-tourer-cw2.svg', iconSize: [42,80], iconAnchor: [21,40], className: 'rk-vehicle-marker' });
  var locateBtn = btns.querySelector('[data-a="me"]');
  var hud = document.createElement('div');
  hud.className = 'rk-world-hud';
  hud.innerHTML = '<div class="rk-travellers"><button type="button" class="rk-traveller" data-person="karsten"><span class="rk-portrait"><img src="../assets/trip-world/characters-base.webp" alt=""></span><span><b>Karsten</b><small></small></span></button><button type="button" class="rk-traveller" data-person="helena"><span class="rk-portrait rk-portrait--helena"><img src="../assets/trip-world/characters-base.webp" alt=""></span><span><b>Helena</b><small></small></span></button></div><button type="button" class="rk-position-status" title="Om positionen og aktiviteten"></button>';
  map.getContainer().appendChild(hud);
  L.DomEvent.disableClickPropagation(hud);
  L.DomEvent.disableScrollPropagation(hud);
  var karstenChip = hud.querySelector('[data-person="karsten"]');
  var helenaChip = hud.querySelector('[data-person="helena"]');
  var status = hud.querySelector('.rk-position-status');
  var flightButton = document.createElement('button');
  flightButton.type = 'button';flightButton.className = 'rk-flight-route rk-position-status';
  flightButton.textContent = 'Flyrute · Brisbane → Christchurch · 17 nov';
  flightButton.title = 'Planlagt flyrute. Ankomst 18.10 i NZ; afgang og flyets position er anslået.';
  flightButton.hidden = true;hud.appendChild(flightButton);
  flightButton.addEventListener('click',function () {
    if (!flightPath) return;
    close();focusedTraveller = 'helena';
    karstenChip.setAttribute('aria-pressed','false');helenaChip.setAttribute('aria-pressed','true');
    var size = map.getSize();
    map.fitBounds(flightPath.getBounds(),{paddingTopLeft:[105,Math.min(280,size.y*.34)],paddingBottomRight:[110,Math.min(150,size.y*.18)],animate:!reducedMotion.matches});refreshWorld();
  });
  if (!position || !scenes || !D.locationPlan) hud.hidden = true;
  function sceneIcon(scene, sourceLabel) {
    return L.divIcon({ className: 'rk-world-marker', html: scene.html + (sourceLabel ? '<span class="rk-location-tag">' + safe(sourceLabel) + '</span>' : ''), iconSize: scene.size, iconAnchor: scene.anchor });
  }
  function makeMarker(marker, ll, markerIcon, key, title) {
    if (!marker) marker = L.marker(ll, { icon: markerIcon, alt: title, title: title, keyboard: false, interactive: false, zIndexOffset: 1100 }).addTo(map);
    else { marker.setLatLng(ll); if (marker._worldKey !== key) marker.setIcon(markerIcon); }
    marker._worldKey = key;
    var element = marker.getElement();
    if (element) {element.setAttribute('title',title);element.setAttribute('aria-label',title);}
    return marker;
  }
  function focusPerson(person) {
    focusedTraveller = person;
    var target = person === 'helena' && helena && helena.phase !== 'joined' ? helena : current;
    if (!target) return;
    close();
    map.stop();
    var nearKaikoura = position && D.bases[19] && position.distance(target.ll,D.bases[19].ll) < 15000;
    map.setView(target.ll, target.phase === 'flight' ? 5 : nearKaikoura ? 11.5 : 12, { animate: !reducedMotion.matches });
    karstenChip.setAttribute('aria-pressed', String(person === 'karsten'));
    helenaChip.setAttribute('aria-pressed', String(person === 'helena'));
    updatePositionStatus();
    if (atmosphere) refreshWorld();
  }
  function updatePositionStatus() {
    if (!current) return;
    if (focusedTraveller === 'helena' && helena && helena.phase !== 'joined') {
      status.dataset.source = 'plan';
      status.textContent = helena.phase === 'flight' ? 'Helenas flyrejse · anslået position' : 'Helena · Brisbane · aktiviteter illustreret';
      status.title = helena.phase === 'flight' ? D.helenaFlight.note : 'Helenas dag i Brisbane illustreres efter lokal tid.';
      return;
    }
    status.dataset.source = current.source;
    status.textContent = current.source === 'gps' ? 'GPS på denne enhed · aktiviteter illustreret' : 'Ca. position · ' + current.name;
    status.title = current.source === 'gps' ? current.note : gpsReason + '. ' + current.note;
  }
  function describeCurrent() {
    if (!current || !scenes) return;
    var target = focusedTraveller === 'helena' && helena && helena.phase !== 'joined' ? helena : current;
    var isHelena = target === helena;
    var scene = target.phase === 'flight' ? scenes.flight() : scenes.render(target.scene, { solo: !isHelena && current.solo, helena: isHelena, coastal: target.coastal });
    var heading = isHelena ? target.name : (current.solo ? 'Karsten' : 'Karsten & Helena') + ' · ' + current.name;
    var source = isHelena ? (target.phase === 'flight' || target.phase === 'airport' ? D.helenaFlight.note : 'Brisbane CBD. Dagens aktiviteter og lejligheden er illustrationer efter lokal tid, ikke live oplysninger.') : current.note;
    var time = isHelena && target.localTime ? target.localTime + ' i Brisbane' : String(current.clock.minutes / 60 | 0).padStart(2, '0') + ':' + String(current.clock.minutes % 60).padStart(2, '0') + ' i New Zealand';
    open('<div class="rk-body"><div class="rk-world-detail" data-weather-person="' + (isHelena ? 'helena' : 'karsten') + '">' + scene.html + '</div><h3>' + safe(heading) + '</h3><p class="spot-sum">' + safe(scene.label) + ' · ' + safe(time) + '</p><p>' + safe(source) + '</p><p class="note">' + (isHelena ? 'Ankomst til Christchurch tir 17 nov kl. 18.10. Flyets afgang og position er anslået.' : current.source === 'gps' ? 'GPS fra denne enhed. Aktiviteten er en illustration ud fra sted, tidspunkt og planen. Andre besøgende ser et skøn fra rejseplanen.' : 'Ca. position fra rejseplanen. Hverdagsscenerne viser, hvad vi sandsynligvis laver, og er ikke en live opdatering.') + '</p></div>', target.ll);
  }
  karstenChip.addEventListener('click', function () { focusPerson('karsten'); });
  helenaChip.addEventListener('click', function () { focusPerson('helena'); });
  status.addEventListener('click', describeCurrent);
  var animals = L.layerGroup();
  if (scenes) [
    {type:'whale', ll:[-42.408,173.76], name:'Hvaler ved Kaikōura'},
    {type:'whale', ll:[-42.44,173.82], name:'Hvaler ved Kaikōura'},
    {type:'seal', ll:[-41.76,171.46], name:'Sæler ved Cape Foulwind'},
    {type:'kea', ll:[-42.95,171.55], name:'Kea i bjergene'},
    {type:'sheep', ll:[-43.36,171.9], name:'Får i Canterbury'},
    {type:'kiwi', ll:[-35.59,173.55], name:'Kiwi i Northland'},
    {type:'seal', ll:[-40.51,172.66], name:'Sæler ved Wharariki'}
  ].forEach(function (a) {
    var size = a.type === 'whale' ? [100,75] : [64,48];
    L.marker(a.ll, {icon:L.divIcon({className:'rk-world-marker',html:scenes.animal(a.type),iconSize:size,iconAnchor:[size[0]/2,size[1]/2]}),
      title:a.name + ' · illustration', alt:a.name + ' · illustration', interactive:false, keyboard:false, zIndexOffset:20}).addTo(animals);
  });
  function showAnimals() {
    if (smoothZooming) return;
    if (map.getZoom() >= 7) animals.addTo(map); else animals.remove();
  }
  map.on('zoomend', showAnimals);
  function refreshWorld() {
    if (smoothZooming) return;
    if (!position || !scenes || !D.locationPlan) return;
    var now = new Date();
    var validGPS = gps && +now - gps.timestamp < 120000 ? gps : null;
    current = position.state(D, now, validGPS);
    helena = position.helenaState(D, now);
    if (!current) return;
    var env = atmosphere ? atmosphere.update({at:now,current:current,helena:helena,focused:focusedTraveller,point:selectedPoint}) : {};
    var compactWorld = mobile.matches || map.getSize().y < 500;
    var opts = {solo:current.solo,coastal:current.coastal,small:compactWorld || map.getZoom() < 8};
    var scene = current.scene === 'drive' ? null : scenes.render(current.scene, opts);
    var key = current.scene + ':' + current.solo + ':' + current.coastal + ':' + opts.small + ':' + current.source;
    var car = {html:'<img class="world-car-image" src="../assets/honda-accord-tourer-cw2.svg" alt="">',size:[42,80],anchor:[21,40]};
    var sourceLabel = current.source === 'gps' ? 'GPS · denne enhed' : 'Ca. position';
    me = makeMarker(me, current.ll, sceneIcon(scene || car,sourceLabel), key, scene ? scene.label : 'Blå Honda Accord Tourer CW2 med sort hardshell-tagtelt og gult surfboard');
    if (atmosphere) atmosphere.paintActor(me.getElement(),env.primary);
    var nzTime = String(current.clock.minutes / 60 | 0).padStart(2,'0') + ':' + String(current.clock.minutes % 60).padStart(2,'0');
    karstenChip.querySelector('b').textContent = current.solo ? 'Karsten' : 'Karsten & Helena';
    karstenChip.querySelector('small').textContent = 'NZ ' + nzTime + ' · ' + (scenes.labels[current.scene] || 'på tur');
    helenaChip.hidden = helena.phase === 'joined';
    if (helena.phase !== 'joined') {
      var hscene = helena.phase === 'flight' ? scenes.flight() : scenes.render(helena.scene, {helena:true,small:compactWorld});
      helenaMarker = makeMarker(helenaMarker, helena.ll, sceneIcon(hscene,'Ca. position'), helena.scene + ':' + helena.phase + ':' + compactWorld, hscene.label);
      if (atmosphere) atmosphere.paintActor(helenaMarker.getElement(),env.secondary);
      helenaChip.querySelector('small').textContent = helena.phase === 'flight' ? 'Flyver til NZ · anslået' : helena.phase === 'airport' ? 'Brisbane lufthavn' : 'Brisbane ' + helena.localTime + ' · ' + (scenes.labels[helena.scene] || 'i byen');
      if (!flightPath && worldReady) {
        var points = [];
        for (var i=0;i<=50;i++) points.push(position.greatCircle(D.helenaFlight.from,D.helenaFlight.to,i/50));
        flightPath = L.polyline(points, {color:'#f28c28',weight:2,dashArray:'6 9',interactive:false}).addTo(map);
        flightPath.bindTooltip('Planlagt flyrute · 17 nov',{permanent:true,direction:'center',className:'rk-flight-label'});
      }
    } else {
      if (helenaMarker) {helenaMarker.remove();helenaMarker=null;}
      if (focusedTraveller === 'helena') focusedTraveller = 'karsten';
    }
    flightButton.hidden = helena.phase === 'joined';
    if (flightPath && helena.phase === 'joined') {flightPath.remove();flightPath=null;}
    if (atmosphere) {
      var worldDetail = inner.querySelector('.rk-world-detail');
      if (worldDetail) atmosphere.paintActor(worldDetail,worldDetail.dataset.weatherPerson === 'helena' ? env.secondary : env.primary);
    }
    updatePositionStatus();
    showAnimals();
  }
  function locateDone() { locateBtn.disabled = false; locateBtn.textContent = 'Find os'; }
  function startLocate(shouldCenter) {
    refreshWorld();
    if (shouldCenter !== false) focusPerson('karsten');
    centerOnFix = shouldCenter !== false;
    locateBtn.disabled = true;
    locateBtn.textContent = 'Finder…';
    gpsReason = 'Placering hentes';
    map.stopLocate();
    map.locate({watch:true,setView:false,timeout:12000,maximumAge:10000,enableHighAccuracy:true});
  }
  locateBtn.addEventListener('click', startLocate);
  map.on('locationfound', function (e) {
    locateDone();
    var ll = [e.latlng.lat,e.latlng.lng];
    gps = {ll:ll,timestamp:e.timestamp || Date.now()};
    gpsReason = position && !position.inNewZealand(ll) ? 'Enheden er uden for New Zealand' : '';
    refreshWorld();
    if (!position) me = makeMarker(me,ll,vehicleIcon,'drive','Jeres position');
    if (centerOnFix) {centerOnFix=false; if (current) focusPerson('karsten'); else map.setView(ll,14);}
  });
  map.on('locationerror', function (e) {
    locateDone();
    gps=null;
    gpsReason=e.code === 1 ? 'Lokalitet er slået fra' : 'GPS er ikke tilgængelig';
    map.stopLocate();
    refreshWorld();
  });
  map.on('zoomend', refreshWorld);
  map.on('resize', refreshWorld);
  mobile.addEventListener('change', refreshWorld);
  if (window.TripAtmosphere && position && D.locationPlan) {
    atmosphere = window.TripAtmosphere.create({map:map,box:box,hud:hud,open:open,reducedMotion:reducedMotion,onChange:refreshWorld});
  }
  function resumeWorld() {
    refreshWorld();
    if (!worldTimer) worldTimer=setInterval(refreshWorld,30000);
  }
  function startMap() {
    resumeWorld();
    syncPhoneView();
    if (location.hash && location.hash !== '#kort') return;
    setFull(true);
    fitted=false;
    requestAnimationFrame(function () {fit();startLocate();});
  }
  map.whenReady(function () {worldReady=true;refreshWorld();});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',startMap,{once:true});
  else startMap();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {clearInterval(worldTimer);worldTimer=null;map.stopLocate();}
    else {resumeWorld(); if (box.classList.contains('full') || document.body.classList.contains('on-kort')) startLocate(false);}
  });
  window.addEventListener('pagehide',function () {map.stopLocate();clearInterval(worldTimer);worldTimer=null;});
  window.addEventListener('pageshow',function (e) {if (e.persisted) {resumeWorld();startLocate(false);}});

})();

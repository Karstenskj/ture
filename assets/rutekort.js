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
     spots:   [{ll, n, name, left, k: egen ønske, st: out/after/maybe/idea, html}] nummererede steder, navnet fra zoom 8
     legend:  "<span>…</span>"                                                    forklaringen på farverne i bunden af kortet

   Et tryk åbner et kort nedefra med alt om stedet, som i en kortapp.
   Knapperne giver fuld skærm og "her er vi". Gør ingenting uden data eller Leaflet.
   ========================================================================== */

(function () {
  var box = document.getElementById('rk');
  var src = document.getElementById('rk-data');
  if (!box || !src || !window.L) { if (box) box.classList.add('rk-booted'); return; }
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
    // bredere SVG-flade, så ruten ikke klippes ved kanten midt i et træk
    renderer: L.svg({ padding: 0.5 }),
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
    // Efter en drejning af telefonen må det valgte sted ikke ende under arket.
    if (sheetOpen && selectedPoint) positionPoint(false);
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
  // Fliser hentes også mens fingeren trækker (ikke først når den slipper), og flere bliver liggende.
  function tiles(options) { return L.extend({ updateWhenIdle: false, keepBuffer: 4 }, options); }
  var layers = {
    'Kort': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', tiles({ maxZoom: 19, attribution: osm })),
    'Terræn': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', tiles({ maxZoom: 19, maxNativeZoom: 17, attribution: osm + ', <a href="https://opentopomap.org">OpenTopoMap</a> (CC BY-SA)' })),
    'Satellit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', tiles({ maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' }))
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
  var sheetOpen = false, sheetToken = 0, quietBeforeSheet = false, userTouched = false;
  var expand = sheet.querySelector('.rk-expand');
  // Flyt kun kortet, hvis stedet ellers ville ligge under arket, og så i én glidende bevægelse.
  function positionPoint(animate) {
    if (!selectedPoint || !sheetOpen || map.getZoom() == null) return;
    var size = map.getSize(), wide = window.innerWidth >= 720;
    var cover = wide ? sheet.offsetWidth + 10 : sheet.offsetHeight;
    var point = map.latLngToContainerPoint(selectedPoint);
    var minX = wide ? 40 : 30, maxX = wide ? size.x - cover - 40 : size.x - 30;
    var minY = wide ? 70 : 120, maxY = wide ? size.y - 40 : size.y - cover - 24;
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return;
    var target = wide ? L.point((size.x - cover) / 2, size.y / 2) : L.point(size.x / 2, Math.max((size.y - cover) / 2, Math.min(120, size.y - cover - 30)));
    map.stop();
    map.panBy(point.subtract(target), { animate: animate !== false && !reducedMotion.matches, duration: .35, easeLinearity: .25 });
  }
  function open(html, ll) {
    var wasOpen = sheetOpen;
    sheetToken++;
    sheetOpen = true;
    userTouched = true;
    if (!wasOpen) quietBeforeSheet = quietMap;
    setQuiet(false);
    lastTrigger = document.activeElement;
    selectedPoint = ll || null;
    inner.innerHTML = html;
    if (window.TripForecast) requestAnimationFrame(window.TripForecast.mount);
    sheet.hidden = false;
    if (!wasOpen) {
      sheet.classList.remove('expanded');
      expand.setAttribute('aria-expanded', 'false');
      expand.textContent = 'Udvid detaljer';
    }
    sheet.scrollTop = 0;
    box.classList.add('rk-sheet-open');
    box.classList.remove('rk-legend-open');
    if (legendBtn) legendBtn.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(function () {
      if (!sheetOpen) return;
      sheet.classList.add('open');
      positionPoint();
      sheet.querySelector('.rk-close').focus({ preventScroll: true });
    });
    if (atmosphere) refreshWorld();
  }
  function close() {
    if (!sheetOpen) return;
    sheetOpen = false;
    var token = ++sheetToken;
    sheet.classList.remove('open', 'expanded');
    box.classList.remove('rk-sheet-open');
    // Arket glider ned og skjules først, når bevægelsen er færdig.
    function done(event) {
      if (event && event.target !== sheet) return;
      sheet.removeEventListener('transitionend', done);
      if (token === sheetToken && !sheetOpen) sheet.hidden = true;
    }
    if (reducedMotion.matches) done();
    else { sheet.addEventListener('transitionend', done); setTimeout(done, 340); }
    if (quietBeforeSheet && phoneView.matches) setQuiet(true);
    quietBeforeSheet = false;
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
    if (sheetOpen) {close();return;}
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

  // Navnet ligger inde i markøren, så det flytter med uden en Leaflet-tooltip pr. sted.
  function icon(cls, text, activity, label) {
    var symbol = activity && window.TripIcons ? window.TripIcons.icon(activity) : '';
    var camp = cls.indexOf('rk-night') === 0;
    return L.divIcon({ className: cls.indexOf('rk-pin') === 0 ? 'rk-spot-marker' + (symbol ? ' rk-symbol-marker' : '') : camp ? 'rk-camp-marker' : cls.indexOf('rk-time') === 0 ? 'rk-time-marker' : '',
      iconSize: symbol || camp ? [30,30] : null, iconAnchor: symbol || camp ? [15,15] : null,
      html: '<div class="' + cls + '">' + (symbol ? '<span class="rk-pin-number">' + text + '</span>' + symbol : text) +
        (label ? '<span class="rk-label' + (camp ? ' rk-camp-label' : '') + '">' + safe(label) + '</span>' : '') + '</div>' });
  }

  var all = [];
  var spotLabels = [];
  // Foot tracks use the actual published track geometry, separately from roads.
  (D.walks || []).forEach(function (walk) {
    L.polyline(walk.pts, {className:'rk-case',weight:9,interactive:false}).addTo(map);
    tap(L.polyline(walk.pts, {className:'rk-leg',weight:5,dashArray:'3 7',bubblingMouseEvents:false}),walk.html).addTo(map);
  });
  (D.extras || []).forEach(function (x) {
    L.polyline(x.pts, { className: 'rk-case', weight: 7, dashArray: '8 8', interactive: false, smoothFactor: 1.5 }).addTo(map);
    tap(L.polyline(x.pts, { className: 'rk-extra', weight: 4, dashArray: '8 8', bubblingMouseEvents: false, smoothFactor: 1.5 }).addTo(map), x.html);
  });
  (D.after || []).forEach(function (x) {
    L.polyline(x.pts, { className: 'rk-case', weight: 7, dashArray: '8 8', interactive: false, smoothFactor: 1.5 }).addTo(map);
    tap(L.polyline(x.pts, { className: x.maybe ? 'rk-maybe' : 'rk-after', weight: 4, dashArray: '8 8', bubblingMouseEvents: false, smoothFactor: 1.5 }).addTo(map), x.html);
  });
  (D.ferries || []).forEach(function (x) {
    tap(L.polyline(x.pts, { className: 'rk-ferry', weight: 3, dashArray: '6 8', bubblingMouseEvents: false }).addTo(map), x.html);
  });

  var times = L.layerGroup();
  (D.legs || []).forEach(function (x) {
    // bred usynlig linje under, så den er nem at ramme med en finger
    tap(L.polyline(x.pts, { weight: 22, opacity: 0, bubblingMouseEvents: false, smoothFactor: 4 }).addTo(map), x.html);
    // mørk kant under en lys linje, så ruten ses på både kort, terræn og satellit
    L.polyline(x.pts, { className: 'rk-case', weight: 9, interactive: false, smoothFactor: 1.5 }).addTo(map);
    L.polyline(x.pts, { className: 'rk-leg', weight: 5, interactive: false, smoothFactor: 1.5 }).addTo(map);
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

  // Lyserøde forslag fra turens egen fil vises som steder med st 'idea'.
  if (window.TripIdeas) D.spots = (D.spots || []).concat(window.TripIdeas.spots());
  (D.spots || []).forEach(function (x) {
    var cls = 'rk-pin' + (x.k ? ' k' : '') + (x.st ? ' ' + x.st : '');
    var normalIcon = icon(cls, x.st === 'out' ? '' : (x.n || ''), x.activity, x.name);
    var m = tap(L.marker(x.ll, { icon: normalIcon, title: x.name || String(x.n), zIndexOffset: 100 }).addTo(map), x.html, x.ll);
    if (x.name) {
      var imageMatch = x.html && x.html.match(/<img[^>]+src="([^"]+)"/);
      // Markøren får først sit element, når kortet har en visning; siden sættes derfor ved 'add'.
      var entry = { marker: m, data: x, normalIcon: normalIcon, photo: imageMatch && imageMatch[1], showingPhoto: false, left: !!x.left };
      spotLabels.push(entry);
      m.on('add', function () { applySide(entry); });
      applySide(entry);
    }
  });
  (D.bases || []).concat(D.campOptions || []).forEach(function (x) {
    var campLabel = (window.TripIcons ? window.TripIcons.icon(x.shower === true ? 'shower' : 'camp') : '') + safe(x.label) + (x.booking ? '<span class="rk-booked-mark" aria-hidden="true">✓</span>' : '');
    var campTitle = (x.name || x.label) + (x.shower === true ? ' · Brusebad på campingpladsen' : '');
    var m = tap(L.marker(x.ll, { icon: icon('rk-night' + (x.optional ? ' rk-night--optional' : '') + (x.choice ? ' rk-night--choice' : '') + (x.shower === true ? ' rk-night--shower' : ''), campLabel, null, x.name), title: campTitle, alt: campTitle, zIndexOffset: x.choice ? 300 : x.optional ? 80 : 200 }).addTo(map), x.html, x.ll);
    if (x.optional && m.getElement()) m.getElement().setAttribute('aria-label', 'Måske · ' + campTitle);
  });

  // Badepunkter ændrer ikke ruten. Et søbad ved en camp står ved siden af natmarkøren.
  (D.bathing || []).forEach(function (x) {
    var title = x.name + (x.uncertain ? ' · Forhold/adgang skal bekræftes' : '');
    var symbol = window.TripIcons ? window.TripIcons.icon(x.type) : '';
    var badge = L.divIcon({className:'rk-bathing-marker'+(x.atCamp != null?' rk-bathing-marker--camp':''),iconSize:[28,28],iconAnchor:x.atCamp != null ? [14,-20] : [14,14],
      html:'<span class="rk-bathing rk-bathing--'+safe(x.type)+(x.uncertain?' rk-bathing--uncertain':'')+'">'+symbol+(x.uncertain?'<b class="rk-bathing-question">?</b>':'')+'<span class="rk-label">'+safe(title)+'</span></span>'});
    tap(L.marker(x.ll,{icon:badge,title:title,alt:title,zIndexOffset:260}).addTo(map),x.html,x.ll);
  });

  // Ved nærliggende campingpladser lægges stednavnet på modsatte side på mobil.
  function applySide(entry) {
    var element = entry.marker.getElement();
    if (element) element.classList.toggle('rk-label-left', !!entry.left);
  }
  function layoutLabels() {
    if (map.getZoom() == null) return;
    var camps = mobile.matches ? (D.bases || []).map(function (camp) { return map.latLngToContainerPoint(camp.ll); }) : null;
    spotLabels.forEach(function (entry) {
      var left = !!entry.data.left;
      if (camps && !left) {
        var point = map.latLngToContainerPoint(entry.data.ll);
        left = camps.some(function (camp) { var dx = point.x - camp.x, dy = point.y - camp.y; return dx * dx + dy * dy < 4900; });
      }
      if (left === entry.left) return;
      entry.left = left;
      applySide(entry);
    });
    updatePhotos();
  }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  // Fotomarkøren viser et lille miniaturebillede; mangler det, hentes det store billede.
  function photoIcon(entry) {
    if (entry.photoIcon) return entry.photoIcon;
    var full = safe(entry.photo), thumb = safe(entry.photo.replace('/2026-11-nz-rundtur/', '/2026-11-nz-rundtur/thumb/'));
    entry.photoIcon = L.divIcon({ className: 'rk-photo-marker', iconSize: [58,48], iconAnchor: [29,24],
      html: '<span class="rk-photo ' + safe(entry.data.st || '') + '"><img src="' + thumb + '"' + (thumb !== full ? ' data-full="' + full + '" onerror="this.onerror=null;this.src=this.getAttribute(\'data-full\')"' : '') + ' alt="" width="58" height="48" decoding="async" fetchpriority="low"><b>' + safe(entry.data.n || '') + '</b></span>' +
        (entry.data.name ? '<span class="rk-label">' + safe(entry.data.name) + '</span>' : '') });
    return entry.photoIcon;
  }
  var photosShown = 0;
  function updatePhotos() {
    if (smoothZooming) return;
    var zoom = map.getZoom();
    if (zoom == null || (zoom < 9 && !photosShown)) return;
    var bounds = map.getBounds(), occupied = [];
    photosShown = 0;
    spotLabels.forEach(function (entry) {
      var show = false, point = null;
      if (entry.photo && zoom >= 9 && bounds.contains(entry.data.ll)) {
        point = map.latLngToContainerPoint(entry.data.ll);
        show = !occupied.some(function (other) { return point.distanceTo(other) < 70; });
      }
      if (show) { occupied.push(point); photosShown++; }
      if (show === entry.showingPhoto) return;
      entry.showingPhoto = show;
      entry.marker.setIcon(show ? photoIcon(entry) : entry.normalIcon);
      applySide(entry);
    });
  }
  map.on('moveend', updatePhotos);
  // Under træk og zoom står scenerne og dyrene stille, så hvert billede kun flytter kortet.
  var movingTimer = null;
  map.on('movestart zoomstart', function () { clearTimeout(movingTimer); box.classList.add('rk-moving'); });
  map.on('moveend zoomend', function () { clearTimeout(movingTimer); movingTimer = setTimeout(function () { box.classList.remove('rk-moving'); }, 150); });

  // forklaringen på farverne står i bunden, under kortet
  if (D.legend) {
    var legend = document.createElement('div');
    legend.className = 'rk-legend';
    legend.id = 'rk-legend';
    legend.innerHTML = D.legend;
    if ((D.bathing || []).length && window.TripIcons) {
      legend.insertAdjacentHTML('beforeend','<span><span class="rk-bathing rk-bathing--shower">'+window.TripIcons.icon('shower')+'</span>Turkis camp · brusebad</span><span><span class="rk-bathing">'+window.TripIcons.icon('swim')+'</span>Søbad · tjek vandet</span><span><span class="rk-bathing rk-bathing--uncertain">?</span>Forhold/adgang skal bekræftes</span>');
    }
    if (window.TripIdeas && window.TripIdeas.spots().length) legend.insertAdjacentHTML('beforeend','<span><span class="rk-pin idea"></span>Lyserød · sjovt I kan vælge til</span>' +
      (window.TripIdeas.hasVoucher ? '<span><span class="rk-pin idea voucher"></span>Gul · gavekort eller Viator-kredit, tjek prisen</span>' : ''));
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
  requestAnimationFrame(function () { fit(); showTimes(); if (location.hash === '#map-stokes') showStokesRoute(); });

  // CSS-baseret fuld skærm virker også i Safari på iPhone.
  var topbar = document.createElement('div');
  topbar.className = 'rk-topbar';
  topbar.innerHTML = '<button type="button" class="rk-btn rk-menu" data-a="menu" aria-haspopup="dialog">Menu</button><button type="button" class="rk-btn" data-a="full" aria-pressed="false">Fuld skærm</button>' +
    (document.getElementById('program') ? '<a class="rk-btn rk-program" href="#program">Program</a>' : '');
  var btns = document.createElement('div');
  btns.className = 'rk-btns';
  btns.innerHTML = '<button type="button" class="rk-btn" data-a="route">Vis ruten</button><button type="button" class="rk-btn" data-a="me">Find os</button>' +
    ((D.walks || []).some(function (walk) {return walk.id === 'stokes';}) ? '<button type="button" class="rk-btn" id="map-stokes" data-a="stokes">Mount Stokes · rute</button>' : '') +
    ((D.campOptions || []).length ? '<button type="button" class="rk-btn" data-a="camp-options">Campingforslag</button>' : '') +
    (D.legend ? '<button type="button" class="rk-btn" data-a="legend" aria-expanded="false" aria-controls="rk-legend">Forklaring</button>' : '');
  map.getContainer().appendChild(topbar);
  map.getContainer().appendChild(btns);
  var stokesBtn = btns.querySelector('[data-a="stokes"]');
  function showStokesRoute() {
    var walk = (D.walks || []).filter(function (walk) {return walk.id === 'stokes';})[0];
    if (!walk) return;
    close();
    box.classList.remove('rk-camp-options-view');
    var road = (D.legs || []).filter(function (leg) {return leg.id === 'stokes-out';})[0];
    map.fitBounds(walk.pts.concat(road ? road.pts : []), {paddingTopLeft:[35,85],paddingBottomRight:[60,140],animate:!reducedMotion.matches});
  }
  if (stokesBtn) {
    stokesBtn.addEventListener('click',showStokesRoute);
    window.addEventListener('hashchange',function () {if (location.hash === '#map-stokes') showStokesRoute();});
  }
  var campOptionsBtn = btns.querySelector('[data-a="camp-options"]');
  if (campOptionsBtn) campOptionsBtn.addEventListener('click', function () {
    close();
    box.classList.add('rk-camp-options-view');
    campOptionsBtn.setAttribute('aria-pressed', 'true');
    map.fitBounds((D.campOptions || []).map(function (camp) { return camp.ll; }), {paddingTopLeft: [35, 90], paddingBottomRight: [45, 165], maxZoom: 9, animate: !reducedMotion.matches});
  });
  if (window.TripHistory) window.TripHistory.mount({
    map: map, L: L, box: box, controls: btns, trips: D.pastTrips,
    open: open, close: close
  });
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
    // Fra nu af styrer .full fuld skærm; CSS-reglen til første billede slipper.
    box.classList.add('rk-booted');
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
  // Store kameraskift flyver som i en kortapp; små skift glider; uden bevægelse springer de.
  function moveTo(ll, zoom, instant) {
    map.stop();
    if (instant || reducedMotion.matches || map.getZoom() == null) { map.setView(ll, zoom, { animate: false }); return; }
    var far = Math.abs(map.getZoom() - zoom) > 2 || !map.getBounds().pad(.5).contains(ll);
    if (far) map.flyTo(ll, zoom, { duration: .9, easeLinearity: .25 });
    else map.setView(ll, zoom, { animate: true });
  }
  function moveToBounds(bounds, options) {
    map.stop();
    if (reducedMotion.matches || map.getZoom() == null) map.fitBounds(bounds, L.extend({ animate: false }, options));
    else map.flyToBounds(bounds, L.extend({ duration: .9, easeLinearity: .25 }, options));
  }
  var routeBounds = null;
  btns.querySelector('[data-a="route"]').addEventListener('click', function () {
    box.classList.remove('rk-camp-options-view');
    if (campOptionsBtn) campOptionsBtn.setAttribute('aria-pressed', 'false');
    close();
    resizeMap();
    if (!routeBounds) routeBounds = L.latLngBounds(all.length ? all : [[-47.3, 166.4], [-34.4, 178.6]]);
    moveToBounds(routeBounds, { padding: mobile.matches ? [36, 72] : [28, 48] });
  });
  var legendBtn = btns.querySelector('[data-a="legend"]');
  if (legendBtn) legendBtn.addEventListener('click', function () {
    var on = box.classList.toggle('rk-legend-open');
    legendBtn.setAttribute('aria-expanded', String(on));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (sheetOpen) close();
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
    moveToBounds(flightPath.getBounds(),{paddingTopLeft:[105,Math.min(280,size.y*.34)],paddingBottomRight:[110,Math.min(150,size.y*.18)]});refreshWorld();
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
  function focusPerson(person, instant) {
    focusedTraveller = person;
    var target = person === 'helena' && helena && helena.phase !== 'joined' ? helena : current;
    if (!target) return;
    close();
    var nearKaikoura = position && D.bases[19] && position.distance(target.ll,D.bases[19].ll) < 15000;
    moveTo(target.ll, target.phase === 'flight' ? 5 : nearKaikoura ? 11.5 : 12, instant);
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
  function startLocate(shouldCenter, instant) {
    refreshWorld();
    if (shouldCenter !== false) focusPerson('karsten', instant);
    centerOnFix = shouldCenter !== false;
    locateBtn.disabled = true;
    locateBtn.textContent = 'Finder…';
    gpsReason = 'Placering hentes';
    map.stopLocate();
    map.locate({watch:true,setView:false,timeout:12000,maximumAge:10000,enableHighAccuracy:true});
  }
  locateBtn.addEventListener('click', function () { userTouched = false; startLocate(true); });
  // Et tryk eller træk på kortet betyder, at den besøgende selv styrer; et sent GPS-svar flytter så ikke kortet.
  map.getContainer().addEventListener('pointerdown', function () { userTouched = true; }, { passive: true });
  var lastGpsRefresh = 0;
  map.on('locationfound', function (e) {
    if (locateBtn.disabled) locateDone();
    var ll = [e.latlng.lat,e.latlng.lng];
    var previous = gps, now = Date.now();
    gps = {ll:ll,timestamp:e.timestamp || now};
    gpsReason = position && !position.inNewZealand(ll) ? 'Enheden er uden for New Zealand' : '';
    var small = previous && position && position.distance(previous.ll,ll) < 30 && now - lastGpsRefresh < 20000;
    if (!small || centerOnFix) { lastGpsRefresh = now; refreshWorld(); }
    if (!position) me = makeMarker(me,ll,vehicleIcon,'drive','Jeres position');
    if (centerOnFix) {
      centerOnFix = false;
      if (!userTouched && !sheetOpen && map.getZoom() != null && map.distance(map.getCenter(),ll) > 300) {
        if (current) focusPerson('karsten'); else moveTo(ll,14);
      }
    }
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
    if (location.hash && location.hash !== '#kort') { box.classList.add('rk-booted'); return; }
    setFull(true);
    fitted=false;
    requestAnimationFrame(function () {fit();startLocate(true,true);});
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

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
     ferries: [{pts, html}]                                                       færger, stiplet grå
     bases:   [{ll: [lat, lon], label: "17/11", html}]                            hvor I sover
     spots:   [{ll, n, k: egen ønske, out: ikke med, html}]                       nummererede steder

   Et tryk åbner et kort nedefra med alt om stedet, som i en kortapp.
   Knapperne giver fuld skærm og "her er vi". Gør ingenting uden data eller Leaflet.
   ========================================================================== */

(function () {
  var box = document.getElementById('rk');
  var src = document.getElementById('rk-data');
  if (!box || !src || !window.L) return;
  var D = JSON.parse(src.textContent);
  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // én finger skal scrolle siden, ikke kortet, indtil kortet fylder skærmen
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
  sheet.innerHTML = '<button type="button" class="rk-close" aria-label="Luk">&times;</button><div class="rk-in"></div>';
  box.appendChild(sheet);
  var inner = sheet.querySelector('.rk-in');
  L.DomEvent.disableClickPropagation(sheet);
  L.DomEvent.disableScrollPropagation(sheet);

  function open(html, ll) {
    inner.innerHTML = html;
    sheet.scrollTop = 0;
    sheet.classList.add('open');
    if (!ll) return;
    // stedet skal stå frit over arket nedefra (telefon) eller til venstre for det (computer)
    var wide = window.innerWidth >= 720;
    map.panTo(ll, { animate: false });
    map.panBy(wide ? [sheet.offsetWidth / 2, 0] : [0, sheet.offsetHeight / 2], { animate: true });
  }
  function close() { sheet.classList.remove('open'); }
  sheet.querySelector('.rk-close').addEventListener('click', close);
  map.on('click', close);

  function tap(layer, html, ll) {
    layer.on('click', function (e) { L.DomEvent.stopPropagation(e); open(html, ll || e.latlng); });
    return layer;
  }

  function icon(cls, text) {
    return L.divIcon({ className: '', iconSize: null, html: '<div class="' + cls + '">' + text + '</div>' });
  }

  var all = [];
  (D.extras || []).forEach(function (x) {
    L.polyline(x.pts, { className: 'rk-case', weight: 7, dashArray: '8 8', interactive: false }).addTo(map);
    tap(L.polyline(x.pts, { className: 'rk-extra', weight: 4, dashArray: '8 8', bubblingMouseEvents: false }).addTo(map), x.html);
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
  function showTimes() { if (map.getZoom() >= 7) times.addTo(map); else times.remove(); }
  map.on('zoomend', showTimes);

  (D.spots || []).forEach(function (x) {
    var cls = 'rk-pin' + (x.k ? ' k' : '') + (x.out ? ' out' : '');
    tap(L.marker(x.ll, { icon: icon(cls, x.n), title: String(x.n), zIndexOffset: 100 }).addTo(map), x.html, x.ll);
  });
  (D.bases || []).forEach(function (x) {
    tap(L.marker(x.ll, { icon: icon('rk-night', x.label), zIndexOffset: 200 }).addTo(map), x.html, x.ll);
  });

  // kortet kan ligge i en skjult fane; tilpas og zoom ind på ruten, når det bliver synligt
  var fitted = false;
  function fit() {
    map.invalidateSize();
    if (!fitted && box.offsetWidth) { map.fitBounds(all.length ? all : [[-47.3, 166.4], [-34.4, 178.6]], { padding: [16, 16] }); fitted = true; }
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
  fit();
  showTimes();

  // fuld skærm med en klasse, så det også virker på iPhone
  var btns = document.createElement('div');
  btns.className = 'rk-btns';
  btns.innerHTML = '<button type="button" class="rk-btn" data-a="full">Fuld skærm</button><button type="button" class="rk-btn" data-a="me">Her er vi</button>';
  box.appendChild(btns);
  L.DomEvent.disableClickPropagation(btns);
  var fullBtn = btns.querySelector('[data-a="full"]');

  function setFull(on) {
    box.classList.toggle('full', on);
    document.body.classList.toggle('rk-lock', on);
    fullBtn.textContent = on ? 'Luk fuld skærm' : 'Fuld skærm';
    if (touch) { if (on) map.dragging.enable(); else map.dragging.disable(); }
    setTimeout(function () { map.invalidateSize(); }, 60);
  }
  fullBtn.addEventListener('click', function () { setFull(!box.classList.contains('full')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (sheet.classList.contains('open')) close(); else if (box.classList.contains('full')) setFull(false); }
  });

  var me = null;
  btns.querySelector('[data-a="me"]').addEventListener('click', function () { map.locate({ setView: true, maxZoom: 12 }); });
  map.on('locationfound', function (e) {
    if (me) me.remove();
    me = L.marker(e.latlng, { icon: icon('rk-me', ''), keyboard: false, zIndexOffset: 300 }).addTo(map);
  });
  map.on('locationerror', function () {
    open('<div class="rk-body"><h3>Kunne ikke finde jer</h3><p class="spot-sum">Telefonen gav ikke lov til at bruge placeringen. Tillad det i browseren og prøv igen.</p></div>');
  });
})();

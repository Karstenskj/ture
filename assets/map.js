/* ==========================================================================
   Ture — zoom og træk på et inline SVG-kort.

   Sådan bruges den på en turside:

     <div class="map-frame" id="frame" tabindex="0">
       <svg id="map" viewBox="0 0 1460 920" preserveAspectRatio="xMidYMid meet">
         <g id="vp"> ... alt korttegning her ... </g>
       </svg>
       <div class="map-ctrl">
         <button type="button" id="zoomOut" aria-label="Zoom ud">&minus;</button>
         <button type="button" id="zoomIn" aria-label="Zoom ind">+</button>
         <button type="button" id="zoomReset" class="w">Nulstil</button>
       </div>
     </div>
     <script src="../assets/map.js"></script>

   Scriptet læser selv viewBox, så det virker med et hvilket som helst kort.
   Gør ingenting hvis elementerne ikke findes.
   ========================================================================== */

(function () {
  var frame = document.getElementById('frame');
  var svg = document.getElementById('map');
  var vp = document.getElementById('vp');
  if (!frame || !svg || !vp) return;

  var vb = (svg.getAttribute('viewBox') || '0 0 1000 1000').trim().split(/[\s,]+/).map(Number);
  var VB_W = vb[2] || 1000;
  var VB_H = vb[3] || 1000;
  var MIN_K = 1, MAX_K = 10;

  var k = 1, tx = 0, ty = 0;
  var pointers = new Map();
  var lastPinch = 0;
  var panFrom = null;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function apply() {
    tx = clamp(tx, VB_W * (1 - k), 0);
    ty = clamp(ty, VB_H * (1 - k), 0);
    vp.setAttribute('transform', 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') scale(' + k.toFixed(4) + ')');
  }

  /* klientkoordinat -> viewBox-koordinat, med letterboxing regnet med */
  function toVb(cx, cy) {
    var r = svg.getBoundingClientRect();
    var s = Math.min(r.width / VB_W, r.height / VB_H);
    return {
      x: (cx - r.left - (r.width - VB_W * s) / 2) / s,
      y: (cy - r.top - (r.height - VB_H * s) / 2) / s
    };
  }

  function zoomAt(factor, cx, cy) {
    var next = clamp(k * factor, MIN_K, MAX_K);
    if (next === k) return;
    var p = toVb(cx, cy);
    tx = p.x - (p.x - tx) * (next / k);
    ty = p.y - (p.y - ty) * (next / k);
    k = next;
    apply();
  }

  function centre() {
    var r = frame.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  frame.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(Math.pow(0.999, e.deltaY), e.clientX, e.clientY);
  }, { passive: false });

  frame.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.map-ctrl')) return;
    frame.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      panFrom = toVb(e.clientX, e.clientY);
      frame.classList.add('is-panning');
    } else if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      lastPinch = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      panFrom = null;
    }
  });

  frame.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      var dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinch > 0) zoomAt(dist / lastPinch, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      lastPinch = dist;
      return;
    }

    if (panFrom) {
      var now = toVb(e.clientX, e.clientY);
      tx += (now.x - panFrom.x) * k;
      ty += (now.y - panFrom.y) * k;
      apply();
      panFrom = toVb(e.clientX, e.clientY);
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinch = 0;
    if (pointers.size === 0) { panFrom = null; frame.classList.remove('is-panning'); }
  }

  frame.addEventListener('pointerup', endPointer);
  frame.addEventListener('pointercancel', endPointer);

  var bIn = document.getElementById('zoomIn');
  var bOut = document.getElementById('zoomOut');
  var bReset = document.getElementById('zoomReset');
  if (bIn) bIn.addEventListener('click', function () { var c = centre(); zoomAt(1.45, c.x, c.y); });
  if (bOut) bOut.addEventListener('click', function () { var c = centre(); zoomAt(1 / 1.45, c.x, c.y); });
  if (bReset) bReset.addEventListener('click', function () { k = 1; tx = 0; ty = 0; apply(); });

  frame.addEventListener('keydown', function (e) {
    var step = 60 * k, c = centre();
    if (e.key === 'ArrowLeft') { tx += step; }
    else if (e.key === 'ArrowRight') { tx -= step; }
    else if (e.key === 'ArrowUp') { ty += step; }
    else if (e.key === 'ArrowDown') { ty -= step; }
    else if (e.key === '+' || e.key === '=') { zoomAt(1.45, c.x, c.y); e.preventDefault(); return; }
    else if (e.key === '-' || e.key === '_') { zoomAt(1 / 1.45, c.x, c.y); e.preventDefault(); return; }
    else if (e.key === '0') { k = 1; tx = 0; ty = 0; apply(); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    apply();
  });

  apply();
})();

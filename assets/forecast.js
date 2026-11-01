/* ==========================================================================
   Ture — vejr og bølger fra Open-Meteo, hentet hver gang siden åbnes.

   Sådan bruges den på en turside:

     <span class="ov-wx" data-wx="-43.72,170.09" data-date="2026-11-17"></span>
     <script src="../assets/forecast.js"></script>

   data-sea="lat,lon" (et punkt lidt ude i vandet) tilføjer bølger.
   Prognosen rækker 16 dage frem, så dage længere ude viser hvornår vejret kommer.
   Et element med id="wx-stamp" får tidspunktet for hentningen.
   Gør ingenting hvis der ikke er nogen elementer eller nettet fejler.
   ========================================================================== */

(function () {
  var els = [].slice.call(document.querySelectorAll('[data-wx]'));
  if (!els.length) return;

  var MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var DOW = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
  var DIR = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  var DAYS = 16;

  // samme sted hentes kun én gang, alle steder i ét kald
  function points(attr) {
    var idx = {}, list = [];
    els.forEach(function (el) {
      var v = el.getAttribute(attr);
      if (v && !(v in idx)) { idx[v] = list.length; list.push(v); }
    });
    return { list: list, idx: idx };
  }

  function get(base, p, daily, extra) {
    if (!p.list.length) return Promise.resolve([]);
    var lat = p.list.map(function (s) { return s.split(',')[0]; }).join(',');
    var lon = p.list.map(function (s) { return s.split(',')[1]; }).join(',');
    return fetch(base + '?latitude=' + lat + '&longitude=' + lon + '&daily=' + daily +
        '&timezone=Pacific%2FAuckland&forecast_days=' + DAYS + (extra || ''))
      .then(function (r) { return r.json(); })
      .then(function (d) { return Array.isArray(d) ? d : [d]; });
  }

  function chip(cls, text) {
    var s = document.createElement('span');
    s.className = 'chip' + (cls ? ' ' + cls : '');
    s.textContent = text;
    return s;
  }

  function day(d) { return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }

  var land = points('data-wx'), sea = points('data-sea');

  Promise.all([
    get('https://api.open-meteo.com/v1/forecast', land,
      'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max', '&wind_speed_unit=ms'),
    get('https://marine-api.open-meteo.com/v1/marine', sea,
      'swell_wave_height_max,swell_wave_period_max,swell_wave_direction_dominant')
  ]).then(function (res) {
    els.forEach(function (el) {
      var date = el.getAttribute('data-date');
      var w = res[0][land.idx[el.getAttribute('data-wx')]];
      var i = w && w.daily ? w.daily.time.indexOf(date) : -1;
      // den sidste dag i prognosen kan mangle tal, og så er det bedre at vente en dag end at vise 0°
      if (i >= 0 && w.daily.temperature_2m_max[i] == null) {
        el.appendChild(chip('wait', 'vejret kommer i morgen'));
        return;
      }
      if (i < 0) {
        var from = new Date(date + 'T12:00:00');
        from.setDate(from.getDate() - (DAYS - 1));
        if (from > new Date()) el.appendChild(chip('wait', 'vejret kommer ' + day(from)));
        return;
      }
      var d = w.daily, tmin = Math.round(d.temperature_2m_min[i]), rain = d.precipitation_sum[i];
      el.appendChild(chip(tmin <= 2 ? 'cold' : '', Math.round(d.temperature_2m_max[i]) + '° / ' + tmin + '°'));
      el.appendChild(chip('wind', 'vind ' + Math.round(d.wind_speed_10m_max[i]) + ' m/s'));
      el.appendChild(rain >= 1 ? chip('wet', 'regn ' + Math.round(rain) + ' mm') : chip('dry', 'tørt'));

      var m = res[1][sea.idx[el.getAttribute('data-sea')]];
      var j = m && m.daily ? m.daily.time.indexOf(date) : -1;
      if (j >= 0 && m.daily.swell_wave_height_max[j] != null) {
        el.appendChild(chip('', 'bølger ' + m.daily.swell_wave_height_max[j].toFixed(1).replace('.', ',') + ' m · ' +
          Math.round(m.daily.swell_wave_period_max[j]) + ' s · fra ' +
          DIR[Math.round(m.daily.swell_wave_direction_dominant[j] / 45) % 8]));
      }
    });
    var st = document.getElementById('wx-stamp'), n = new Date();
    if (st) st.textContent = 'Vejret er hentet ' + day(n) + ' kl. ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2) + '.';
  }).catch(function () {});
})();

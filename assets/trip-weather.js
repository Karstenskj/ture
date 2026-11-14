/* SunCalc 1.9 uses radians; the rest of this module uses degrees and UTC instants. */
(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./vendor/suncalc-1.9.0.js') : root.SunCalc);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripWeather = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Sun) {
  'use strict';
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function localParts(at, zone) {
    var p = {};
    new Intl.DateTimeFormat('en-GB', {timeZone:zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(at).forEach(function (part) {p[part.type] = part.value;});
    return p;
  }
  function noon(at, zone) {
    var p = localParts(at, zone), anchor = new Date(Date.UTC(+p.year,+p.month-1,+p.day,12)), z = localParts(anchor, zone);
    var offset = Date.UTC(+z.year,+z.month-1,+z.day,+z.hour,+z.minute,+z.second) - +anchor;
    return new Date(+anchor - offset);
  }
  function solar(at, ll, zone) {
    zone = zone || 'Pacific/Auckland';
    var times = Sun.getTimes(noon(at, zone),ll[0],ll[1]), pos = Sun.getPosition(at,ll[0],ll[1]);
    var altitude = pos.altitude * 180 / Math.PI, rising = +at < +times.solarNoon;
    var phase = altitude >= 6 ? 'day' : altitude >= -.833 ? (rising ? 'morning' : 'evening') : altitude >= -12 ? (rising ? 'dawn' : 'dusk') : 'night';
    return {altitude:altitude, azimuth:pos.azimuth * 180 / Math.PI + 180, phase:phase, rising:rising,
      darkness:clamp((-altitude - .833) / 16,0,1), golden:clamp(1 - Math.abs(altitude - 1) / 7,0,1),
      sunrise:Number.isFinite(+times.sunrise) ? times.sunrise : null, sunset:Number.isFinite(+times.sunset) ? times.sunset : null, zone:zone};
  }
  function state(at, ll, weather, zone) {
    var light = solar(at,ll,zone), w = weather || {}, cloud = w.cloud_cover == null ? null : clamp(w.cloud_cover,0,100);
    var code = w.weather_code, rainCode = code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95);
    var snow = (w.snowfall != null && w.snowfall > 0) || [71,73,75,77,85,86].indexOf(code) >= 0;
    var rain = !snow && ((w.precipitation != null && w.precipitation > .04) || rainCode);
    var fog = code === 45 || code === 48;
    var clear = cloud != null && cloud < 40 && !rain && !snow && !fog;
    var stars = clear ? clamp((-light.altitude - 12) / 6,0,1) * (1 - cloud / 55) : 0;
    var sun = cloud != null && light.altitude > -.833 && !rain && !snow && !fog ? clamp(1 - cloud / 80,0,1) : 0;
    var wind = w.wind_speed_10m == null ? null : Math.max(0,w.wind_speed_10m);
    var condition = !weather ? 'unknown' : snow ? 'snow' : rain ? 'rain' : fog ? 'fog' : cloud == null ? 'unknown' : cloud >= 75 ? 'overcast' : cloud >= 25 ? 'cloudy' : 'clear';
    return {solar:light, weather:weather, condition:condition, cloud:cloud, rain:!!rain, snow:!!snow, fog:fog,
      stars:stars, sun:sun, wind:wind, windDirection:w.wind_direction_10m, rainAmount:w.precipitation,
      tentLight:clamp((-light.altitude + 1) / 8,0,1), brightness:1 - light.darkness * .3 - (cloud == null ? 0 : cloud / 100 * .08)};
  }
  return {solar:solar,state:state};
});

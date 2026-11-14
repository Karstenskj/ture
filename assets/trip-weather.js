/* SunCalc 1.9 uses radians; the rest of this module uses degrees and UTC instants. */
(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./vendor/suncalc-1.9.0.js') : root.SunCalc);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripWeather = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Sun) {
  'use strict';
  var DAY = 86400000, HOUR = 3600000, fields = ['temperature_2m','precipitation','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_direction_10m','wind_gusts_10m'];
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
  function cell(ll) { return ll.map(function (v) { return Math.round(v * 20) / 20; }); }
  function key(ll, at) { return cell(ll).join(',') + '/' + at.toISOString().slice(0,10); }
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
  function fromResponse(response, at, now) {
    if (!response || response.error) return null;
    var current = response.current, result = {}, found = false, i = -1, times = response.hourly && response.hourly.time;
    // Current fields are model conditions for their own 15-minute interval only.
    if (current && number(current.time) != null && +at >= current.time * 1000 && +at < (current.time + (current.interval || 900)) * 1000) {
      fields.forEach(function (f) {result[f] = number(current[f]);}); result.time = current.time;
    } else if (Array.isArray(times)) {
      var stamp = Math.floor(+at / HOUR) * 3600;
      i = times.indexOf(stamp);
      if (i < 0) return null; // Do not borrow another hour/day, including the end of the forecast.
      fields.forEach(function (f) {result[f] = number(response.hourly[f] && response.hourly[f][i]);}); result.time = times[i];
    } else return null;
    fields.forEach(function (f) {if (result[f] != null) found = true;});
    if (!found) return null;
    result.source = +at < +now - HOUR ? 'model' : 'forecast';
    return result;
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
  function requestURL(points, at) {
    var cells = points.map(cell), date = at.toISOString().slice(0,10);
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + cells.map(function (p) {return p[0];}).join(',') +
      '&longitude=' + cells.map(function (p) {return p[1];}).join(',') + '&hourly=' + fields.join(',') + '&current=' + fields.join(',') +
      '&timezone=GMT&timeformat=unixtime&wind_speed_unit=ms&start_date=' + date + '&end_date=' + date;
  }
  function inRange(at, now) {
    var diff = Math.floor(+at / DAY) - Math.floor(+now / DAY);
    return diff >= -92 && diff <= 15;
  }
  function createStore(options) {
    options = options || {};
    var cache = new Map(), cooldown = 0, pending = new Set();
    var fetcher = options.fetch || function (url, init) {return fetch(url,init);};
    var nowFn = options.now || function () {return new Date();};
    function lookup(ll, at) {
      var entry = cache.get(key(ll,at)), now = +nowFn();
      return entry && now - entry.fetched < 30 * 60000 ? fromResponse(entry.data,at,new Date(now)) : null;
    }
    function delay() { return Math.max(0,cooldown - +nowFn()); }
    function stale(ll, at) {var entry = cache.get(key(ll,at));return !entry || +nowFn() - entry.fetched >= 20 * 60000;}
    async function load(points, at) {
      var realNow = nowFn();
      if (!inRange(at,realNow) || delay() > 0) return false;
      var needed = [], keys = [];
      points.forEach(function (ll) {
        var k = key(ll,at), entry = cache.get(k);
        if (keys.indexOf(k) < 0 && !pending.has(k) && (!entry || +realNow - entry.fetched >= 20 * 60000)) {needed.push(cell(ll));keys.push(k);}
      });
      if (!needed.length) return false;
      keys.forEach(function (k) {pending.add(k);}); cooldown = +realNow + 15000;
      var abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeout = abort ? setTimeout(function () {abort.abort();},8000) : null;
      try {
        var response = await fetcher(requestURL(needed,at),abort ? {signal:abort.signal} : {});
        if (!response.ok) throw new Error('Weather HTTP ' + response.status);
        var data = await response.json(); data = Array.isArray(data) ? data : [data];
        keys.forEach(function (k,i) {
          if (data[i] && data[i].hourly && !data[i].error) cache.set(k,{data:data[i],fetched:+nowFn()});
        });
        while (cache.size > 36) cache.delete(cache.keys().next().value);
        return true;
      } catch (error) {cooldown = +nowFn() + 60000;return false;}
      finally {if (timeout) clearTimeout(timeout); keys.forEach(function (k) {pending.delete(k);});}
    }
    return {lookup:lookup,load:load,delay:delay,stale:stale};
  }
  return {cell:cell,key:key,solar:solar,fromResponse:fromResponse,state:state,requestURL:requestURL,inRange:inRange,createStore:createStore};
});

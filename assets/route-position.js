/* Position and activity from the trip plan. All dates and times use New Zealand time. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripPosition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var lengths = new WeakMap();
  var formatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  var brisbaneFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function clock(now) {
    var parts = {};
    formatter.formatToParts(now || new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return { date: parts.year + '-' + parts.month + '-' + parts.day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }
  function distance(a, b) {
    var rad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    var x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
  }
  function pointAlong(points, progress) {
    if (!points || !points.length) return null;
    if (progress <= 0) return points[0].slice();
    if (progress >= 1) return points[points.length - 1].slice();
    var cumulative = lengths.get(points);
    if (!cumulative) {
      cumulative = [0];
      for (var i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
      lengths.set(points, cumulative);
    }
    var target = cumulative[cumulative.length - 1] * progress;
    if (!target) return points[0].slice();
    var lo = 1, hi = cumulative.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (cumulative[mid] < target) lo = mid + 1; else hi = mid; }
    var ratio = (target - cumulative[lo - 1]) / (cumulative[lo] - cumulative[lo - 1] || 1);
    return [points[lo - 1][0] + (points[lo][0] - points[lo - 1][0]) * ratio, points[lo - 1][1] + (points[lo][1] - points[lo - 1][1]) * ratio];
  }
  function inNewZealand(ll) {
    if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) return false;
    return (ll[0] >= -48 && ll[0] <= -33 && ll[1] >= 165 && ll[1] <= 180) ||
      (ll[0] >= -45.5 && ll[0] <= -43 && ll[1] >= -177 && ll[1] <= -175);
  }
  function greatCircle(from, to, progress) {
    var rad = Math.PI / 180;
    function vector(p) { var a = p[0] * rad, b = p[1] * rad; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; }
    var a = vector(from), b = vector(to), angle = Math.acos(Math.max(-1, Math.min(1, a.reduce(function (sum, x, i) { return sum + x * b[i]; }, 0))));
    if (angle < 0.000001) return from.slice();
    var u = Math.sin((1 - progress) * angle) / Math.sin(angle), v = Math.sin(progress * angle) / Math.sin(angle);
    var p = a.map(function (x, i) { return x * u + b[i] * v; });
    return [Math.atan2(p[2], Math.hypot(p[0], p[1])) / rad, Math.atan2(p[1], p[0]) / rad];
  }
  function helenaState(data, now) {
    var flight = data.helenaFlight;
    if (!flight) return { phase: 'joined' };
    var stamp = +(now || new Date()), departure = +new Date(flight.departure), arrival = +new Date(flight.arrival);
    if (stamp >= arrival) return { phase: 'joined' };
    if (stamp < departure) {
      if (stamp >= departure - 90 * 60000) return { phase: 'airport', ll: flight.from.slice(), name: 'Helena i Brisbane lufthavn', scene: 'airport', estimated: true };
      var parts = {};
      brisbaneFormatter.formatToParts(now || new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var minute = Number(parts.hour) * 60 + Number(parts.minute);
      var scene = minute >= 1320 || minute < 420 ? 'helena-sleep' : minute < 540 ? 'helena-run' :
        minute < 600 ? 'helena-food' : minute < 720 ? 'helena-coffee' : minute < 840 ? 'helena-shop' :
        minute < 930 ? 'helena-food' : minute < 1080 ? 'helena-coffee' : minute < 1140 ? 'helena-food' : 'helena-tv';
      return { phase: 'brisbane', ll: (flight.home || flight.from).slice(), name: 'Helena i Brisbane CBD', scene: scene,
        localTime: parts.hour + ':' + parts.minute, estimated: true };
    }
    var progress = (stamp - departure) / (arrival - departure);
    return { phase: 'flight', ll: greatCircle(flight.from, flight.to, progress), name: 'Helena på vej til NZ',
      estimated: !!flight.estimatedDeparture, progress: progress, arrival: flight.arrival };
  }
  function pathFor(data, segment) {
    if (segment.leg != null) return data.legs[segment.leg].pts;
    if (segment.ferry != null) return data.ferries[segment.ferry].pts;
    return null;
  }
  function segmentPoint(data, segment, fraction) {
    if (segment.point) return segment.point.slice();
    var portion = segment.portion || [0, 1];
    return pointAlong(pathFor(data, segment), portion[0] + (portion[1] - portion[0]) * fraction);
  }
  function estimate(data, now) {
    var time = clock(now), plan = data.locationPlan;
    if (!plan || !plan.days.length) return null;
    var days = plan.days, solo = helenaState(data, now).phase !== 'joined';
    if (time.date < days[0].date) {
      var sleeping = time.minutes >= 1320 || time.minutes < 360;
      return { ll: plan.start.ll.slice(), name: plan.start.name, scene: sleeping ? 'solo-sleep' : 'packing', source: 'plan', phase: 'before', solo: true, coastal: true, clock: time, note: 'Startpunktet er omtrentligt for South New Brighton. Hjemme før tidlig afgang den ' + days[0].date + '. Aktiviteten er illustreret efter lokal tid.' };
    }
    var index = days.findIndex(function (d) { return d.date === time.date; });
    if (index < 0) {
      var end = days[days.length - 1].stay;
      return { ll: end.ll.slice(), name: end.name, scene: 'drive', source: 'plan', phase: 'after', solo: solo, clock: time, note: 'Sidste sted på den fastlagte rute. Turene efter Auckland har ingen faste datoer.' };
    }
    var day = days[index], previous = index ? days[index - 1].stay : plan.start;
    var segments = day.segments || [], location = previous, ll = previous.ll.slice(), activity = null, moving = false;
    function place(segment) {
      var nearStay = segment.point && distance(segment.point, day.stay.ll) < 2500;
      return { name: segment.name, camp: !!(nearStay && day.stay.camp), coastal: !!(nearStay && day.stay.coastal) };
    }
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (time.minutes < s.from) break;
      if (time.minutes < s.to) {
        ll = segmentPoint(data, s, (time.minutes - s.from) / Math.max(1, s.to - s.from));
        location = place(s); activity = s.activity || null; moving = !s.point;
        break;
      }
      ll = segmentPoint(data, s, 1); location = place(s);
    }
    var completed = !segments.length || time.minutes >= segments[segments.length - 1].to;
    if (completed) { location = day.stay; ll = location.ll.slice(); }
    var early = time.minutes < 7 * 60, evening = time.minutes >= 17 * 60;
    var atCamp = !!location.camp && !moving;
    var scene = activity || (atCamp ? (evening ? 'camp' : 'walk') : 'drive');
    if (atCamp && (time.minutes >= 22 * 60 || early)) scene = solo ? 'solo-sleep' : 'sleep';
    else if (atCamp && evening && !activity) scene = 'camp';
    if (index === 0 && time.minutes < segments[0].from) scene = 'packing';
    return { ll: ll, name: location.name, scene: scene, source: 'plan', phase: day.uncertain ? 'uncertain' : 'during',
      solo: solo, coastal: !!(location.coastal || (!moving && day.stay.coastal)), clock: time, stay: day.stay,
      note: day.note || 'Ca. position ud fra rejseplanen og lokal tid i New Zealand. Køretider og ophold er anslået.' };
  }
  function state(data, now, gps) {
    var planned = estimate(data, now);
    if (!gps || !inNewZealand(gps.ll)) return planned;
    var time = clock(now), scene = 'drive', name = 'Jeres position', coastal = false;
    if (planned && planned.phase === 'before' && distance(gps.ll, planned.ll) < 1000) {
      return Object.assign({}, planned, { ll: gps.ll.slice(), source: 'gps' });
    }
    if (planned && planned.solo && planned.scene !== 'drive' && distance(gps.ll, planned.ll) < 2500) {
      return Object.assign({}, planned, { ll: gps.ll.slice(), source: 'gps' });
    }
    var nearestCamp = null, nearestDistance = Infinity;
    (data.bases || []).forEach(function (base) {
      if (!base.camp) return;
      var d = distance(gps.ll, base.ll);
      if (d < 200 && d < nearestDistance) { nearestCamp = base; nearestDistance = d; }
    });
    if (nearestCamp) {
      name = nearestCamp.name; coastal = !!nearestCamp.coastal;
      scene = time.minutes >= 22 * 60 || time.minutes < 7 * 60 ? (planned && planned.solo ? 'solo-sleep' : 'sleep') : 'camp';
    } else {
      var nearest = null; nearestDistance = Infinity;
      (data.spots || []).concat(data.activityTargets || []).forEach(function (spot) {
        var d = distance(gps.ll, spot.ll);
        var radius = spot.activity === 'hike' ? 1800 : spot.activity === 'surf' ? 1800 : 400;
        if (d < radius && d < nearestDistance) { nearest = spot; nearestDistance = d; }
      });
      if (nearest) { scene = nearest.activity || 'walk'; name = nearest.name; }
      else if (planned && planned.scene === 'hike' && distance(gps.ll, planned.ll) < 10000) { scene = 'hike'; name = planned.name; }
    }
    return { ll: gps.ll.slice(), name: name, scene: scene, source: 'gps', phase: 'during', coastal: coastal,
      solo: planned ? planned.solo : false, clock: time, note: 'GPS-position fra denne enhed. Positionen deles ikke som live GPS med andre besøgende.' };
  }
  return { clock: clock, distance: distance, pointAlong: pointAlong, inNewZealand: inNewZealand, greatCircle: greatCircle,
    helenaState: helenaState, estimate: estimate, state: state };
});

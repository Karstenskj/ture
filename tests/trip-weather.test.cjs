const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../assets/trip-weather.js');
const buxton = [-42.8554415,173.3115043];
const at = time=>new Date('2026-11-14T'+time+':00+13:00');
const weather = overrides=>Object.assign({cloud_cover:3,precipitation:0,snowfall:0,weather_code:0,temperature_2m:16,wind_speed_10m:4,wind_direction_10m:60},overrides);

test('summer daylight follows the sun, including light at 17 and twilight after sunset',()=>{
  assert.equal(W.solar(at('17:00'),buxton).phase,'day');
  assert.equal(W.solar(at('05:30'),buxton).phase,'dawn');
  assert.equal(W.solar(at('06:00'),buxton).phase,'morning');
  assert.equal(W.solar(at('20:00'),buxton).phase,'evening');
  assert.equal(W.solar(at('20:30'),buxton).phase,'dusk');
  assert.equal(W.solar(at('22:00'),buxton).phase,'night');
  const winter=W.solar(new Date('2026-06-14T18:00:00+12:00'),buxton);
  assert.ok(winter.darkness>.5);
});
test('NZ and Brisbane use their own calendar days, independent of the visitor clock',()=>{
  const when=at('20:00');
  const b=W.solar(when,[-27.4698,153.0251],'Australia/Brisbane');
  assert.equal(b.phase,'day');
  const fmt = (time,zone)=>new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(time);
  assert.ok(fmt(b.sunset,'Australia/Brisbane').startsWith('18:'));
  assert.ok(fmt(W.solar(when,buxton).sunset,'Pacific/Auckland').startsWith('20:'));
  const midnight=W.solar(new Date('2026-11-14T00:10:00+13:00'),buxton);
  assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland'}).format(midnight.sunrise),'2026-11-14');
});
test('stars and sunlight respect real darkness, clouds and precipitation',()=>{
  assert.equal(W.state(at('17:00'),buxton,weather()).stars,0);
  const clear=W.state(at('22:00'),buxton,weather());
  assert.ok(clear.stars>0);assert.equal(clear.sun,0);assert.equal(clear.tentLight,1);
  for (const change of [{cloud_cover:90},{precipitation:1,weather_code:61},{weather_code:45},{snowfall:.5,weather_code:73}]) {
    assert.equal(W.state(at('22:00'),buxton,weather(change)).stars,0);
  }
  assert.equal(W.state(at('17:00'),buxton,weather({cloud_cover:90})).sun,0);
  assert.equal(W.state(at('17:00'),buxton,weather()).tentLight,0);
});
test('missing weather stays unknown; valid zeroes are not missing or fabricated',()=>{
  const env=W.state(at('22:00'),buxton,null);
  assert.equal(env.condition,'unknown');assert.equal(env.stars,0);assert.equal(env.rain,false);assert.equal(env.wind,null);
  const partial=W.state(at('22:00'),buxton,weather({cloud_cover:null}));
  assert.equal(partial.stars,0);assert.equal(partial.condition,'unknown');
  const zero=W.state(at('17:00'),buxton,weather({cloud_cover:0,wind_speed_10m:0,temperature_2m:0}));
  assert.equal(zero.wind,0);assert.ok(zero.sun>0);
});
test('weather replay selects its exact UTC hour and never borrows today or the forecast edge',()=>{
  const chosen=at('10:30'), hour=Math.floor(+chosen/3600000)*3600;
  const payload={current:{time:+at('15:00')/1000,interval:900,temperature_2m:28},hourly:{time:[hour],temperature_2m:[9],cloud_cover:[90],precipitation:[1]}};
  const old=W.fromResponse(payload,chosen,at('15:00'));
  assert.equal(old.temperature_2m,9);assert.equal(old.source,'model');
  assert.equal(W.fromResponse(payload,at('11:00'),at('15:00')),null);
  assert.equal(W.fromResponse({hourly:{time:[hour],temperature_2m:[null]}},chosen,at('15:00')),null);
});
test('weather requests round GPS to an area, cache requests and enforce a cooldown',async()=>{
  let now=at('15:00'), calls=[];
  const hour=Math.floor(+now/3600000)*3600;
  const store=W.createStore({now:()=>now,fetch:async url=>{
    calls.push(url);return {ok:true,json:async()=>({hourly:{time:[hour],temperature_2m:[16],cloud_cover:[3],precipitation:[0]}})};
  }});
  assert.equal(await store.load([buxton,buxton],now),true);
  assert.equal(calls.length,1);
  assert.ok(!calls[0].includes('-42.8554415'));
  assert.ok(!calls[0].includes('173.3115043'));
  assert.ok(calls[0].includes('latitude=-42.85&longitude=173.3'));
  assert.equal(store.lookup(buxton,now).temperature_2m,16);
  assert.equal(store.stale(buxton,now),false);
  assert.equal(await store.load([[-43.5,172.7]],now),false);
  now=new Date(+now+16000);assert.equal(await store.load([buxton],now),false);
  now=new Date(+at('15:00')+20*60000);
  assert.equal(store.stale(buxton,now),true);
  assert.equal(store.lookup(buxton,now).temperature_2m,16); // Keep usable data during refresh.
  assert.equal(await store.load([buxton],now),true);assert.equal(calls.length,2);
  now=new Date(+now+31*60000);assert.equal(store.lookup(buxton,now),null);
});
test('out-of-range future dates and failed requests keep the solar fallback and back off',async()=>{
  const now=at('15:00');let calls=0;
  const store=W.createStore({now:()=>now,fetch:async()=>{calls++;throw new Error('offline');}});
  assert.equal(await store.load([buxton],new Date('2026-12-11T12:00:00+13:00')),false);
  assert.equal(calls,0);
  assert.equal(await store.load([buxton],now),false);assert.equal(calls,1);
  assert.ok(store.delay()>=60000);assert.equal(store.lookup(buxton,now),null);
});

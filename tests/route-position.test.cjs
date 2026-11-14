const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const P = require('../assets/route-position.js');
const html = fs.readFileSync(__dirname+'/../trips/2026-11-nz-rundtur.html','utf8');
const data = JSON.parse(html.match(/id="rk-data">(.*?)<\/script>/s)[1]);
const at = (stamp,gps) => P.state(data,new Date(stamp),gps);

test('NZ clock and independent Brisbane clock do not follow visitor timezone',()=>{
  assert.deepEqual(P.clock(new Date('2026-11-13T12:00:00Z')),{date:'2026-11-14',minutes:60});
  const h=P.helenaState(data,new Date('2026-11-13T22:30:00+13:00'));
  assert.equal(h.scene,'helena-tv'); assert.equal(h.localTime,'19:30');
  assert.equal(P.helenaState(data,new Date('2026-11-13T22:00:00+10:00')).scene,'helena-sleep');
  assert.equal(P.helenaState(data,new Date('2026-11-14T08:00:00+10:00')).scene,'helena-run');
});
test('public start, Buxton, Harris pies, conditional Mangamaunu, A1 and Point Kean before Godley',()=>{
  assert.deepEqual(at('2026-11-13T16:00:00+13:00').ll,[-43.53016,172.73651]);
  assert.equal(at('2026-11-13T16:00:00+13:00').scene,'packing');
  assert.equal(at('2026-11-14T06:30:00+13:00').scene,'packing');
  assert.equal(at('2026-11-14T08:00:00+13:00').scene,'drive');
  assert.equal(at('2026-11-14T20:00:00+13:00').scene,'beer');
  assert.equal(at('2026-11-14T22:00:00+13:00').scene,'solo-sleep');
  assert.equal(at('2026-11-15T06:00:00+13:00').name,'Buxton Camp · Gore Bay');
  assert.match(at('2026-11-15T10:30:00+13:00').name,/Harris Farms.*pies.*Cheviot/);
  assert.equal(at('2026-11-15T10:30:00+13:00').scene,'food');
  const surf=at('2026-11-15T13:00:00+13:00');
  assert.match(surf.name,/Mangamaunu/);
  assert.equal(surf.scene,'beach'); // Conditions and other surfers cannot be inferred from a clock.
  assert.match(surf.note,/gode bølger og andre surfere/);
  assert.match(at('2026-11-15T15:30:00+13:00').name,/A1 Kaikoura/);
  assert.match(at('2026-11-16T06:30:00+13:00').name,/A1 Kaikoura/);
  assert.equal(at('2026-11-16T09:30:00+13:00').scene,'vista');
  assert.match(at('2026-11-16T09:30:00+13:00').name,/Point Kean/);
  assert.match(at('2026-11-16T09:30:00+13:00').note,/ikke observationer/);
  assert.equal(at('2026-11-16T11:00:00+13:00').scene,'drive');
  assert.match(at('2026-11-16T15:30:00+13:00').name,/Sumner/);
  assert.equal(at('2026-11-16T15:30:00+13:00').scene,'cafe-work');
  assert.equal(at('2026-11-16T19:30:00+13:00').scene,'beer');
  assert.equal(at('2026-11-16T23:00:00+13:00').scene,'solo-sleep');
});
test('both Sumner days keep surfing conditional and leave time for the known airport arrival',()=>{
  for(const day of ['16','17']) {
    const beach=at(`2026-11-${day}T${day==='16'?'14':'11'}:00:00+13:00`);
    assert.match(beach.name,/Sumner/);assert.equal(beach.scene,'beach');assert.match(beach.note,/gode bølger/);
    const work=at(`2026-11-${day}T15:30:00+13:00`);assert.equal(work.scene,'cafe-work');assert.match(work.name,/café/);
  }
  assert.equal(at('2026-11-17T16:30:00+13:00').scene,'drive');
  assert.equal(at('2026-11-17T17:30:00+13:00').scene,'airport');
  assert.equal(data.locationPlan.days[2].stay.name,'Awaroa/Godley Head Campsite');
  assert.equal(data.locationPlan.days[3].stay.name,'Route79 Holiday Park');
});
test('estimated flight starts in Brisbane and joins at known Christchurch arrival',()=>{
  assert.equal(P.helenaState(data,new Date('2026-11-17T10:30:00+10:00')).phase,'airport');
  const h=P.helenaState(data,new Date('2026-11-17T13:25:00+10:00'));
  assert.equal(h.phase,'flight'); assert.equal(h.estimated,true); assert.equal(h.progress,.5);
  assert.ok(h.ll[0]<-27 && h.ll[0]>-44);
  assert.equal(at('2026-11-17T18:09:00+13:00').solo,true);
  assert.equal(at('2026-11-17T18:10:00+13:00').solo,false);
  assert.equal(at('2026-11-17T18:10:00+13:00').scene,'airport');
  assert.equal(at('2026-11-17T23:00:00+13:00').scene,'sleep');
});
test('outside NZ GPS falls back to plan; NZ GPS remains local to the device',()=>{
  const t='2026-11-20T23:00:00+13:00';
  assert.equal(at(t,{ll:[55.676,12.568]}).source,'plan');
  const camp=data.bases[4].ll;
  assert.deepEqual(at(t,{ll:camp}).ll,camp);
  assert.equal(at(t,{ll:camp}).source,'gps');
  assert.equal(at(t,{ll:camp}).scene,'sleep');
  assert.equal(P.inNewZealand([-27.4698,153.0251]),false);
  assert.equal(P.inNewZealand([-43.95,-176.55]),true);
});
test('evening and overnight boundaries, hikes, and ambiguous days stay honest',()=>{
  assert.equal(at('2026-11-24T17:00:00+13:00').scene,'camp');
  assert.equal(at('2026-11-24T22:00:00+13:00').scene,'sleep');
  assert.equal(at('2026-11-25T06:59:00+13:00').scene,'sleep');
  assert.equal(at('2026-11-22T12:00:00+13:00').scene,'hike');
  assert.equal(at('2026-12-06T12:00:00+13:00').scene,'hike');
  assert.equal(at('2026-11-27T20:00:00+13:00').phase,'uncertain');
  assert.match(at('2026-12-01T10:00:00+13:00').note,/ombooket og bekræftet/);
  assert.equal(at('2026-12-01T10:00:00+13:00').scene,'ferry');
  assert.equal(data.ferries[0].booking.departure,'2026-12-01T07:45:00+13:00');
  assert.equal(at('2026-12-12T10:00:00+13:00').phase,'after');
});
test('all approximate days have ordered non-overlapping segments on valid routes',()=>{
 assert.equal(data.locationPlan.days.length,28);
 for(const d of data.locationPlan.days){let end=0;for(const s of d.segments){assert.ok(s.to>s.from);assert.ok(s.from>=end,`${d.date}: overlaps`);assert.ok(s.to<=1440);end=s.to;if(s.leg!=null)assert.ok(data.legs[s.leg].pts.length>1);}}
 assert.equal(data.bases[15].label,'man 7 dec');
 assert.equal(data.bases[20].name,'A1 Kaikoura Motel & Holiday Park');
 assert.ok(!data.bases[20].provisional);
 assert.equal(data.bases[19].name,'Awaroa/Godley Head Campsite');
 assert.ok(!data.spots.some(s=>/Napier/i.test(s.name)));
});
test('route interpolation follows distance and stays on the supplied path',()=>{
 const pts=[[0,0],[0,1],[0,3]];
 assert.deepEqual(P.pointAlong(pts,0),[0,0]);assert.deepEqual(P.pointAlong(pts,1),[0,3]);
 assert.ok(Math.abs(P.pointAlong(pts,.5)[1]-1.5)<1e-6);
});

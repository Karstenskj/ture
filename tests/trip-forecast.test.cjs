const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../assets/trip-forecast.js');
const Camps=require('../assets/trip-camp-weather.js');
const html=fs.readFileSync(__dirname+'/../trips/2026-11-nz-rundtur.html','utf8');
const data=JSON.parse(html.match(/id="rk-data">(.*?)<\/script>/s)[1]);
const at=s=>new Date(s+'+13:00');
const payload=(max=18)=>({daily:{time:['2026-11-14','2026-11-15'],temperature_2m_max:[max,null],temperature_2m_min:[8,null],precipitation_sum:[0,0],wind_speed_10m_max:[0,null]}});

test('camp weather follows selected nights plus departure, including possible Picton dates',()=>{
 const entries=Camps.plan(data),entry=i=>entries.find(e=>e.index===i);
 assert.equal(entries.length,data.bases.filter(b=>b.camp).length);
 assert.deepEqual(entry(5).days.map(d=>d.date),['2026-11-21','2026-11-22','2026-11-23']);
 assert.equal(entry(5).days[2].kind,'departure');
 assert.deepEqual(entry(20).days.map(d=>d.date),['2026-11-15','2026-11-16']);
 assert.deepEqual(entry(21).days.map(d=>d.date),['2026-11-30','2026-12-01']);
 assert.equal(entry(21).optional,true);assert.equal(entry(21).days[0].kind,'possible');
 assert.equal(entry(9).days.find(d=>d.date==='2026-11-27').kind,'possible');
 assert.equal(data.locationPlan.days[16].stay.name,'Mistletoe Bay Eco Village');
 assert.ok(data.locationPlan.days.every(d=>!data.bases.some(b=>b.optional && b.name===d.stay.name)));
 assert.equal(data.ferries[0].booking.confirmed,true);
});
test('forecast dates roll over at NZ midnight and stop at the real 16-day horizon',()=>{
 const before=at('2026-11-14T23:59:00'),after=at('2026-11-15T00:01:00');
 assert.equal(F.nzDay(after),'2026-11-15');
 assert.equal(F.range('2026-11-30',before),'future');assert.equal(F.range('2026-11-30',after),'inside');
 assert.equal(F.range('2026-11-14',after),'past');
 assert.equal(F.addDay('2026-12-01',-15),'2026-11-16');
});
test('daily values belong to their exact date, with zero preserved and missing fields unknown',()=>{
 assert.equal(F.row(payload(),'2026-11-14').wind_speed_10m_max,0);
 const partial=F.row(payload(),'2026-11-15');assert.equal(partial.temperature_2m_max,null);assert.equal(partial.precipitation_sum,0);
 assert.equal(F.row(payload(),'2026-11-16'),null);
 assert.equal(F.row({daily:{time:['2026-11-14'],temperature_2m_max:[null]}},'2026-11-14'),null);
 assert.equal(F.condition(null).kind,'unknown');
});
test('forecasts share rounded areas, cache for 30 minutes and replace old values after refresh',async()=>{
 let now=at('2026-11-14T16:00:00'),calls=[];
 const store=F.createStore({now:()=>now,fetch:async url=>{calls.push(url);return {ok:true,json:async()=>payload(18+calls.length)};}});
 const point=[-42.8554415,173.3115043];
 assert.equal(await store.load('land',[point,point]),true);assert.equal(calls.length,1);
 assert.ok(!calls[0].includes('42.8554415'));assert.match(calls[0],/timezone=Pacific%2FAuckland&forecast_days=16/);
 assert.equal(F.row(store.lookup('land',point).data,'2026-11-14').temperature_2m_max,19);
 assert.equal(await store.load('land',[point]),false);
 now=new Date(+now+30*60000);assert.equal(store.stale('land',point),true);
 assert.equal(await store.load('land',[point]),true);assert.equal(calls.length,2);
 assert.equal(F.row(store.lookup('land',point).data,'2026-11-14').temperature_2m_max,20);
});
test('failed marine or refresh calls preserve land weather and back off without falsifying freshness',async()=>{
 let now=at('2026-11-14T16:00:00'),failLand=false,calls=0;
 const store=F.createStore({now:()=>now,fetch:async url=>{calls++;if(failLand || url.includes('marine-api'))throw new Error('offline');return {ok:true,json:async()=>payload()};}});
 await Promise.allSettled([store.load('land',[[-43,173]]),store.load('sea',[[-43,173]])]);
 assert.ok(store.lookup('land',[-43,173]));assert.equal(store.lookup('sea',[-43,173]),null);
 const fetched=store.lookup('land',[-43,173]).fetched;now=new Date(+now+31*60000);failLand=true;
 assert.equal(await store.load('land',[[-43,173]]),false);assert.equal(store.lookup('land',[-43,173]).fetched,fetched);
 assert.equal(store.stale('land',[-43,173]),true);const count=calls;
 assert.equal(await store.load('land',[[-43,173]]),false);assert.equal(calls,count);
});
test('playback is removed while activity symbols and the ordinary map remain',()=>{
 assert.doesNotMatch(html,/trip-story\.(js|css)/);
 const map=fs.readFileSync(__dirname+'/../assets/rutekort.js','utf8');assert.doesNotMatch(map,/TripStory|previewTime|storyController/);
 const icons=require('../assets/trip-icons.js');assert.match(icons.icon('surf'),/<svg/);
 assert.match(html,/trip-camp-weather\.js/);assert.match(map,/TripForecast\.mount/);
});

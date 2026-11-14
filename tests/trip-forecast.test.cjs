const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../assets/trip-forecast.js');
const Camps=require('../assets/trip-camp-weather.js');
const config=require('../trips/2026-11-nz-metservice.js');
const html=fs.readFileSync(__dirname+'/../trips/2026-11-nz-rundtur.html','utf8');
const data=JSON.parse(html.match(/id="rk-data">(.*?)<\/script>/s)[1]);
F.configure(config,data.bases);
const now=new Date('2026-11-14T17:00:00+13:00');
test('camp dates still include nights, departure and optional Picton stays',()=>{
 const entries=Camps.plan(data),entry=i=>entries.find(e=>e.index===i);
 assert.deepEqual(entry(5).days.map(d=>d.date),['2026-11-21','2026-11-22','2026-11-23']);
 assert.deepEqual(entry(20).days.map(d=>d.date),['2026-11-15','2026-11-16']);
 assert.deepEqual(entry(21).days.map(d=>d.date),['2026-11-30','2026-12-01']);
 assert.equal(entry(21).optional,true);assert.equal(data.locationPlan.days[16].stay.name,'Mistletoe Bay Eco Village');
});
test('all camps have an explicitly named official MetService area',()=>{
 assert.equal(config.camps.length,data.bases.length);
 for(let i=0;i<data.bases.length;i++){let area=F.forCamp(i);assert.ok(area.label);assert.match(area.url,/^https:\/\/(www\.)?metservice.com\//);}
 assert.equal(F.forCamp(20).id,'kaikoura');assert.equal(F.forCamp(19).id,'port-hills');
 assert.equal(F.forPoint([-43.5679403,172.7618429]).id,'eastern-suburbs');
 for(let i of [3,7,14])assert.equal(F.forCamp(i).widget,false);
});
test('the real three-day window cannot be presented as a longer forecast',()=>{
 assert.equal(F.windowState(['2026-11-15','2026-11-16'],now).kind,'ready');
 assert.equal(F.windowState(['2026-11-16','2026-11-17'],now).partial,true);
 assert.deepEqual(F.windowState(['2026-11-17','2026-11-18'],now),{kind:'future',from:'2026-11-15'});
 assert.equal(F.windowState(['2026-11-13'],now).kind,'past');
 assert.equal(F.windowState(['2026-11-17'],new Date('2026-11-15T00:01:00+13:00')).kind,'ready');
});
test('future camp cards do not embed current weather under the trip dates',()=>{
 const area=F.forCamp(20);
 assert.doesNotMatch(F.content(area,['2026-11-20'],now),/<iframe/);
 assert.match(F.content(area,['2026-11-20'],now),/endnu ikke/);
 const shown=F.content(area,['2026-11-15','2026-11-16'],now);
 assert.match(shown,/<iframe/);assert.match(shown,/MetServices næste tre dage/);assert.match(shown,/Kaikōura/);
 assert.doesNotMatch(shown,/\d+°/); // Temperatures come from MetService's frame, not our own values.
 assert.match(F.widgetURL(area),/^https:\/\/services.metservice.com\/weather-widget\/widget\?/);
 assert.match(F.widgetURL(area),/loc=kaikoura&type=urban/);
});
test('NZ page removes rejected provider calls, preserves symbols and has no replay',()=>{
 assert.doesNotMatch(html,/trip-story\.(js|css)|assets\/forecast\.js/);
 const scripts=[...html.matchAll(/<script[^>]+src="(?!https:)([^"?]+)/g)].map(m=>require('node:path').resolve(__dirname,'../trips',m[1]));
 for(const file of scripts)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/api\.open-meteo|marine-api\.open-meteo/);
 const map=fs.readFileSync(__dirname+'/../assets/rutekort.js','utf8');assert.doesNotMatch(map,/TripStory|previewTime|storyController/);
 assert.match(require('../assets/trip-icons.js').icon('surf'),/<svg/);
});

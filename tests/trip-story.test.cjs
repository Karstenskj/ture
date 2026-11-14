const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Story = require('../assets/trip-story.js');
const Position = require('../assets/route-position.js');
const html = fs.readFileSync(__dirname + '/../trips/2026-11-nz-rundtur.html', 'utf8');
const data = JSON.parse(html.match(/id="rk-data">(.*?)<\/script>/s)[1]);

test('a replay stays on NZ time and never substitutes a visitor GPS location', () => {
  const time = Story.stamp('2026-11-15', 780);
  assert.deepEqual(Position.clock(time), {date:'2026-11-15', minutes:780});
  const replay = Position.state(data, time, null);
  assert.equal(replay.source, 'plan');
  assert.match(replay.name, /Mangamaunu/);
  assert.match(replay.note, /andre surfere/);
  assert.equal(Position.state(data, Story.stamp('2026-11-15',1320), null).scene, 'solo-sleep');
});
test('the family journal excludes future updates and chooses the latest confirmed date', () => {
  const entries = [{date:'2026-11-16',text:'future'}, {date:'2026-11-13',text:'old'}, {date:'2026-11-14',text:'today'}];
  assert.equal(Story.latest(entries, '2026-11-14').text, 'today');
  assert.equal(Story.latest(entries, '2026-11-12'), null);
  assert.equal(entries[0].date, '2026-11-16');
});
test('the story keeps planned stops in programme order and preserves photo credits', () => {
  const articles = data.locationPlan.days.map(() => ({anchors:[]}));
  articles[1] = {anchors:['s-cheviot-pies','s-mangamaunu','s33'],title:'Cheviot til Kaikōura'};
  const days = Story.build(data, articles);
  assert.deepEqual(days[1].stops.map(s=>s.anchor), ['s-cheviot-pies','s-mangamaunu']);
  assert.equal(days[1].stay.anchor, 'c-a1-kaikoura');
  assert.match(days[0].picture, /Schwede66/);
  assert.match(days[0].picture, /creativecommons.org/);
  assert.equal(Story.indexFor(days, '2026-11-01'), 0);
  assert.equal(Story.indexFor(days, '2026-12-12'), 27);
});
test('optional Picton camps do not move the selected nights or estimated overnight position', () => {
  const options = data.bases.filter(base=>base.optional);
  assert.deepEqual(options.map(base=>base.anchor), ['c-whatamango','c-momorangi']);
  assert.ok(options.every(base=>!base.booking));
  assert.equal(data.locationPlan.days[16].stay.name, 'Mistletoe Bay Eco Village');
  assert.ok(data.locationPlan.days.every(day=>!options.some(base=>base.name===day.stay.name)));
  const articles = data.locationPlan.days.map(()=>({anchors:[]}));
  articles[16].anchors = options.map(base=>base.anchor);
  assert.equal(Story.build(data, articles)[16].alternatives.length, 2);
  assert.equal(data.ferries[0].booking.confirmed, true);
});

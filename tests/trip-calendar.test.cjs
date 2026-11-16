const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../assets/trip-calendar.js','utf8');

function node(extra){
 const attrs={},classes=new Set();
 return Object.assign({hidden:false,dataset:{},textContent:'',
  classList:{add:c=>classes.add(c),contains:c=>classes.has(c)},
  setAttribute:(k,v)=>{attrs[k]=String(v);},removeAttribute:k=>{delete attrs[k];},getAttribute:k=>k in attrs?attrs[k]:null,
  addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},
  getBoundingClientRect:()=>({left:0,right:0,width:0})},extra);
}
// Kører kalenderen mod en lille kunstig side med dagene 14-18 nov og et fast "nu".
function run(nowIso){
 const iso=['2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18'];
 const days=iso.map(d=>node({querySelector:s=>({textContent:s==='.dow'?'dag':d})}));
 const dates=iso.map(d=>node({querySelector:s=>s==='time'?{dateTime:d}:null}));
 const program=node({
  querySelector:s=>s==='.calendar-scroll'?node({scrollLeft:0}):null,
  querySelectorAll:s=>s==='.calendar-day-details > .day'?days:s==='[data-calendar-day]'?dates:[]});
 const label=node();
 const fixed=Date.parse(nowIso);
 class FixedDate extends Date{constructor(...a){if(a.length)super(...a);else super(fixed);}}
 const window={};
 vm.runInNewContext(source,{window,Date:FixedDate,Intl,location:{},
  document:{getElementById:id=>id==='program'?program:id==='calendar-selected-label'?label:null}});
 return {selected:dates.findIndex(d=>d.getAttribute('aria-current')==='date'),
  today:dates.map(d=>d.classList.contains('is-today')),past:dates.map(d=>d.classList.contains('is-past')),
  shown:days.map(d=>!d.hidden),window,days,dates};
}

test('the calendar opens on today in New Zealand time and marks it',()=>{
 // 15 nov kl. 12 UTC er 16 nov kl. 01 i New Zealand.
 const r=run('2026-11-15T12:00:00Z');
 assert.equal(r.selected,2);
 assert.deepEqual(r.today,[false,false,true,false,false]);
 assert.deepEqual(r.past,[true,true,false,false,false]);
 assert.deepEqual(r.shown,[false,false,true,false,false]);
});
test('before and after the trip the calendar still opens on the first day',()=>{
 const before=run('2026-11-01T00:00:00Z');
 assert.equal(before.selected,0);
 assert.ok(!before.today.includes(true));
 assert.ok(!before.past.includes(true));
 const after=run('2026-12-20T00:00:00Z');
 assert.equal(after.selected,0);
 assert.ok(after.past.every(Boolean));
});
test('a deep link still wins over today, and the program tab keeps the selection',()=>{
 const r=run('2026-11-15T12:00:00Z');
 const current=()=>r.dates.findIndex(d=>d.getAttribute('aria-current')==='date');
 r.window.tripCalendar.selectFor(null);
 assert.equal(current(),2);
 r.window.tripCalendar.selectFor({closest:()=>r.days[4]});
 assert.equal(current(),4);
 assert.ok(r.dates[2].classList.contains('is-today'));
});

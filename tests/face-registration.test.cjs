const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const registration=require('../assets/face-registration.js');
const scenes=require('../assets/trip-scenes.js');

test('the face calibration uses the approved, unchanged character master',()=>{
 const master=fs.readFileSync(__dirname+'/../assets/trip-world/characters-base.png');
 assert.equal(crypto.createHash('sha256').update(master).digest('hex'),registration.masterSha256);
 assert.equal(Object.keys(registration.poses).length,19);
});
test('every fitted face aligns both eyes and the mouth with the measured body pose',()=>{
 for(const [id,pose] of Object.entries(registration.poses)){
  const [a,b,c,d,e,f]=pose.matrix;
  assert.ok(a*d-b*c>0,id+' must not be mirrored');
  registration.source[pose.kind].forEach(([x,y],i)=>{
   const [targetX,targetY]=pose.points[i];
   assert.ok(Math.hypot(a*x+c*y+e-targetX,b*x+d*y+f-targetY)<.001,id+' landmark '+i);
  });
 }
});
test('all activity renderings use the measured transforms, including tilted and sleeping poses',()=>{
 const cases={camp:['camp-k','camp-h'],hike:['hike-k','hike-h'],surf:['surf-k','surf-h'],cave:['cave-k','cave-h'],
  packing:['karsten-solo-day-0'],work:['karsten-solo-day-1'],'solo-surf':['karsten-solo-day-2'],food:['karsten-solo-day-3'],beer:['karsten-solo-day-4'],
  'helena-run':['helena-day-0'],'helena-coffee':['helena-day-1'],'helena-shop':['helena-day-2'],'helena-food':['helena-day-3'],'helena-tv':['helena-day-4'],'helena-sleep':['helena-day-5']};
 for(const [type,ids] of Object.entries(cases)){
  const html=scenes.render(type,{solo:type==='packing'||type==='work'||type==='food'||type==='beer'||type==='solo-surf',helena:type.startsWith('helena-')}).html;
  for(const id of ids){
   assert.ok(html.includes('data-face-id="'+id+'"'),type+' / '+id);
   assert.ok(html.includes('matrix('+registration.poses[id].matrix.join(' ')+')'),id+' transform');
  }
  assert.ok(!html.includes('NaN'),type);
 }
});

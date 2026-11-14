/* Activity symbols shared by the map markers. */
(function(root){
  'use strict';
  var paths = {
    camp: '<path d="m3 19 9-15 9 15H3Zm9-15v15m-4 0 4-7 4 7"/>',
    hike: '<path d="m3 19 6-11 4 7 3-5 5 9H3ZM8 10l2 2m6 0 2 2"/><circle cx="17" cy="5" r="2"/>',
    surf: '<path d="M3 17c3 3 5 3 8 0s5-3 10 0M3 21c3 2 5 2 8 0s5-2 10 0M5 12c8-1 8-10 14-9-2 2-3 5-2 7 1 2 3 2 4 2"/>',
    food: '<path d="M3 17h18L18 8H6L3 17Zm2 0v4h14v-4M7 7l1-3m4 3V3m5 4-1-3M7 12h.1m5 0h.1m5 0h.1"/>',
    cave: '<path d="m2 20 5-15 6-2 6 7 3 10H2Zm6 0 2-9h4l3 9M8 5l2 3m8 2-3 2"/>',
    waterfall: '<path d="M3 4h8v10m3-10h7M8 4v10m7-10v10M3 19c3-3 5-3 9 0s6 3 9 0M5 23c4-2 8-2 13 0"/>',
    vista: '<path d="m3 17 3-9h4l1 9m2 0 1-9h4l3 9M10 11h4M7 8V4m10 4V4"/><circle cx="7" cy="17" r="4"/><circle cx="17" cy="17" r="4"/>',
    airport: '<path d="m12 2 2 7 8 5v3l-8-2-1 5 3 2H8l3-2-1-5-8 2v-3l8-5 2-7Z"/>',
    city: '<path d="M3 21V9h6V3h8v10h4v8H3Zm6 0V9m8 12v-8M5 12h1m-1 4h1m6-10h2m-2 4h2m-2 4h2m-2 4h2"/>',
    ferry: '<path d="m2 14 4 6h13l3-6H2Zm4 0V7h12v7M9 7V3h6v4M2 23c3-2 6-2 10 0s7 2 10 0"/>',
    walk: '<path d="M7 21c-5-3-3-6 2-8s6-5 1-8M14 21c-2-3 0-5 4-7s4-4 1-7"/>',
    check: '<path d="m5 12 5 5L20 6"/>'
  };
  function icon(activity) {
    var kind = /surf/.test(activity) ? 'surf' : /beach|swim|kayak/.test(activity) ? 'surf' : paths[activity] ? activity : 'walk';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[kind] + '</svg>';
  }
  root.TripIcons={icon:icon};
  if(typeof module==='object' && module.exports)module.exports=root.TripIcons;
})(typeof globalThis!=='undefined'?globalThis:this);

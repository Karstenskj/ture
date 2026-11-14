/* Official MetService widget locations. Town/area forecasts, not campsite measurements. */
(function(root){
  var config={
  "areas": {
    "waipara": {
      "label": "Waipara / North Canterbury",
      "type": "rural",
      "loc": "waipara",
      "url": "https://metservice.com/rural/regions/canterbury-plains/locations/waipara",
      "widget": true
    },
    "timaru": {
      "label": "Timaru",
      "type": "rural",
      "loc": "timaru",
      "url": "https://metservice.com/rural/regions/canterbury-plains/locations/timaru",
      "widget": true
    },
    "twizel": {
      "label": "Twizel",
      "type": "rural",
      "loc": "twizel",
      "url": "https://metservice.com/rural/regions/canterbury-high-country/locations/twizel",
      "widget": true
    },
    "hokitika": {
      "label": "Hokitika",
      "type": "urban",
      "loc": "hokitika",
      "url": "https://metservice.com/towns-cities/regions/westland/locations/hokitika",
      "widget": true
    },
    "franz-josef": {
      "label": "Franz Josef",
      "type": "rural",
      "loc": "franz-josef",
      "url": "https://metservice.com/rural/regions/westland/locations/franz-josef",
      "widget": true
    },
    "greymouth": {
      "label": "Greymouth",
      "type": "urban",
      "loc": "greymouth",
      "url": "https://metservice.com/towns-cities/regions/grey/locations/greymouth",
      "widget": true
    },
    "motueka": {
      "label": "Motueka",
      "type": "urban",
      "loc": "motueka",
      "url": "https://metservice.com/towns-cities/regions/nelson/locations/motueka",
      "widget": true
    },
    "takaka": {
      "label": "Takaka",
      "type": "rural",
      "loc": "takaka",
      "url": "https://metservice.com/rural/regions/nelson/locations/takaka",
      "widget": true
    },
    "blenheim": {
      "label": "Blenheim",
      "type": "urban",
      "loc": "blenheim",
      "url": "https://metservice.com/towns-cities/regions/marlborough/locations/blenheim",
      "widget": true
    },
    "wellington": {
      "label": "Wellington",
      "type": "urban",
      "loc": "wellington",
      "url": "https://metservice.com/towns-cities/regions/wellington/locations/wellington",
      "widget": true
    },
    "wanganui": {
      "label": "Whanganui",
      "type": "urban",
      "loc": "wanganui",
      "url": "https://metservice.com/towns-cities/regions/wanganui/locations/wanganui",
      "widget": true
    },
    "hawera": {
      "label": "Hāwera",
      "type": "rural",
      "loc": "hawera",
      "url": "https://metservice.com/rural/regions/taranaki/locations/hawera",
      "widget": true
    },
    "taupo": {
      "label": "Taupō",
      "type": "urban",
      "loc": "taupo",
      "url": "https://metservice.com/towns-cities/regions/taupo/locations/taupo",
      "widget": true
    },
    "te-kuiti": {
      "label": "Te Kūiti",
      "type": "urban",
      "loc": "te-kuiti",
      "url": "https://metservice.com/towns-cities/regions/waitomo/locations/te-kuiti",
      "widget": true
    },
    "hamilton": {
      "label": "Hamilton",
      "type": "urban",
      "loc": "hamilton",
      "url": "https://metservice.com/towns-cities/regions/waikato/locations/hamilton",
      "widget": true
    },
    "auckland": {
      "label": "Auckland",
      "type": "urban",
      "loc": "auckland",
      "url": "https://metservice.com/towns-cities/regions/auckland/locations/auckland",
      "widget": true
    },
    "port-hills": {
      "label": "Port Hills / Christchurch",
      "type": "urban",
      "loc": "port-hills",
      "url": "https://metservice.com/towns-cities/regions/christchurch/locations/port-hills",
      "widget": true
    },
    "eastern-suburbs": {
      "label": "Christchurchs østlige forstæder / Sumner",
      "type": "urban",
      "loc": "eastern-suburbs",
      "url": "https://metservice.com/towns-cities/regions/christchurch/locations/eastern-suburbs",
      "widget": true
    },
    "kaikoura": {
      "label": "Kaikōura",
      "type": "urban",
      "loc": "kaikoura",
      "url": "https://metservice.com/towns-cities/regions/marlborough/locations/kaikoura",
      "widget": true
    },
    "arthurs-pass": {
      "label": "Arthur’s Pass National Park",
      "url": "https://www.metservice.com/mountains-and-parks/national-parks/arthurs-pass",
      "widget": false
    },
    "nelson-lakes": {
      "label": "Nelson Lakes National Park",
      "url": "https://www.metservice.com/mountains-and-parks/national-parks/nelson-lakes",
      "widget": false
    },
    "tongariro": {
      "label": "Tongariro National Park",
      "url": "https://www.metservice.com/mountains-and-parks/national-parks/tongariro",
      "widget": false
    }
  },
  "camps": [
    "waipara",
    "timaru",
    "twizel",
    "arthurs-pass",
    "hokitika",
    "franz-josef",
    "greymouth",
    "nelson-lakes",
    "motueka",
    "takaka",
    "blenheim",
    "wellington",
    "wanganui",
    "hawera",
    "tongariro",
    "taupo",
    "te-kuiti",
    "hamilton",
    "auckland",
    "port-hills",
    "kaikoura",
    "blenheim",
    "blenheim"
  ]
};
  config.areas.christchurch={label:'Christchurch',type:'urban',loc:'christchurch',url:'https://www.metservice.com/towns-cities/regions/christchurch/locations/christchurch',widget:true};
  root.TripMetService=config;
  if(typeof module==='object' && module.exports)module.exports=config;
})(typeof globalThis!=='undefined'?globalThis:this);

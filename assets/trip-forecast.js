/* Shared daily forecasts. NZ dates, exact-day matching and automatic refresh. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {root.TripForecast = api;api.start(root);}
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var TTL = 30 * 60000, DAY = 86400000;
  var landFields = ['weather_code','temperature_2m_max','temperature_2m_min','precipitation_sum','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max'];
  var seaFields = ['swell_wave_height_max','swell_wave_period_max','swell_wave_direction_dominant'];
  function nzDay(at) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);}
  function addDay(date, n) {return new Date(Date.parse(date+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);}
  function formatDate(date) {return new Intl.DateTimeFormat('da-DK',{timeZone:'UTC',weekday:'short',day:'numeric',month:'short'}).format(new Date(date+'T12:00:00Z')).replace(/\./g,'');}
  function point(value) {
    var p = Array.isArray(value) ? value : String(value).split(',').map(Number);
    if (p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[0])>90 || Math.abs(p[1])>180) return null;
    return p.map(function (v) {return Math.round(v*20)/20;}).join(',');
  }
  function range(date, now) {var today=nzDay(now);return date<today ? 'past' : date>addDay(today,15) ? 'future' : 'inside';}
  function number(v) {return typeof v==='number' && Number.isFinite(v) ? v : null;}
  function row(data,date) {
    var d=data && data.daily, i=d && Array.isArray(d.time) ? d.time.indexOf(date) : -1;
    if (i<0) return null;
    var out={},found=false;
    landFields.concat(seaFields).forEach(function (f) {out[f]=number(d[f] && d[f][i]);if(out[f]!=null)found=true;});
    return found ? out : null;
  }
  function condition(code) {
    if (code==null) return {name:'Vejrtype ukendt',kind:'unknown'};
    if (code===0) return {name:'Sol',kind:'sun'};
    if (code<=2) return {name:'Let skyet',kind:'cloud'};
    if (code===3) return {name:'Overskyet',kind:'cloud'};
    if (code===45 || code===48) return {name:'Tåge',kind:'fog'};
    if ([71,73,75,77,85,86].indexOf(code)>=0) return {name:'Sne',kind:'snow'};
    if (code>=95) return {name:'Tordenbyger',kind:'rain'};
    return {name:code>=80 ? 'Byger' : 'Regn',kind:'rain'};
  }
  function url(kind,points) {
    return (kind==='sea'?'https://marine-api.open-meteo.com/v1/marine':'https://api.open-meteo.com/v1/forecast')+
      '?latitude='+points.map(function(p){return p.split(',')[0];}).join(',')+'&longitude='+points.map(function(p){return p.split(',')[1];}).join(',')+
      '&daily='+(kind==='sea'?seaFields:landFields).join(',')+'&timezone=Pacific%2FAuckland&forecast_days=16'+(kind==='sea'?'':'&wind_speed_unit=ms');
  }
  function createStore(options) {
    options=options||{};
    var cache=new Map(), busy={land:false,sea:false}, retry={land:0,sea:0};
    var clock=options.now||function(){return new Date();}, fetcher=options.fetch||function(u,o){return fetch(u,o);};
    function key(kind,p) {return kind+'/'+point(p);}
    function lookup(kind,p) {var e=cache.get(key(kind,p));return e && +clock()-e.fetched<DAY ? e : null;}
    function stale(kind,p) {var e=lookup(kind,p);return !e || e.day!==nzDay(clock()) || +clock()-e.fetched>=TTL;}
    async function load(kind,points) {
      if(busy[kind] || +clock()<retry[kind])return false;
      var needed=Array.from(new Set(points.map(point).filter(Boolean))).filter(function(p){return stale(kind,p);});
      if(!needed.length)return false;
      busy[kind]=true;var changed=false;
      try {
        for(var start=0;start<needed.length;start+=16) {
          var group=needed.slice(start,start+16), abort=typeof AbortController!=='undefined'?new AbortController():null;
          var timer=abort?setTimeout(function(){abort.abort();},8000):null;
          try {
            var response=await fetcher(url(kind,group),abort?{signal:abort.signal}:{});
            if(!response.ok)throw new Error('Weather HTTP '+response.status);
            var payload=await response.json();payload=Array.isArray(payload)?payload:[payload];
            group.forEach(function(p,i){var d=payload[i];if(d && !d.error && d.daily && Array.isArray(d.daily.time)) {
              cache.set(key(kind,p),{data:d,fetched:+clock(),day:nzDay(clock())});changed=true;
            } else retry[kind]=+clock()+60000;});
          } catch(error) {retry[kind]=+clock()+60000;break;}
          finally {if(timer)clearTimeout(timer);}
        }
        while(cache.size>128)cache.delete(cache.keys().next().value);
        return changed;
      } finally {busy[kind]=false;}
    }
    return {lookup:lookup,stale:stale,load:load};
  }
  function icon(kind) {
    var paths={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',cloud:'<path d="M5 19h13a4 4 0 0 0 0-8 6 6 0 0 0-11-1 5 5 0 0 0-2 9Z"/>',rain:'<path d="M5 14h13a4 4 0 0 0 0-8 6 6 0 0 0-11-1 5 5 0 0 0-2 9M7 17l-1 4m7-4-1 4m7-4-1 4"/>',snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 3 4-3M8 20l4-3 4 3"/>',fog:'<path d="M3 7h18M1 12h17M5 17h18"/>',unknown:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/>'};
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[kind]+'</svg>';
  }
  function start(win) {
    var doc=win.document, store=createStore(), queued=null, timer=null, loading=false;
    function stamp(at) {return new Intl.DateTimeFormat('da-DK',{timeZone:'Pacific/Auckland',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);}
    function decimal(n) {return n==null?'—':String(Math.round(n*10)/10).replace('.',',');}
    function metric(n,suffix) {return n==null?'—':Math.round(n)+suffix;}
    function chip(cls,text) {var s=doc.createElement('span');s.className='chip'+(cls?' '+cls:'');s.textContent=text;return s;}
    function renderOne(el) {
      var date=el.dataset.date, now=new Date(), status=range(date,now), detailed=el.hasAttribute('data-wx-detailed');
      var entry=store.lookup('land',el.dataset.wx), d=entry && row(entry.data,date), message='';
      if(status==='future')message='Prognose fra ca. '+formatDate(addDay(date,-15));
      else if(status==='past')message='Opholdet er passeret · ingen aktuel prognose';
      else if(!d)message=win.navigator.onLine===false?'Offline · vejret hentes automatisk, når du er online':'Prognose mangler lige nu · prøver automatisk igen';
      if(message) {el.replaceChildren(chip('wait',message));el.dataset.wxState=status==='inside'?'missing':status;return;}
      var weather=condition(d.weather_code), stale=store.stale('land',el.dataset.wx), offline=win.navigator.onLine===false;
      el.dataset.wxState=stale?'stale':'ready';
      if(detailed) {
        el.innerHTML='<div class="camp-wx-condition">'+icon(weather.kind)+'<b>'+weather.name+'</b><strong>'+metric(d.temperature_2m_max,'°')+' <small>/ '+metric(d.temperature_2m_min,'°')+'</small></strong></div><div class="camp-wx-metrics"><span>Nedbør <b>'+decimal(d.precipitation_sum)+' mm</b></span><span>Nedbørsrisiko <b>'+metric(d.precipitation_probability_max,'%')+'</b></span><span>Vind op til <b>'+metric(d.wind_speed_10m_max,' m/s')+'</b></span><span>Vindstød <b>'+metric(d.wind_gusts_10m_max,' m/s')+'</b></span></div><small class="camp-wx-updated">'+(offline?'Offline · ':'')+'Hentet '+stamp(new Date(entry.fetched))+(stale?' · afventer ny prognose':'')+'</small>';
      } else {
        el.replaceChildren(chip('',metric(d.temperature_2m_max,'°')+' / '+metric(d.temperature_2m_min,'°')),chip('wind','vind '+metric(d.wind_speed_10m_max,' m/s')),chip(d.precipitation_sum>=1?'wet':'','nedbør '+decimal(d.precipitation_sum)+' mm'));
        var sea=store.lookup('sea',el.dataset.sea), waves=sea && row(sea.data,date);
        if(waves && waves.swell_wave_height_max!=null)el.appendChild(chip('','bølger '+decimal(waves.swell_wave_height_max)+' m · '+metric(waves.swell_wave_period_max,' s')+(waves.swell_wave_direction_dominant==null?'':' · fra '+['N','NØ','Ø','SØ','S','SV','V','NV'][Math.round(waves.swell_wave_direction_dominant/45)%8])));
        if(stale || offline)el.appendChild(chip('wait',(offline?'Offline · ':'')+'hentet '+stamp(new Date(entry.fetched))));
        el.title='Open-Meteo · dagsprognose · hentet '+stamp(new Date(entry.fetched));
      }
    }
    function elements() {return Array.from(doc.querySelectorAll('[data-wx][data-date]'));}
    function render() {
      elements().forEach(renderOne);
      var st=doc.getElementById('wx-stamp');if(st)st.textContent='Open-Meteo · prognoser opdateres automatisk hver halve time, mens siden er åben. Alle tider er NZ-tid.';
    }
    async function refresh() {
      render();if(doc.hidden || loading || win.navigator.onLine===false)return;
      var eligible=elements().filter(function(el){return range(el.dataset.date,new Date())==='inside';});
      loading=true;
      try {await Promise.allSettled(['land','sea'].map(function(kind){return store.load(kind,eligible.map(function(el){return el.getAttribute(kind==='land'?'data-wx':'data-sea');}).filter(Boolean));}));}
      finally {loading=false;render();}
    }
    function mount() {render();if(!queued)queued=setTimeout(function(){queued=null;refresh();},100);}
    function resume() {if(timer)clearInterval(timer);timer=null;if(!doc.hidden){mount();timer=setInterval(refresh,60000);}}
    doc.addEventListener('visibilitychange',resume);win.addEventListener('online',mount);win.addEventListener('offline',render);
    win.addEventListener('pagehide',function(){if(timer)clearInterval(timer);if(queued)clearTimeout(queued);timer=queued=null;});
    win.addEventListener('pageshow',resume);api.mount=mount;resume();
  }
  var api={nzDay:nzDay,addDay:addDay,formatDate:formatDate,point:point,range:range,row:row,condition:condition,url:url,createStore:createStore,start:start};
  return api;
});

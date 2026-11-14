/* The map's weather is an illustration of model data; daylight is computed locally. */
(function () {
  'use strict';
  var W = window.TripWeather;
  if (!W) return;
  var phaseLabels = {day:'Dagslys',morning:'Morgenlys',evening:'Aftenlys',dawn:'Daggry',dusk:'Skumring',night:'Nat'};
  var conditions = {clear:'Klart',cloudy:'Let skyet',overcast:'Overskyet',rain:'Regn',snow:'Sne',fog:'Tåge',unknown:'Skydække ukendt'};
  var palette = {sun:'#ffe6a0',sunEdge:'#fff8d8',cloud:'#e0e9ec',cloudDark:'#7592a2',stars:'#ecf5ff',rain:'#c7e8fa',wind:'#f1f8ff'};
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function (c) {return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function hh(at, zone, full) {
    return new Intl.DateTimeFormat('da-DK',Object.assign({timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'},full ? {day:'numeric',month:'short'} : {})).format(at);
  }
  function weatherIcon(env) {
    var path = env.rain ? '<path d="M5 13h13a4 4 0 0 0 0-8 6 6 0 0 0-11-1 5 5 0 0 0-2 9M7 16l-1 4m7-4-1 4m7-4-1 4"/>' : env.condition === 'clear' && env.solar.phase !== 'night' ? '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>' : env.solar.phase === 'night' && env.cloud != null && env.cloud < 40 ? '<path d="M18 3A9 9 0 1 0 21 17 9 9 0 0 1 18 3Z"/>' : '<path d="M5 18h13a4 4 0 0 0 0-8 6 6 0 0 0-11-1 5 5 0 0 0-2 9Z"/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }
  function summary(env, at) {
    if (!env.weather) return phaseLabels[env.solar.phase] + ' · ' + (!W.inRange(at,new Date()) ? (+at > Date.now() ? 'prognose ikke klar endnu' : 'vejrdata ikke tilgængelige') : 'vejrdata mangler');
    var label = env.condition === 'clear' && env.sun > 0 ? 'Sol' : conditions[env.condition];
    return phaseLabels[env.solar.phase] + ' · ' + label + (env.weather.temperature_2m != null ? ' · ' + Math.round(env.weather.temperature_2m) + '°' : '') + (env.wind != null ? ' · ' + Math.round(env.wind) + ' m/s' : '');
  }
  function create(options) {
    var map = options.map, box = options.box, host = map.getContainer(), reduced = options.reducedMotion;
    var store = W.createStore(), wanted = null, weatherTimer = null, context = null, main = null, currentEnvs = null;
    var frame = null, lastDraw = 0, width = 0, height = 0, dpi = Math.min(1.5,window.devicePixelRatio || 1);
    var layer = document.createElement('div'); layer.className = 'rk-atmosphere'; layer.setAttribute('aria-hidden','true');
    layer.innerHTML = '<div class="rk-weather-night"></div><div class="rk-weather-golden"></div><div class="rk-weather-cloudshade"></div><div class="rk-weather-fog"></div><canvas></canvas>';
    host.appendChild(layer); var canvas = layer.querySelector('canvas'), ctx = canvas.getContext('2d');
    var badge = document.createElement('button'); badge.type = 'button'; badge.className = 'rk-weather-status'; badge.setAttribute('aria-label','Vejr og dagslys'); options.hud.appendChild(badge);
    box.classList.add('rk-weather-ready');
    function resize() {
      width = host.clientWidth; height = host.clientHeight;
      canvas.width = Math.round(width * dpi); canvas.height = Math.round(height * dpi);
      if (ctx) ctx.setTransform(dpi,0,0,dpi,0,0);
      renderCanvas(0); syncMotion();
    }
    function inNZ(ll) {return ll && ll[0] >= -48 && ll[0] <= -33 && ll[1] >= 165 && ll[1] <= 180;}
    function visible() {
      var pane = box.closest('#kort');
      if (!main || !main.enabled || document.hidden || (pane && pane.hidden) || !(map.getZoom() >= 7) || !width || !height) return false;
      var center = map.getCenter();return inNZ([center.lat,center.lng]);
    }
    function stop() {if (frame) cancelAnimationFrame(frame);frame = null;}
    function animate() {
      return main && !reduced.matches && (main.rain || main.snow || main.stars > 0 || (main.wind != null && main.wind >= 2.5) || (main.cloud > 15 && main.wind > .5));
    }
    function syncMotion() {
      var on = !!visible(); layer.hidden = !on;
      if (!on || !animate()) {stop();if (on) renderCanvas(0);return;}
      if (frame) return;
      function tick(stamp) {
        if (!visible() || !animate()) {stop();return;}
        if (stamp - lastDraw >= 1000/24) {lastDraw = stamp;renderCanvas(stamp/1000);}
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }
    function dotSeed(i, salt) {return ((Math.sin(i * 127.1 + salt * 311.7) * 43758.5453) % 1 + 1) % 1;}
    function cloud(x,y,r,opacity) {
      ctx.globalAlpha = opacity;
      [[x,y,r*1.8,r*.5],[x-r*.5,y-r*.25,r*.85,r*.6],[x+r*.3,y-r*.35,r*.9,r*.65]].forEach(function (blob) {
        ctx.save();ctx.translate(blob[0],blob[1]);ctx.scale(blob[2],blob[3]);
        var haze = ctx.createRadialGradient(0,0,.1,0,0,1);
        haze.addColorStop(0,main.solar.darkness > .4 ? palette.cloudDark : palette.cloud);haze.addColorStop(1,'transparent');
        ctx.fillStyle = haze;ctx.fillRect(-1,-1,2,2);ctx.restore();
      });
    }
    function renderCanvas(seconds) {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0,0,width,height); if (!main) return;
      ctx.save();
      if (main.stars > 0) {
        ctx.fillStyle = palette.stars;
        for (var i=0;i<42;i++) {
          ctx.globalAlpha = main.stars * (.3 + dotSeed(i,3)*.45) * (reduced.matches ? 1 : .9 + .1*Math.sin(seconds*.5+i));
          ctx.beginPath();ctx.arc(dotSeed(i,1)*width,dotSeed(i,2)*height*.65,.6+dotSeed(i,4)*1.1,0,Math.PI*2);ctx.fill();
        }
      }
      if (main.sun > 0) {
        var x = width * (main.solar.rising ? .2 : .8), y = Math.min(112,height*.18), r = 54;
        var halo = ctx.createRadialGradient(x,y,6,x,y,r);halo.addColorStop(0,palette.sun);halo.addColorStop(1,'transparent');
        ctx.globalAlpha = main.sun*.35;ctx.fillStyle = halo;ctx.fillRect(x-r,y-r,r*2,r*2);
        ctx.globalAlpha = main.sun*.65;ctx.fillStyle = palette.sunEdge;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();
      }
      var wind = main.wind || 0, direction = main.windDirection == null ? 270 : main.windDirection;
      var drift = -Math.sin(direction*Math.PI/180) * Math.min(wind,18);
      var verticalDrift = Math.cos(direction*Math.PI/180) * Math.min(wind,18);
      if (main.cloud != null && main.cloud > 10) {
        var count = Math.ceil(main.cloud/22);
        for (var c=0;c<count;c++) {
          var cx = ((dotSeed(c,10)*(width+180)+seconds*drift*.9+90) % (width+180) + width+180) % (width+180) - 90;
          var skyHeight = Math.min(height*.28,180) + 100;
          var cy = ((dotSeed(c,12)*skyHeight+seconds*verticalDrift*.3) % skyHeight+skyHeight)%skyHeight-10;
          cloud(cx,cy,45+dotSeed(c,13)*35,.12+main.cloud/100*.24);
        }
      }
      if (main.rain || main.snow) {
        var n = main.snow ? 25 : Math.min(60,22 + Math.round((main.rainAmount || .1)*8));
        ctx.strokeStyle = palette.rain;ctx.fillStyle = palette.stars;ctx.lineWidth = 1.2;ctx.globalAlpha = main.snow ? .6 : .43;
        for (var p=0;p<n;p++) {
          var speed = main.snow ? 20+dotSeed(p,17)*15 : 230+dotSeed(p,17)*140;
          var py = (dotSeed(p,16)*(height+50) + seconds*speed) % (height+50)-25;
          var px = ((dotSeed(p,15)*(width+100)+seconds*drift*8+50) % (width+100) + width+100) % (width+100)-50;
          if (main.snow) {ctx.beginPath();ctx.arc(px+Math.sin(seconds+p)*4,py,1+dotSeed(p,18)*1.8,0,Math.PI*2);ctx.fill();}
          else {ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+drift*.7,py+12+Math.min(wind,15));ctx.stroke();}
        }
      }
      if (wind >= 2.5) {
        ctx.strokeStyle = palette.wind;ctx.lineWidth = 1.2;ctx.globalAlpha = Math.min(.27,wind/45);
        for (var b=0;b<5;b++) {
          var bx = ((dotSeed(b,20)*(width+200)+seconds*drift*12+100) % (width+200)+width+200)%(width+200)-100;
          var by = ((height*(.25+dotSeed(b,21)*.55)+seconds*verticalDrift*12) % (height+100)+height+100)%(height+100)-50;
          ctx.save();ctx.translate(bx,by);ctx.rotate((direction+90)*Math.PI/180);
          ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(30,-9,65,0);ctx.stroke();ctx.restore();
        }
      }
      ctx.restore();
    }
    function queue(points, at) {
      wanted = {points:points,at:at};
      var pane = box.closest('#kort');
      if (weatherTimer || document.hidden || (pane && pane.hidden) || !W.inRange(at,new Date()) || !points.length) return;
      weatherTimer = setTimeout(async function () {
        weatherTimer = null;
        var pending = wanted;
        if (!pending || document.hidden) return;
        var changed = await store.load(pending.points,pending.at);
        if (changed && !document.hidden) options.onChange();
      },Math.max(700,store.delay()));
    }
    function environment(target, at) {return W.state(at,target.ll,target.weatherAllowed === false ? null : store.lookup(target.ll,at),target.zone);}
    function paintActor(element, env) {
      if (!element || !env) return;
      element.dataset.weatherPhase = env.solar.phase;
      element.style.setProperty('--actor-brightness',env.brightness.toFixed(3));
      element.style.setProperty('--tent-light',env.tentLight.toFixed(3));
      element.style.setProperty('--breeze-angle',Math.min(8,(env.wind || 0)*.65).toFixed(2)+'deg');
      element.style.setProperty('--breeze-duration',Math.max(1.6,5-(env.wind || 0)*.18).toFixed(2)+'s');
    }
    function update(value) {
      context = value; if (!value.current) return {};
      var at = value.at, primary = {ll:value.current.ll,zone:'Pacific/Auckland',label:value.current.solo ? 'Karsten' : 'Karsten & Helena'};
      // Australia and the flight retain their original scenes, without new weather effects.
      var away = value.focused === 'helena' && value.helena && value.helena.phase !== 'joined';
      var display = value.point && inNZ(value.point) ? {ll:value.point,zone:'Pacific/Auckland',label:'Det valgte sted'} : primary;
      main = environment(display,at);main.target = display;
      main.enabled = value.point ? inNZ(value.point) : !away;
      currentEnvs = {primary:environment(primary,at),secondary:null};
      var pending = [primary,display].filter(function (t) {return inNZ(t.ll) && store.stale(t.ll,at);}).map(function (t) {return t.ll;});
      queue(pending,at);
      badge.hidden = !main.enabled;
      layer.dataset.phase = main.solar.phase;
      layer.style.setProperty('--night-strength',main.solar.darkness.toFixed(3));
      layer.style.setProperty('--golden-strength',(main.solar.golden*(main.cloud == null ? .2 : 1-main.cloud/100)*.22).toFixed(3));
      layer.style.setProperty('--cloud-strength',(main.cloud == null ? 0 : main.cloud/100*.17).toFixed(3));
      layer.style.setProperty('--fog-strength',main.fog ? '.22' : '0');
      var description = display.weatherAllowed === false ? phaseLabels[main.solar.phase] + ' langs den anslåede flyrute' : summary(main,at);
      var sourceLabel = main.weather ? 'Open-Meteo · ' + (main.weather.source === 'model' ? 'modeldata' : 'prognose') : 'beregnet dagslys';
      badge.innerHTML = weatherIcon(main) + '<span>' + safe(description) + '<small>' + safe(display.label + ' · ' + hh(at,display.zone,true)) + ' · ' + sourceLabel + '</small></span>';
      badge.title = description + '. ' + (main.weather ? 'Områdets vejrmodel og prognose, ikke en måling på stedet.' : 'Vejreffekter vises kun, når data er tilgængelige.');
      renderCanvas(reduced.matches ? 0 : performance.now()/1000);syncMotion();
      return currentEnvs;
    }
    function details() {
      if (!main || !context) return;
      var env = main, at = context.at, target = env.target, wx = env.weather, facts = [];
      facts.push(['Tid og sted',target.label + ' · ' + hh(at,target.zone,true)]);
      facts.push(['Stemning',summary(env,at)]);
      facts.push(['Solopgang',env.solar.sunrise ? 'ca. ' + hh(env.solar.sunrise,target.zone) : 'Ingen solopgang denne dag']);
      facts.push(['Solnedgang',env.solar.sunset ? 'ca. ' + hh(env.solar.sunset,target.zone) : 'Ingen solnedgang denne dag']);
      if (wx && wx.cloud_cover != null) facts.push(['Skydække',Math.round(wx.cloud_cover) + ' %']);
      if (wx && wx.precipitation != null) facts.push(['Nedbør',wx.precipitation + ' mm i modellens tidsinterval']);
      if (wx && wx.wind_gusts_10m != null) facts.push(['Vindstød',Math.round(wx.wind_gusts_10m) + ' m/s']);
      var html = '<div class="rk-body"><h3>Vejr og dagslys</h3><dl class="spot-facts">' + facts.map(function (f) {return '<div class="wide"><dt>' + safe(f[0]) + '</dt><dd>' + safe(f[1]) + '</dd></div>';}).join('') + '</dl><p>' +
        (wx ? 'Vejret følger Open-Meteos modeldata og prognoser for området og det valgte tidspunkt. Det er ikke en live vejrmåling ved bilen. Dagslyset er beregnet for sted og dato.' : 'Dagslyset er beregnet for sted og dato. Der er ingen vejrdata for dette tidspunkt lige nu, så kortet viser ingen antagede skyer, regn eller stjerner.') + '</p><div class="links"><a class="pin" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Vejrdata · Open-Meteo</a><a class="pin" href="https://github.com/mourner/suncalc" target="_blank" rel="noopener noreferrer">Solberegning · SunCalc</a></div></div>';
      options.open(html,target.ll);
    }
    badge.addEventListener('click',function (event) {event.stopPropagation();details();});
    map.on('resize',resize);map.on('zoomend moveend',syncMotion);
    window.addEventListener('hashchange',function () {requestAnimationFrame(function () {syncMotion();var pane = box.closest('#kort');if (!pane || !pane.hidden) options.onChange();});});
    document.addEventListener('visibilitychange',function () {if (document.hidden) {stop();if (weatherTimer) clearTimeout(weatherTimer);weatherTimer = null;} else syncMotion();});
    reduced.addEventListener('change',function () {renderCanvas(0);syncMotion();});
    window.addEventListener('pagehide',function () {stop();if (weatherTimer) clearTimeout(weatherTimer);weatherTimer = null;});
    resize();
    return {update:update,paintActor:paintActor,details:details};
  }
  window.TripAtmosphere = {create:create};
})();

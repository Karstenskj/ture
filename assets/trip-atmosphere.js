/* Local daylight and rooftop-tent light. Forecasts are the official MetService embeds. */
(function(){
  'use strict';
  var W=window.TripWeather,F=window.TripForecast;if(!W || !F)return;
  var phases={day:'Dagslys',morning:'Morgenlys',evening:'Aftenlys',dawn:'Daggry',dusk:'Skumring',night:'Nat'};
  function safe(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function hh(at){return new Intl.DateTimeFormat('da-DK',{timeZone:'Pacific/Auckland',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);}
  function inNZ(ll){return ll && ll[0]>=-48 && ll[0]<=-33 && ll[1]>=165 && ll[1]<=180;}
  function create(options){
    var map=options.map,box=options.box,main=null,context=null;
    var layer=document.createElement('div');layer.className='rk-atmosphere';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="rk-weather-night"></div><div class="rk-weather-golden"></div>';map.getContainer().appendChild(layer);
    var badge=document.createElement('button');badge.type='button';badge.className='rk-weather-status';badge.setAttribute('aria-label','MetService og dagslys');options.hud.appendChild(badge);
    box.classList.add('rk-weather-ready');
    function sync(){
      var pane=box.closest('#kort');
      var on=main && main.enabled && !document.hidden && (!pane || !pane.hidden) && map.getZoom()>=7;
      if(on){var c=map.getCenter();on=inNZ([c.lat,c.lng]);}layer.hidden=!on;
    }
    function paintActor(el,env){
      if(!el || !env)return;
      el.dataset.weatherPhase=env.solar.phase;el.style.setProperty('--actor-brightness',env.brightness.toFixed(3));el.style.setProperty('--tent-light',env.tentLight.toFixed(3));
      el.style.setProperty('--breeze-angle','0deg');
    }
    function update(value){
      context=value;if(!value.current)return {};
      var at=value.at,primary=W.state(at,value.current.ll,null,'Pacific/Auckland');
      var ll=value.point && inNZ(value.point)?value.point:value.current.ll;
      main=W.state(at,ll,null,'Pacific/Auckland');main.ll=ll;main.area=F.forPoint(ll);
      var away=value.focused==='helena' && value.helena && value.helena.phase!=='joined';main.enabled=value.point?inNZ(value.point):!away;
      layer.dataset.phase=main.solar.phase;layer.style.setProperty('--night-strength',main.solar.darkness.toFixed(3));layer.style.setProperty('--golden-strength',(main.solar.golden*.12).toFixed(3));
      badge.hidden=!main.enabled;badge.innerHTML='<span><b>Vejr · MetService</b><small>'+safe(phases[main.solar.phase]+' · '+hh(at)+' · beregnet dagslys')+'</small></span>';
      badge.title='Åbn MetServices prognose for '+main.area.label+'. Dagslyset er beregnet lokalt for sted og dato.';
      sync();return {primary:primary,secondary:null};
    }
    function details(){
      if(!main || !context)return;
      var light=main.solar;
      var html='<div class="rk-body"><h3>Vejr og dagslys</h3>'+F.panel(main.area,[])+'<details class="camp-more"><summary>Solopgang og solnedgang</summary><dl class="spot-facts"><div><dt>Solopgang</dt><dd>'+safe(light.sunrise?hh(light.sunrise):'Ingen denne dag')+'</dd></div><div><dt>Solnedgang</dt><dd>'+safe(light.sunset?hh(light.sunset):'Ingen denne dag')+'</dd></div></dl><p class="metservice-note">Soltider og lys i tagteltet beregnes lokalt for sted og dato. Vejret vises direkte fra MetService.</p></details></div>';
      options.open(html,main.ll);
    }
    badge.addEventListener('click',function(e){e.stopPropagation();details();});map.on('resize zoomend moveend',sync);document.addEventListener('visibilitychange',sync);
    window.addEventListener('hashchange',function(){requestAnimationFrame(function(){sync();options.onChange();});});
    sync();return {update:update,paintActor:paintActor,details:details};
  }
  window.TripAtmosphere={create:create};
})();

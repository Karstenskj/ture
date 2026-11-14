/* Official MetService embeds. Provider data stays inside the unmodified widget. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else {root.TripForecast=api;api.configure(root.TripMetService);api.start(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var config=null,points=[],TTL=30*60000;
  function configure(value,bases){config=value;points=bases||points;}
  function nzDay(at){return new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);}
  function addDay(date,n){return new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
  function formatDate(date){return new Intl.DateTimeFormat('da-DK',{timeZone:'UTC',weekday:'short',day:'numeric',month:'short'}).format(new Date(date+'T12:00:00Z')).replace(/\./g,'');}
  function escape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function distance(a,b){var rad=Math.PI/180;return Math.hypot(a[0]-b[0],(a[1]-b[1])*Math.cos(a[0]*rad));}
  function report(id){return config && config.areas[id] ? Object.assign({id:id},config.areas[id]) : null;}
  function forCamp(index){return report(config.camps[index]);}
  function forPoint(ll){
    ll=Array.isArray(ll)?ll:String(ll).split(',').map(Number);
    if(ll.length!==2 || !ll.every(Number.isFinite))return report('christchurch');
    if(distance(ll,[-43.56794,172.76184])<.018)return report('eastern-suburbs');
    var nearest=0,best=Infinity;
    points.forEach(function(base,i){var d=distance(ll,base.ll);if(d<best){best=d;nearest=i;}});
    return forCamp(nearest);
  }
  function windowState(dates,now){
    var today=nzDay(now),end=addDay(today,2);
    if(!dates.length)return {kind:'ready',until:end};
    var sorted=dates.slice().sort();
    if(sorted[sorted.length-1]<today)return {kind:'past'};
    if(sorted[0]>end)return {kind:'future',from:addDay(sorted[0],-2)};
    return {kind:'ready',until:end,partial:sorted.some(function(d){return d>end;})};
  }
  function widgetURL(area){
    if(!area || !area.widget)return null;
    return 'https://services.metservice.com/weather-widget/widget?params=white%7Cmedium%7Cportrait%7Cdays-3%7Cmodern&loc='+encodeURIComponent(area.loc)+'&type='+encodeURIComponent(area.type);
  }
  function panel(area,dates){
    return '<div class="metservice-panel" data-metservice="'+escape(area.id)+'" data-metservice-dates="'+escape((dates||[]).join(','))+'"></div>';
  }
  function content(area,dates,now){
    var state=windowState(dates,now),html='<div class="metservice-heading"><b>MetService</b><span>'+escape(area.label)+'</span></div>';
    html+='<p class="metservice-area">Områdeprognose for '+escape(area.label)+'. Prognosestedet er ikke en måling på campingpladsen.</p>';
    if(state.kind==='future')html+='<p class="metservice-wait">Jeres datoer er endnu ikke i MetServices 3-døgnsvisning. Visningen kan komme med fra ca. '+formatDate(state.from)+'.</p>';
    else if(state.kind==='past')html+='<p class="metservice-wait">Opholdet er passeret. Linket nedenfor viser MetServices aktuelle prognose.</p>';
    else if(area.widget){
      html+='<p class="metservice-period">MetServices næste tre dage'+(state.partial?' · nogle af jeres datoer ligger længere fremme':'')+'</p>';
      html+='<div class="metservice-widget-shell"><iframe class="metservice-widget" title="MetService: '+escape(area.label)+' · næste tre dage" width="300" height="245" loading="lazy" allowtransparency="true" data-widget-src="'+escape(widgetURL(area))+'" style="border:none"></iframe></div>';
    }else html+='<p class="metservice-wait">Dette område vises i MetServices fulde bjerg- og parkprognose.</p>';
    html+='<a class="metservice-link" href="'+escape(area.url)+'" target="_blank" rel="noopener noreferrer">Åbn MetService · '+escape(area.label)+'</a>';
    html+='<small class="metservice-note">Prognosen kommer direkte fra MetService. Den indbyggede visning genindlæses automatisk hver halve time. Senere datoer bliver vist, når de er med i prognosen.</small>';
    return html;
  }
  function start(win){
    var doc=win.document,source=doc.getElementById('rk-data'),timer=null;
    if(source)points=JSON.parse(source.textContent).bases;
    function refresh(){
      var now=new Date();
      doc.querySelectorAll('[data-metservice]').forEach(function(el){
        var area=report(el.dataset.metservice);if(!area)return;
        var dates=(el.dataset.metserviceDates||'').split(',').filter(Boolean),state=windowState(dates,now);
        var key=area.id+'/'+nzDay(now)+'/'+state.kind+'/'+!!state.partial;
        if(el.dataset.metserviceRendered!==key){el.innerHTML=content(area,dates,now);el.dataset.metserviceRendered=key;}
        var frame=el.querySelector('iframe');
        if(frame){
          var scale=Math.min(1,frame.parentElement.clientWidth/300)||1;
          frame.style.transform='scale('+scale+')';frame.parentElement.style.height=(245*scale)+'px';
        }
        if(frame && !doc.hidden && win.navigator.onLine!==false && el.getClientRects().length && (!frame.dataset.loadedAt || +now-Number(frame.dataset.loadedAt)>=TTL)){
          frame.src=frame.dataset.widgetSrc;frame.dataset.loadedAt=String(+now);
        }
      });
      doc.querySelectorAll('[data-wx][data-date]').forEach(function(el){
        var area=forPoint(el.dataset.wx),state=windowState([el.dataset.date],now);
        el.innerHTML='<a class="chip metservice-compact" href="'+escape(area.url)+'" target="_blank" rel="noopener noreferrer">MetService · '+escape(area.label)+'</a>'+(state.kind==='future'?'<span class="chip wait">'+formatDate(el.dataset.date)+' · datoen er ikke i 3-døgnsvisningen endnu</span>':'');
        if(el.dataset.sea)el.insertAdjacentHTML('beforeend','<a class="chip" href="https://www.metservice.com/marine" target="_blank" rel="noopener noreferrer">MetService · hav og bølger</a>');
      });
      var stamp=doc.getElementById('wx-stamp');if(stamp)stamp.textContent='Vejret vises direkte fra MetService. Den indbyggede 3-døgnsvisning genindlæses automatisk hver halve time.';
    }
    function resume(){if(timer)clearInterval(timer);timer=null;if(!doc.hidden){refresh();timer=setInterval(refresh,60000);}}
    api.mount=refresh;doc.addEventListener('visibilitychange',resume);win.addEventListener('online',refresh);win.addEventListener('pageshow',resume);
    win.addEventListener('hashchange',function(){win.requestAnimationFrame(refresh);});
    win.addEventListener('resize',function(){win.requestAnimationFrame(refresh);});
    doc.addEventListener('toggle',function(){win.requestAnimationFrame(refresh);},true);
    win.addEventListener('pagehide',function(){if(timer)clearInterval(timer);timer=null;});resume();
  }
  var api={configure:configure,nzDay:nzDay,addDay:addDay,formatDate:formatDate,forCamp:forCamp,forPoint:forPoint,report:report,windowState:windowState,widgetURL:widgetURL,panel:panel,content:content,start:start};
  return api;
});

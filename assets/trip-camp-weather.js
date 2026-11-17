/* Camp dates come from the itinerary, never from today's estimated position. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else {root.TripCampWeather=api;api.start(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function next(date){return new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);}
  function plan(data){
    return data.bases.map(function(base,index){
      if(!base.camp)return null;
      var actual=data.locationPlan.days.filter(function(d){return d.stay.name===base.name;}).map(function(d){return d.date;});
      var possible=(base.weatherDates||[]).filter(function(d){return actual.indexOf(d)<0;});
      var nights=Array.from(new Set(actual.concat(possible))).sort();
      if(!nights.length)return null;
      var days=nights.map(function(date){return {date:date,kind:possible.indexOf(date)>=0?'possible':date===actual[0]?'arrival':'stay'};});
      var end=next(nights[nights.length-1]);days.push({date:end,kind:'departure'});
      return {index:index,days:days,optional:!!base.optional};
    }).filter(Boolean);
  }
  function escape(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function block(base,entry,F){
    var labels={arrival:'Ankomst',stay:'Ophold',possible:'Mulig nat',departure:'Afrejse'};
    return '<section class="camp-weather" aria-label="Vejret under opholdet"><h4>Vejr fra MetService</h4><div class="metservice-stay-dates">'+entry.days.map(function(day){
      return '<span><b>'+F.formatDate(day.date)+'</b> · '+labels[day.kind]+'</span>';
    }).join('')+'</div>'+F.panel(F.forCamp(entry.index),entry.days.map(function(day){return day.date;}))+'</section>';
  }
  function start(win){
    var source=win.document.getElementById('rk-data'),F=win.TripForecast;if(!source || !F)return;
    var data=JSON.parse(source.textContent),cards=Array.from(win.document.querySelectorAll('article.spot'));
    plan(data).forEach(function(entry){
      var base=data.bases[entry.index],weather=block(base,entry,F);
      var card=base.anchor && win.document.getElementById(base.anchor);
      if(!card)card=cards.find(function(c){var h=c.querySelector('h3');return h && h.textContent.trim()===base.name;});
      if(card && !card.querySelector('.camp-weather')) {
        var body=card.querySelector('.spot-body');if(body)body.insertAdjacentHTML('beforeend','<details class="camp-more"><summary>Vejr under opholdet</summary>'+weather+'</details>');
      }
      var old=win.document.createElement('div');old.innerHTML=base.html;
      var price=Array.from(old.querySelectorAll('dt')).find(function(d){return /^Pris/.test(d.textContent.trim());});
      price=price && price.parentElement.querySelector('dd');
      var status=base.optional?'Måske':base.booking?'Booket':base.bookingRequired===false?'Gratis':'På ruten';
      var photos=Array.from(old.querySelectorAll('figure')).map(function(figure){var html=figure.outerHTML;figure.remove();return html;}).join('');
      var content=old.querySelector('.rk-body') || old;
      Array.from(content.querySelectorAll('h3, .rk-sub, .sl')).forEach(function(el){el.remove();});
      Array.from(content.querySelectorAll('.booking-status')).forEach(function(el){var parent=el.parentElement;el.remove();if(!parent.textContent.trim())parent.remove();});
      var priceText=price && price.textContent.length<75?price.textContent:'';
      if(priceText)price.parentElement.remove();
      base.html='<div class="rk-body rk-camp-detail"><span class="rk-sub">'+escape(base.label)+'</span><h3>'+escape(base.name)+'</h3><div class="camp-wx-booking"><span class="tag'+(base.booking?' k':'')+'">'+status+'</span>'+(priceText?'<span>'+escape(priceText)+'</span>':'')+(base.shower===true?'<span class="camp-shower-label">'+(win.TripIcons?win.TripIcons.icon('shower'):'')+'Brusebad</span>':'')+'</div><div class="camp-summary">'+content.innerHTML+'</div><details class="camp-more"><summary>Vejr under opholdet</summary>'+weather+'</details>'+(photos?'<details class="camp-more"><summary>Billeder</summary>'+photos+'</details>':'')+'</div>';
    });
    source.textContent=JSON.stringify(data);F.mount();
  }
  return {plan:plan,block:block,start:start};
});

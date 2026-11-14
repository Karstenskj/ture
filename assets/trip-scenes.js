/* The couple's small illustrated world. Motion is added in CSS, not GIFs. */
(function (root) {
  'use strict';
  var assets = '../assets/trip-world/';
  var labels = { camp: 'hygger på campingpladsen', sleep: 'sover i tagteltet', 'solo-sleep': 'sover i tagteltet', hike: 'er på vandretur',
    surf: 'surfer', cave: 'går på opdagelse i en grotte', waterfall: 'besøger et vandfald',
    beach: 'nyder stranden', city: 'går en tur i byen', walk: 'er ude at opleve', vista: 'nyder udsigten',
    airport: 'mødes i lufthavnen', ferry: 'sejler mod Wellington', swim: 'nyder vandet', kayak: 'er på vandet',
    helena: 'er i Brisbane', flight: 'flyver mod Christchurch', drive: 'er på farten',
    packing: 'pakker bilen', work: 'arbejder ved bilen', 'cafe-work': 'arbejder på en café', food: 'spiser god mad', beer: 'nyder en øl i campingstolen',
    'solo-surf': 'surfer', 'helena-run': 'løber en tur', 'helena-coffee': 'går tur med en iskaffe',
    'helena-shop': 'kigger i butikker', 'helena-food': 'spiser god mad', 'helena-tv': 'ser serie i lejligheden', 'helena-sleep': 'sover i Brisbane' };
  var cells = { packing: 0, work: 1, 'solo-surf': 2, food: 3, beer: 4,
    'helena-run': 0, 'helena-coffee': 1, 'helena-shop': 2, 'helena-food': 3, 'helena-tv': 4, 'helena-sleep': 5 };
  // Every face is the SAME pixels from the approved master. Scene edits cannot
  // redraw the likeness. Coordinates describe body poses, never new faces.
  var identityId = 0;
  var registration = root.TripFaceRegistration || (typeof require === 'function' ? require('./face-registration.js') : null);
  var heads = {camp:['camp-k','camp-h'],hike:['hike-k','hike-h'],surf:['surf-k','surf-h'],cave:['cave-k','cave-h']};
  var soloHeads = [0,1,2,3,4,5].map(function (cell) {return cell < 5 ? ['karsten-solo-day-'+cell] : [];});
  var helenaHeads = [0,1,2,3,4,5].map(function (cell) {return ['helena-day-'+cell];});
  function closedEyes(kind, prefix) {
    if (!registration) return '';
    var points = registration.source[kind], distance = Math.hypot(points[1][0]-points[0][0],points[1][1]-points[0][1]);
    var rx = distance*.34, ry = distance*.22, result = '';
    points.slice(0,2).forEach(function (point,index) {
      var id = prefix+'-eye-'+index, x = point[0], y = point[1];
      result += '<defs><clipPath id="'+id+'"><ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'"/></clipPath></defs><g clip-path="url(#'+id+')"><image href="'+assets+'characters-base.webp" width="1024" height="1536" transform="translate(0 -24)"/></g><path d="M'+(x-rx*.85)+' '+y+'q'+rx*.85+' '+ry*.55+' '+rx*1.7+' 0" fill="none" stroke="'+(kind==='k'?'#754a35':'#5c3e35')+'" stroke-width="2.8" stroke-linecap="round"/>';
    });
    return result;
  }
  function registeredFace(poseId) {
    var pose = registration && registration.poses[poseId];
    if (!pose) return '';
    var id = 'registered-face-'+(++identityId), k = pose.kind === 'k', gains = pose.gains;
    var contour = k ? 'M287 119C313 105 368 110 391 122L401 151 400 181C402 201 387 226 367 238 342 249 309 238 287 222L270 202 262 177 267 144Z' : 'M651 200C677 182 722 184 748 202L765 227 767 253C763 281 737 309 703 317 675 315 649 298 635 275L632 245 638 220Z';
    var bounds = k ? 'x="245" y="100" width="175" height="170"' : 'x="620" y="178" width="160" height="165"';
    var lighting = gains[0]+' 0 0 0 0 0 '+gains[1]+' 0 0 0 0 0 '+gains[2]+' 0 0 0 0 0 1 0';
    return '<g class="world-registered-face" data-face-id="'+poseId+'" data-source-landmarks="'+JSON.stringify(registration.source[pose.kind])+'" data-target-landmarks="'+JSON.stringify(pose.points)+'" transform="matrix('+pose.matrix.join(' ')+')"><defs><filter id="'+id+'-feather" filterUnits="userSpaceOnUse" '+bounds+'><feGaussianBlur stdDeviation="2.5"/></filter><filter id="'+id+'-light" filterUnits="userSpaceOnUse" '+bounds+'><feColorMatrix values="'+lighting+'"/></filter><mask id="'+id+'-mask" maskUnits="userSpaceOnUse" '+bounds+'><path d="'+contour+'" fill="white" filter="url(#'+id+'-feather)"/></mask></defs><g mask="url(#'+id+'-mask)" filter="url(#'+id+'-light)"><image href="'+assets+'characters-base.webp" width="1024" height="1536"/>'+(poseId==='helena-day-5'?closedEyes(pose.kind,id):'')+'</g></g>';
  }
  function tentLight() {
    var id = 'tent-light-' + (++identityId);
    // Illuminate the opening without changing any original equipment or faces.
    return '<defs><radialGradient id="' + id + '-lamp"><stop offset="0" stop-color="var(--weather-lamp,#ffcf77)" stop-opacity=".75"/><stop offset="1" stop-color="var(--weather-lamp,#ffcf77)" stop-opacity="0"/></radialGradient><clipPath id="' + id + '-window"><path d="M742 177Q716 210 734 279H1014V190Q894 160 742 177Z"/></clipPath></defs><g class="world-tent-light"><ellipse cx="979" cy="204" rx="245" ry="145" fill="url(#' + id + '-lamp)" clip-path="url(#' + id + '-window)"/><path d="M993 175v16" stroke="#cbaa6b" stroke-width="4"/><rect x="982" y="191" width="22" height="29" rx="5" fill="var(--weather-lamp,#ffcf77)" stroke="#cbaa6b" stroke-width="3"/></g>';
  }
  function equipmentImage() {
    // The far-side rain awning projects behind the hard shell; the large near
    // side opening and awning are in the immutable equipment image itself.
    return '<path d="M477 88 368 162 659 154 695 94Z" fill="#7d8290" stroke="#26313b" stroke-width="6"/><path d="M371 164 455 307M652 155 695 309" fill="none" stroke="#26313b" stroke-width="5"/><image href="' + assets + 'equipment.webp" width="1536" height="1024"/>' + tentLight();
  }
  function sleepingHead(kind, x, y, width, height, angle) {
    var k = kind === 'k', id = 'sleep-face-' + (++identityId);
    var contour = k ? 'M330 16C272 10 235 48 233 100L239 159C228 157 229 194 247 211L260 239 269 268 275 292 367 292 373 255C393 241 404 221 409 197 425 189 423 163 411 159L413 108C425 57 390 18 349 20Z' : 'M707 126C652 119 614 162 612 202L618 263C608 283 621 313 648 325L656 357 687 392 754 375 748 339 777 314 810 372 833 387 829 320 802 241C798 167 760 123 707 126Z';
    return '<svg x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" viewBox="' + (k ? '226 10 200 282' : '610 119 225 277') + '" transform="rotate(' + angle + ' ' + (x+width/2) + ' ' + (y+height/2) + ')"><defs><clipPath id="' + id + '"><path d="' + contour + '"/></clipPath></defs><image href="' + assets + 'characters-base.webp" width="1024" height="1536" clip-path="url(#' + id + ')"/>' + closedEyes(kind,id) + '</svg>';
  }
  function equipmentCamp(solo, asleep) {
    var id = 'camp-people-' + (++identityId);
    var result = '<svg class="world-composite" viewBox="0 0 1536 1024" aria-hidden="true">' + equipmentImage();

    if (asleep) {
      result += sleepingHead('k',solo?820:770,152,105,148,-8);
      if (!solo) result += sleepingHead('h',876,171,103,127,12);
      result += '<path d="M732 253q54-34 130 0t155-5v32H732Z" fill="#3b4965" stroke="#1c293f" stroke-width="5"/><path d="M746 262q71-10 136 5t122-5" fill="none" stroke="#566681" stroke-width="4"/><path class="world-sleep-moon" d="M1268 58q-30 48 15 76-66 8-66-47 1-22 18-38 4 19 33 9Z" fill="#ffe8a8" stroke="#4e5354" stroke-width="3"/>';
    } else {
      var karsten = 'M506 342C450 340 420 375 426 435L445 485 395 487 352 538 325 595 320 660 356 702 375 780 330 900 316 980 337 1024 570 1024 568 970 520 935 488 882 560 969 637 995 706 968 701 934 658 902 636 845 621 746 628 694 690 660 755 633 765 601 741 566 655 526 598 512 604 478 621 433 609 383 570 353Z';
      var helena = 'M960 364C889 354 865 409 877 465L895 508 865 534 843 594 862 653 884 681 876 741 924 826 949 910 915 932 911 994 978 1024 1060 1024 1055 960 1045 913 1060 1024 1179 1024 1180 980 1141 941 1099 910 1096 815 1139 756 1153 709 1119 652 1091 622 1078 558 1046 532 1014 511 1059 458 1049 404 1004 372Z';
      result += '<defs><clipPath id="' + id + '"><path d="' + karsten + '"/>' + (solo ? '' : '<path d="' + helena + '"/>') + '</clipPath></defs><g clip-path="url(#' + id + ')">' + lockedArt('camp',solo?[heads.camp[0]]:heads.camp).replace('class="world-composite"', 'x="0" y="0" width="1536" height="1024"') + '</g>';
    }
    return result + '</svg>';
  }
  function lockedArt(file, faces, view) {
    var id = 'identity-' + (++identityId), crop = view || [0,0,1536,1024];
    var result = '<svg class="world-composite" data-art-file="' + file + '" viewBox="' + crop.join(' ') + '" aria-hidden="true">';
    if (file === 'karsten-solo-day') {
      // Reuse the same tent equipment pixels in the work/beer poses too.
      result += '<defs><mask id="' + id + '"><rect width="1536" height="1024" fill="white"/><rect x="565" y="0" width="420" height="185" fill="black"/><rect x="590" y="512" width="390" height="170" fill="black"/><rect x="600" y="95" width="96" height="135" rx="28" fill="white"/><rect x="530" y="573" width="105" height="145" rx="28" fill="white"/></mask></defs>';
      [[570,15,390,151],[595,527,370,143]].forEach(function (t) {result += '<svg x="' + t[0] + '" y="' + t[1] + '" width="' + t[2] + '" height="' + t[3] + '" viewBox="350 15 890 310">' + equipmentImage() + '</svg>';});
    }
    result += '<image href="' + assets + file + '.webp" width="1536" height="1024"' + (file === 'karsten-solo-day' ? ' mask="url(#' + id + ')"' : '') + '/>';
    faces.forEach(function (poseId) {result += registeredFace(poseId);});
    return result + '</svg>';
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function svg(content, extra) {
    return '<svg class="world-backdrop ' + (extra || '') + '" viewBox="0 0 240 180" aria-hidden="true" fill="none" stroke="#213440" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' + content + '</svg>';
  }
  function backdrop(type) {
    if (type === 'cafe-work') return svg('<path d="M12 150V40h216v110Z" fill="#e7e4d9"/><path d="M12 40h216l-13-23H25Z" fill="#486b63"/><path d="M27 58h79v75H27Zm107 0h77v75h-77Z" fill="#b8d4dc"/><path d="M13 147h214" stroke="#486b63" stroke-width="7"/>');
    if (type === 'city' || type === 'helena') return svg('<path d="M17 151V87h30v64m7 0V57h32v94m8 0V77h31v74m10 0V38h35v113m8 0V70h37v81" fill="#d8e6e6"/><path d="M62 67h16m-16 13h16m-16 13h16m65-40h18m-18 15h18m-18 15h18m-18 15h18" stroke="#849da4"/><path d="M10 155h219" stroke="#477c66" stroke-width="8"/>');
    if (type === 'airport') return svg('<path d="M12 146V85l55-23h102l59 23v61Z" fill="#d7e5e9"/><path d="M23 95h193v42H23Z" fill="#91bacb"/><path d="M43 95v42m31-42v42m31-42v42m31-42v42m31-42v42m31-42v42"/><path d="m95 40 17-8 5-21h8l2 21 28 8v7l-29-3-2 15h-7l-4-15-18 3Z" fill="#f8f7f2"/>');
    if (type === 'waterfall') return svg('<path d="M35 143 53 30h57l12 49 17-42h48l23 108Z" fill="#abc5ae"/><path d="M101 37h28l-1 79q-14 18-30 0Z" fill="#69c9ed"/><path class="world-water" d="M108 45v65m12-63v68" stroke="#f8ffff" stroke-width="4" stroke-dasharray="9 7"/><ellipse cx="117" cy="137" rx="83" ry="17" fill="#8cdbed" stroke="#387d99"/>');
    if (type === 'beach' || type === 'swim' || type === 'kayak') return svg('<ellipse cx="120" cy="143" rx="111" ry="26" fill="#e9d29b" stroke="#ac9565"/><path d="M6 151q23-16 46 0t46 0 46 0 46 0 46 0v20H6Z" fill="#60c6de" stroke="#387d99"/><path class="world-wave" d="M4 155q23-16 46 0t46 0 46 0 46 0 46 0" stroke="#e9ffff" stroke-width="4"/>');
    if (type === 'ferry') return svg('<path class="world-wave" d="M8 153q22-12 44 0t44 0 44 0 44 0 44 0" stroke="#62cbdf" stroke-width="9"/><path d="m25 118 17 31h150l26-31Z" fill="#3c77a3"/><path d="M51 119V77h127l18 42Z" fill="#faf8ee"/><path d="M68 77V53h83l13 24Z" fill="#faf8ee"/><path d="M77 54V31h19v23" fill="#d37d44"/><path d="M65 88h111m-111 14h120" stroke="#90bdd0" stroke-width="7"/>');
    return svg('<path d="m14 144 59-101 34 60 30-77 88 118Z" fill="#b8ceb7"/><path d="m53 76 20-33 18 32m32-14 14-35 25 41" fill="#edf3ee"/><path d="M5 151h228" stroke="#708d68" stroke-width="7"/>');
  }
  function people(kind) {
    return '<div class="world-people world-people--' + kind + '"><img src="' + assets + 'characters-base.webp" alt="" draggable="false"></div>';
  }
  function wetsuits() {
    return svg('<path d="M8 67V17m64 50V17M8 21q30 8 64 0" stroke="#9c8052"/><g class="world-wetsuit"><path d="m20 26 8-3 9 3 6 12-5 4-6-8v17l4 21h-8l-1-20-2 20h-8l4-21V34l-6 8-5-4Z" fill="#263849"/></g><g class="world-wetsuit world-wetsuit--second"><path d="m49 26 7-3 8 3 6 11-5 4-4-7v16l3 20h-7l-1-19-2 19h-7l4-20V34l-4 7-5-4Z" fill="#343b4d"/></g>', 'world-wetsuits');
  }
  function render(type, options) {
    options = options || {};
    var small = !!options.small, width = small ? 178 : 226, height = Math.round(width * .79);
    var subject = options.helena ? 'Helena' : options.solo ? 'Karsten' : 'Karsten og Helena';
    var art = ['hike','surf','cave'].indexOf(type) >= 0 ? type : null;
    var content;
    if (['camp','sleep','solo-sleep'].indexOf(type) >= 0) {
      content = equipmentCamp(options.solo || type === 'solo-sleep', type !== 'camp');
      if (type === 'camp') content += '<span class="world-steam world-steam--one"></span><span class="world-steam world-steam--two"></span><span class="world-spark">♥</span>';
    } else if (cells[type] != null) {
      var cell = cells[type], sheet = type.indexOf('helena-') === 0 ? 'helena-day' : 'karsten-solo-day';
      var frame = type === 'food' ? [8,520,468,496] : [cell%3*512+8,(cell<3?0:512)+8,496,496];
      content = '<div class="world-sprite">' + lockedArt(sheet,(sheet === 'helena-day' ? helenaHeads : soloHeads)[cell],frame) + '</div>';
    } else if (art) {
      var soloView = {hike:[250,0,520,1024],cave:[320,70,400,940],surf:[0,0,820,1024]};
      content = lockedArt(art,options.solo ? [heads[art][0]] : heads[art],options.solo ? soloView[art] : null);
    } else {
      var person = options.helena ? 'helena' : options.solo ? 'karsten' : 'couple';
      content = backdrop(type) + people(person);
      if (type === 'cafe-work') content += svg('<path d="M37 136h174v10H37Z" fill="#c7a67a"/><path d="M50 147v29m147-29v29"/><path d="m111 134-5-41h60l6 41Z" fill="#527b8b"/><path d="M101 136h77" stroke="#294a5a" stroke-width="4"/><path d="M181 115h16v18h-16Zm16 3c16-3 16 13 0 10" fill="#faf6e8"/>','world-cafe-table');
      if (type === 'ferry') content = backdrop(type) + '<div class="world-deck-people">' + people(person) + '</div>';
      if (type === 'swim') content = backdrop(type) + '<div class="world-swimmers">' + people(person) + '</div>';
    }
    if (type.indexOf('sleep') >= 0) content += '<span class="world-z world-z--one">z</span><span class="world-z world-z--two">z</span><span class="world-z world-z--three">Z</span>';
    if (['camp','sleep','solo-sleep','work','food','beer'].indexOf(type) >= 0 && options.coastal) content += wetsuits();
    return { html: '<div class="world-scene world-scene--' + escape(type) + '" role="img" aria-label="' + escape(subject + ' ' + (labels[type] || labels.walk)) + '">' + content + '</div>',
      size: [width, height], anchor: [width / 2, height * .98], label: subject + ' ' + (labels[type] || labels.walk) };
  }
  function flight() {
    return { html: '<div class="world-flight" role="img" aria-label="Helenas anslåede flyrejse til Christchurch">' + svg('<path d="m120 13 10 57 76 44v15l-76-24-2 37 22 18v9l-30-8-30 8v-9l22-18-2-37-76 24v-15l76-44Z" fill="#f8fbff" stroke="#214a69" stroke-width="4"/><path d="M120 16v143" stroke="#4d97c4" stroke-width="3"/>') + '</div>', size: [72,72], anchor: [36,36], label: 'Helenas anslåede flyrejse' };
  }
  function animal(type) {
    var shapes = {
      whale: '<path d="M23 96q-6-44 42-50 49-3 91 35l25-15-3 24 26 8q-28 18-49 4-69 45-132-6Z" fill="#507c95"/><path d="m83 107 24 25 13-24" fill="#345f79"/><circle cx="44" cy="75" r="4" fill="#172b3a"/><path class="world-spout" d="M61 45q-19-27-28-12m29 12q-1-35 11-32m-11 32q19-28 31-16" stroke="#b6edf2" stroke-width="5"/><path d="M16 120q23-10 46 0t46 0 46 0 46 0" stroke="#76ceda" stroke-width="4"/>',
      seal: '<path d="M38 126q6-31 57-42l26-33q21-15 33 3l-1 38q27 15 48 32l-41 8-22-13q-52 29-100 7Z" fill="#9b8674"/><path d="m103 103 9 37 24-17M143 62l22 6-19 7" fill="#786c63"/><circle cx="142" cy="56" r="3" fill="#172b3a"/><path d="M142 68h26m-25 5 24 5" stroke-width="1"/>',
      kea: '<path d="M52 128q-4-29 38-45l24-38q29-10 39 13l-16 38 39 31-39-4-33 19Z" fill="#77905b"/><path class="world-wing" d="m104 89-57-41 12 52 50 17" fill="#b9633d"/><path d="m146 54 23 9-22 12" fill="#6d6c5c"/><circle cx="140" cy="51" r="3" fill="#172b3a"/><path d="m112 134-7 16m17-17 4 17"/>',
      kiwi: '<ellipse cx="95" cy="102" rx="51" ry="36" fill="#a78b6b"/><path d="M125 91q3-39 33-31l7 13-28 18" fill="#a78b6b"/><path d="m159 70 54 20-53-10" fill="#dbba7b"/><circle cx="150" cy="65" r="3" fill="#172b3a"/><path d="m77 134-5 19m36-18 5 18m-49 1h17m24 0h18"/>',
      sheep: '<path d="M51 115q-18-10-5-28-8-20 12-28 8-22 28-9 17-15 32 1 26-9 29 16 22 4 14 28 4 29-23 29H67Z" fill="#fff3d8"/><path d="m66 120-2 28m59-24 5 24" stroke-width="8"/><path d="m143 78 17-21 16 5 7 25-11 27-23-4Z" fill="#5e6264"/><path d="m157 61-8-9m27 9 11-6" stroke-width="5"/><circle cx="169" cy="80" r="3" fill="#fff3d8"/>'
    };
    return '<div class="world-animal world-animal--' + type + '">' + svg(shapes[type] || shapes.sheep) + '</div>';
  }
  var api = {render:render,flight:flight,animal:animal,labels:labels};
  root.TripScenes = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

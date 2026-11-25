/* Local wish list: campsite preferences never imply a reservation or silently change the shared route. */
(function () {
  var root = document.getElementById('trip-choices');
  if (!root) return;
  var key = 'nz-route-choices-20261125', saved = {}, storageOK = true;
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { storageOK = false; }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  var groups = Array.from(root.querySelectorAll('[data-choice-group]'));
  var status = root.querySelector('[data-choice-status]');
  function update(write) {
    if (write) try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) { storageOK = false; }
    var count = 0;
    groups.forEach(function (group) {
      var chosen = null;
      group.querySelectorAll('input[type=radio]').forEach(function (radio) {
        radio.checked = saved[group.dataset.choiceGroup] === radio.value;
        radio.closest('label').classList.toggle('is-chosen', radio.checked);
        if (radio.checked) chosen = radio;
      });
      group.querySelector('[data-group-status]').textContent = chosen ? 'Jeres favorit: ' + chosen.dataset.title : 'Intet valg endnu';
      if (chosen) count++;
    });
    status.textContent = count ? count + ' af ' + groups.length + ' valg ' + (storageOK ? 'gemt på denne enhed.' : 'valgt. Browseren kan ikke gemme dem; kopiér valgene nedenfor.') : 'Vælg én favorit i hver gruppe. I kan ændre mening.';
  }
  root.addEventListener('change', function (event) {
    var radio = event.target;
    if (!radio.matches('input[type=radio]')) return;
    saved[radio.closest('[data-choice-group]').dataset.choiceGroup] = radio.value;
    update(true);
  });
  root.querySelector('[data-reset-choices]').addEventListener('click', function () { saved = {}; var output = root.querySelector('[data-choice-output]'); output.value = ''; output.hidden = true; update(true); });
  root.querySelector('[data-copy-choices]').addEventListener('click', async function () {
    var lines = ['Vores valg til NZ-ruten:'];
    groups.forEach(function (group) {
      var radio = group.querySelector('input:checked');
      if (radio) lines.push(group.querySelector('h4').textContent + ': ' + radio.dataset.title);
    });
    if (lines.length === 1) { status.textContent = 'Vælg mindst én favorit først.'; return; }
    var output = root.querySelector('[data-choice-output]');
    output.hidden = false; output.value = lines.join('\n');
    try { await navigator.clipboard.writeText(output.value); status.textContent = 'Valgene er kopieret. Send dem i chatten, så de kan lægges ind i den fælles rute.'; }
    catch (_) { output.focus(); output.select(); status.textContent = 'Markér og kopiér valgene i feltet nedenfor, og send dem i chatten.'; }
  });
  update(false);
})();

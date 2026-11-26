(function () {
  'use strict';

  const guide = window.NZFilmData;
  if (!guide || !guide.films.length) {
    document.getElementById('film-load-error').hidden = false;
    return;
  }

  const byId = (id) => document.getElementById(id);
  const mapBox = byId('rk');
  const map = mapBox.filmMap;
  const edition = byId('film-edition');
  const search = byId('film-search');
  const list = byId('film-location-list');
  const filmNumbers = new Map(guide.films.map((film, index) => [film.id, index + 1]));
  const films = new Map(guide.films.map((film) => [film.id, film]));
  const watchKey = 'nz-films-seen';
  let watched = {};
  let state;
  let places = [];
  let syncing = false;

  try {
    watched = JSON.parse(localStorage.getItem(watchKey) || '{}') || {};
  } catch {}

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function externalLink(url, label, className = '') {
    if (!/^https?:\/\//i.test(url || '')) return '';
    return '<a class="' + escapeHtml(className) + '" href="' + escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + '</a>';
  }

  function placeUrl(place) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.lat + ',' + place.lng);
  }

  function queryUrl(selection) {
    const params = new URLSearchParams({ film: selection.film });
    if (selection.place) params.set('sted', selection.place);
    if (selection.edition === 'extended') params.set('udgave', 'extended');
    return '?' + params;
  }

  function readQuery() {
    const params = new URLSearchParams(window.location.search);
    const place = guide.locations.find((location) => location.id === params.get('sted'));
    const film = films.get(params.get('film')) ||
      (place && guide.films.find((candidate) => place.scenes.some((scene) => scene.film === candidate.id))) ||
      guide.films[0];
    return {
      film: film.id,
      place: place && place.scenes.some((scene) => scene.film === film.id) ? place.id : '',
      edition: params.get('udgave') === 'extended' ? 'extended' : 'theatrical'
    };
  }

  function formatRuntime(minutes) {
    return Math.floor(minutes / 60) + ' t ' + String(minutes % 60).padStart(2, '0') + ' min';
  }

  function formatTime(minutes) {
    const seconds = Math.round(minutes * 60);
    const formatted = Math.floor(seconds / 3600) + ':' + String(Math.floor(seconds / 60) % 60).padStart(2, '0');
    return seconds % 60 ? formatted + ':' + String(seconds % 60).padStart(2, '0') : formatted;
  }

  function sourceLinks(sources) {
    return (sources || []).map((source) => externalLink(source.url, source.title)).filter(Boolean);
  }

  function sceneMarkup(scene) {
    const range = scene.time?.[state.edition];
    const time = range
      ? 'Ca. <time datetime="PT' + range[0] + 'M">' + formatTime(range[0]) + '</time>–<time datetime="PT' + range[1] + 'M">' + formatTime(range[1]) + '</time>'
      : 'Tidspunkt ikke verificeret';
    const note = scene.timeNote ? '<p class="film-caption">' + escapeHtml(scene.timeNote) + '</p>' : '';
    const sources = sourceLinks(scene.sources);
    return '<li><p class="film-scene-name"><strong>' + escapeHtml(scene.scene) + '</strong></p>' +
      '<p class="film-scene-time">' + time + '</p>' + note +
      (sources.length ? '<p class="film-caption film-source-links">' + sources.join(' ') + '</p>' : '') + '</li>';
  }

  function photoMarkup(photo) {
    if (!photo?.src) return '';
    const credit = photo.credit || photo.license;
    const image = '<img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy" decoding="async">';
    const caption = [escapeHtml(photo.note), externalLink(photo.url, credit) || escapeHtml(credit), externalLink(photo.licenseUrl, photo.license) || escapeHtml(photo.license)].filter(Boolean).join(' · ');
    return '<figure class="film-photo">' + image + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
  }

  function placeMarkup(place, inSheet) {
    const name = '<h3>' + escapeHtml(place.name) + '</h3>';
    const region = place.region ? '<p class="film-caption">' + escapeHtml(place.region) + '</p>' : '';
    const access = [
      ['Adgang', place.access],
      ['Kortpunkt', place.precision]
    ].filter(([, value]) => value).map(([label, value]) =>
      '<div><dt>' + label + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
    ).join('');
    const mapLink = map && !inSheet ? '<a class="film-action film-action-map" href="' +
      escapeHtml(queryUrl({ ...state, place: place.id })) + '" data-place="' + escapeHtml(place.id) + '">Vis på kort</a>' : '';
    return '<div class="film-place-info">' +
      '<div class="film-place-heading"><span class="film-pin-key" aria-hidden="true">' + place.number + '</span>' +
      '<div>' + name + region + '</div></div>' +
      '<ul class="film-scenes">' + place.filmScenes.map(sceneMarkup).join('') + '</ul>' +
      (access ? '<dl class="film-access">' + access + '</dl>' : '') +
      '<div class="film-actions">' + mapLink + externalLink(placeUrl(place), 'Google Maps', 'film-action') + '</div></div>';
  }

  function sheetMarkup(place) {
    return '<div class="rk-body film-sheet-content">' + placeMarkup(place, true) + photoMarkup(place.photo) + '</div>';
  }

  function normalize(value) {
    return String(value ?? '').toLocaleLowerCase('da').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function placesFor(filmId) {
    const byTime = (scenes) => Math.min(...scenes.map((scene) =>
      scene.time?.theatrical?.[0] ?? scene.time?.extended?.[0] ?? Infinity));
    return guide.locations.map((place) => ({
      ...place,
      filmScenes: place.scenes.filter((scene) => scene.film === filmId)
    })).filter((place) => place.filmScenes.length)
      .sort((a, b) => byTime(a.filmScenes) - byTime(b.filmScenes) || a.name.localeCompare(b.name, 'da'))
      .map((place, index) => ({ ...place, number: index + 1 }));
  }

  function renderPlaces() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const visible = places.filter((place) => {
      const haystack = normalize([place.name, place.region, ...place.filmScenes.map((scene) => scene.scene)].join(' '));
      return terms.every((term) => haystack.includes(term));
    });
    const count = visible.length;
    byId('film-result-count').textContent = count
      ? count + (count === 1 ? ' optagested' : ' optagesteder')
      : (terms.length ? 'Ingen steder matcher søgningen. Prøv et andet stednavn eller en anden scene.' : 'Der er ingen optagesteder i guiden for denne film.');
    list.innerHTML = visible.map((place) => '<article class="film-location" id="filmsted-' + escapeHtml(place.id) + '">' +
      photoMarkup(place.photo) + placeMarkup(place, false) + '</article>').join('');
  }

  function renderFilm() {
    const film = films.get(state.film);
    byId('film-title').textContent = film.title;
    const duration = film.runtime?.[state.edition];
    byId('film-meta').textContent = [film.englishTitle, film.year, duration && formatRuntime(duration)].filter(Boolean).join(' · ');
    edition.value = state.edition;
    const links = [
      externalLink(film.streamUrl, 'Åbn i Netflix', 'film-action'),
      externalLink(film.appleUrl, 'Apple TV Store · leje/køb', 'film-action')
    ].filter(Boolean);
    byId('film-streaming').hidden = !links.length && !guide.streamingNote;
    byId('film-streaming-note').textContent = guide.streamingNote || '';
    byId('film-streaming-links').innerHTML = links.join('');
    document.querySelectorAll('.film-choice').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.film === film.id));
    });
    if (mapFilm) mapFilm.value = film.id;
  }

  function select(next, options = {}) {
    const filmChanged = next.film !== state?.film;
    const editionChanged = next.edition !== state?.edition;
    const placeChanged = next.place !== state?.place;
    if (options.push && (filmChanged || editionChanged || placeChanged)) history.pushState(null, '', queryUrl(next));
    state = next;
    syncing = true;
    if (filmChanged) {
      search.value = '';
      places = placesFor(state.film);
      if (map) map.setPoints(places.map((place) => ({
        id: place.id, ll: [place.lat, place.lng], name: place.name, number: place.number
      })));
    }
    if (filmChanged || editionChanged) {
      renderFilm();
      renderPlaces();
    }
    const place = places.find((location) => location.id === state.place);
    if (map && place) {
      if (filmChanged || placeChanged || options.center) {
        map.showPoint(place.id, sheetMarkup(place), !!options.center, options.trigger);
      } else if (editionChanged) {
        map.updateDetails(sheetMarkup(place));
      }
    } else if (map && placeChanged) {
      map.close();
    }
    if (options.scroll && place) {
      const target = map ? byId('filmkort') : byId('filmsted-' + place.id);
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    syncing = false;
  }

  const mapFilm = map ? document.createElement('select') : null;
  if (mapFilm) {
    mapFilm.className = 'rk-btn film-map-select';
    mapFilm.setAttribute('aria-label', 'Vælg film');
    mapFilm.innerHTML = guide.films.map((film) => '<option value="' + escapeHtml(film.id) + '">' +
      filmNumbers.get(film.id) + '. ' + escapeHtml(film.title) + '</option>').join('');
    mapFilm.addEventListener('change', () => select({ ...state, film: mapFilm.value, place: '' }, { push: true }));
    map.controls.appendChild(mapFilm);
  }

  guide.films.forEach((film) => {
    const row = document.createElement('li');
    row.className = 'film-order-row';
    row.innerHTML = '<button type="button" class="film-choice" data-film="' + escapeHtml(film.id) + '" aria-pressed="false">' +
      '<span class="film-order-number" aria-hidden="true">' + filmNumbers.get(film.id) + '</span><span>' + escapeHtml(film.title) + '</span></button>' +
      '<label class="film-seen"><input type="checkbox" aria-label="Markér ' + escapeHtml(film.title) + ' som set">Set</label>';
    row.querySelector('button').addEventListener('click', () => {
      if (state.film !== film.id) select({ ...state, film: film.id, place: '' }, { push: true });
    });
    const checkbox = row.querySelector('input');
    checkbox.checked = !!watched[film.id];
    checkbox.addEventListener('change', () => {
      watched[film.id] = checkbox.checked;
      try { localStorage.setItem(watchKey, JSON.stringify(watched)); } catch {}
    });
    byId(film.id.startsWith('hobbit-') ? 'film-hobbit-order' : 'film-lotr-order').appendChild(row);
  });

  const globalLinks = sourceLinks(guide.sources);
  const notes = (guide.notes || []).map((note) => '<p>' + escapeHtml(note) + '</p>');
  byId('film-sources').hidden = !globalLinks.length && !notes.length;
  byId('film-source-details').innerHTML = notes.join('') +
    (globalLinks.length ? '<ul>' + globalLinks.map((link) => '<li>' + link + '</li>').join('') + '</ul>' : '');

  edition.addEventListener('change', () => select({ ...state, edition: edition.value }, { push: true }));
  search.addEventListener('input', renderPlaces);
  list.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-place]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select({ ...state, place: link.dataset.place }, { push: true, center: true, scroll: true, trigger: link });
  });
  mapBox.addEventListener('rk-film-select', (event) => select({ ...state, place: event.detail }, { push: true }));
  mapBox.addEventListener('rk-film-close', () => {
    if (!state.place || syncing) return;
    state = { ...state, place: '' };
    history.replaceState(null, '', queryUrl(state));
  });
  window.addEventListener('popstate', () => select(readQuery(), { center: true }));

  mapBox.hidden = !map;
  byId('film-map-fallback').hidden = !!map;
  byId('film-content').hidden = false;
  const initial = readQuery();
  select(initial, { center: true, scroll: !!initial.place });
})();

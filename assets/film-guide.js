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
  let timeline = [];
  let places = new Map();
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
    if (selection.scene) params.set('scene', selection.scene);
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
      scene: params.get('scene') || '',
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

  function rangeMarkup(range) {
    return range
      ? range.map((minutes) => '<time datetime="PT' + Math.round(minutes * 60) + 'S">' + formatTime(minutes) + '</time>').join('–')
      : 'Tid ukendt';
  }

  function sceneMarkup(entry) {
    const { scene, range } = entry;
    const note = scene.timeNote ? '<p class="film-caption">' + escapeHtml(scene.timeNote) + '</p>' : '';
    const sources = sourceLinks(scene.sources);
    return '<p class="film-scene-time">' + (range ? 'Ca. ' : '') + rangeMarkup(range) + '</p>' + note +
      (sources.length ? '<p class="film-caption film-source-links">' + sources.join(' ') + '</p>' : '');
  }

  function photoMarkup(photo) {
    if (!photo?.src) return '';
    const credit = photo.credit || photo.license;
    const image = '<img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy" decoding="async">';
    const caption = [escapeHtml(photo.note), externalLink(photo.url, credit) || escapeHtml(credit), externalLink(photo.licenseUrl, photo.license) || escapeHtml(photo.license)].filter(Boolean).join(' · ');
    return '<figure class="film-photo">' + image + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
  }

  function detailMarkup(entry) {
    const { place, scene, number } = entry;
    const region = place.region ? ' · ' + escapeHtml(place.region) : '';
    const access = [
      ['Adgang', place.access],
      ['Kortpunkt', place.precision]
    ].filter(([, value]) => value).map(([label, value]) =>
      '<div><dt>' + label + '</dt><dd>' + escapeHtml(value) + '</dd></div>'
    ).join('');
    return '<div class="film-place-info">' +
      '<div class="film-place-heading"><span class="film-pin-key" aria-hidden="true">' + number + '</span>' +
      '<div><h3>' + escapeHtml(scene.scene) + '</h3><p class="film-caption">' + escapeHtml(place.name) + region + '</p></div></div>' +
      sceneMarkup(entry) + (access ? '<dl class="film-access">' + access + '</dl>' : '') +
      '<div class="film-actions">' + externalLink(placeUrl(place), 'Google Maps', 'film-action') + '</div></div>' +
      photoMarkup(place.photo);
  }

  function sceneLink(entry, content, className, active = false) {
    const { place, key } = entry;
    return '<a class="' + className + '" href="' + escapeHtml(queryUrl({ ...state, place: place.id, scene: key })) +
      '" data-place="' + escapeHtml(place.id) + '" data-scene="' + escapeHtml(key) + '"' +
      (active ? ' aria-current="true"' : '') + '>' + content + '</a>';
  }

  function sheetMarkup(entry) {
    const before = timeline[entry.number - 2];
    const after = timeline[entry.number];
    return '<div class="rk-body film-sheet-content">' +
      '<nav class="film-actions film-scene-nav" aria-label="Scenerækkefølge">' +
      (before ? sceneLink(before, '‹ Forrige', 'film-action') : '') +
      (after ? sceneLink(after, 'Næste ›', 'film-action') : '') +
      '</nav>' + detailMarkup(entry) + '</div>';
  }

  function normalize(value) {
    return String(value ?? '').toLocaleLowerCase('da').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function timelineFor(filmId, editionId) {
    return guide.locations.flatMap((place) => place.scenes.filter((scene) => scene.film === filmId)
      .map((scene, index) => {
        const time = scene.time?.[editionId];
        const range = time?.length === 2 && time.every(Number.isFinite) ? time : null;
        return { place, scene, key: String(index + 1), range };
      }))
      .sort((a, b) => (a.range?.[0] ?? Infinity) - (b.range?.[0] ?? Infinity))
      .map((entry, index) => ({ ...entry, number: index + 1 }));
  }

  function isSelected(entry) {
    return state.place === entry.place.id && state.scene === entry.key;
  }

  function renderTimeline() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const visible = timeline.filter(({ place, scene }) => {
      const haystack = normalize([place.name, place.region, scene.scene].join(' '));
      return terms.every((term) => haystack.includes(term));
    });
    const count = visible.length;
    byId('film-result-count').textContent = count
      ? count + (count === 1 ? ' scene' : ' scener')
      : (terms.length ? 'Ingen scener matcher søgningen.' : 'Der er ingen scener i guiden for denne film.');
    list.innerHTML = visible.map((entry) => {
      const { place, scene, key, range, number } = entry;
      const content = '<span class="film-pin-key" aria-hidden="true">' + number + '</span>' +
        '<span class="film-scene-time">' + rangeMarkup(range) + '</span>' +
        '<span class="film-timeline-title"><strong>' + escapeHtml(scene.scene) + '</strong><span>' +
        escapeHtml(place.name) + '</span></span>';
      return '<li id="filmsted-' + escapeHtml(place.id + '-' + key) + '">' +
        (map ? sceneLink(entry, content, 'film-timeline-row', isSelected(entry))
          : '<details><summary class="film-timeline-row">' + content + '</summary>' + detailMarkup(entry) + '</details>') + '</li>';
    }).join('');
  }

  function updateTimelineSelection() {
    list.querySelector('[aria-current]')?.removeAttribute('aria-current');
    if (!state.place) return;
    byId('filmsted-' + state.place + '-' + state.scene)?.querySelector('a')?.setAttribute('aria-current', 'true');
  }

  function mapLabel({ number, range }) {
    return { number, time: range ? '≈' + formatTime(range[0]) : '—', timeTitle: range ? 'Ca. ' + formatTime(range[0]) : 'Tid ukendt' };
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
    const timelineChanged = filmChanged || editionChanged;
    const previous = state;
    syncing = true;
    if (filmChanged) search.value = '';
    if (timelineChanged) {
      timeline = timelineFor(next.film, next.edition);
      places = new Map();
      for (const entry of timeline) {
        if (!places.has(entry.place.id)) places.set(entry.place.id, entry);
      }
    }
    const entry = timeline.find(({ place, key }) => place.id === next.place && key === next.scene) || places.get(next.place);
    state = { ...next, place: entry?.place.id || '', scene: entry?.key || '' };
    const sceneChanged = state.place !== previous?.place || state.scene !== previous?.scene;
    if (options.push && (timelineChanged || sceneChanged)) history.pushState(null, '', queryUrl(state));

    if (timelineChanged) {
      renderFilm();
      renderTimeline();
      if (map) map.setPoints(Array.from(places.values(), (item) => ({
        id: item.place.id, ll: [item.place.lat, item.place.lng], name: item.place.name, ...mapLabel(item)
      })), filmChanged);
    } else if (sceneChanged) {
      updateTimelineSelection();
    }
    if (map && entry && (timelineChanged || sceneChanged || options.center)) {
      map.showPoint(entry.place.id, sheetMarkup(entry), !!options.center, options.trigger, mapLabel(entry));
    } else if (map && !entry && sceneChanged) {
      map.close();
    }
    if (options.scroll && entry) {
      const target = map ? byId('filmkort') : byId('filmsted-' + entry.place.id + '-' + entry.key);
      if (!map) target?.querySelector('details')?.setAttribute('open', '');
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
    mapFilm.addEventListener('change', () => select({ ...state, film: mapFilm.value, place: '', scene: '' }, { push: true }));
    map.controls.appendChild(mapFilm);
  }

  guide.films.forEach((film) => {
    const row = document.createElement('li');
    row.className = 'film-order-row';
    row.innerHTML = '<button type="button" class="film-choice" data-film="' + escapeHtml(film.id) + '" aria-pressed="false">' +
      '<span class="film-order-number" aria-hidden="true">' + filmNumbers.get(film.id) + '</span><span>' + escapeHtml(film.title) + '</span></button>' +
      '<label class="film-seen"><input type="checkbox" aria-label="Markér ' + escapeHtml(film.title) + ' som set">Set</label>';
    row.querySelector('button').addEventListener('click', () => {
      if (state.film !== film.id) select({ ...state, film: film.id, place: '', scene: '' }, { push: true });
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
  search.addEventListener('input', renderTimeline);
  function openSceneLink(event) {
    const link = event.target.closest('a[data-scene]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const fromTimeline = list.contains(link);
    select({ ...state, place: link.dataset.place, scene: link.dataset.scene }, {
      push: true, center: true, scroll: fromTimeline, trigger: fromTimeline ? link : undefined
    });
  }
  list.addEventListener('click', openSceneLink);
  mapBox.addEventListener('click', openSceneLink);
  mapBox.addEventListener('rk-film-select', (event) => {
    select({ ...state, place: event.detail, scene: state.place === event.detail ? state.scene : '' }, { push: true });
  });
  mapBox.addEventListener('rk-film-close', () => {
    if (!state.place || syncing) return;
    state = { ...state, place: '', scene: '' };
    updateTimelineSelection();
    history.replaceState(null, '', queryUrl(state));
  });
  window.addEventListener('popstate', () => select(readQuery(), { center: true }));

  mapBox.hidden = !map;
  byId('film-map-fallback').hidden = !!map;
  byId('film-content').hidden = false;
  const initial = readQuery();
  select(initial, { center: true, scroll: !!initial.place });
})();

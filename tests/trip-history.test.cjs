const test = require('node:test');
const assert = require('node:assert/strict');
const {mount} = require('../assets/trip-history.js');

function setup(trips = [{pts: [[-44, 170], [-45, 169]], html: '<h3>August</h3>'}]) {
  const children = [], elements = [];
  const document = {createElement() {
    const e = {attrs: {}, events: {}, setAttribute(k, v) {this.attrs[k] = v;}, addEventListener(k, v) {this.events[k] = v;}};
    elements.push(e); return e;
  }};
  const map = {layers: [], createPane: () => ({style: {}}), getContainer: () => ({appendChild: e => children.push(e)}),
    getCenter: () => ({lat: -41, lng: 173}), getZoom: () => 10,
    fitBounds(bounds) {this.fitted = bounds;}, setView(center, zoom) {this.restored = {center, zoom};},
    removeLayer(layer) {this.layers = this.layers.filter(x => x !== layer);}};
  const L = {featureGroup: () => ({items: [], addLayer(x) {this.items.push(x);}, addTo(m) {m.layers.push(this);}}),
    polyline: (pts, options) => ({pts, options, on(k, fn) {this[k] = fn;}}),
    latLngBounds: x => x, DomEvent: {disableClickPropagation() {}}};
  const cards = [], control = mount({trips, map, L, document,
    box: {classList: {toggle() {}}}, controls: {appendChild: e => children.push(e)}, open: h => cards.push(h)});
  return {control, map, cards, elements};
}
test('old trips stay hidden until requested and hiding restores the original map view', () => {
  const {control, map} = setup();
  assert.equal(map.layers.length, 0);
  assert.equal(control.button.textContent, 'SHOW old trips');
  assert.equal(control.summary.hidden, true);
  control.button.events.click();
  assert.equal(map.layers.length, 1);
  assert.equal(control.button.attrs['aria-pressed'], 'true');
  assert.equal(control.button.textContent, 'HIDE old trips');
  assert.equal(control.summary.hidden, false);
  assert.deepEqual(map.fitted, [[-44, 170], [-45, 169]]);
  control.button.events.click();
  assert.equal(map.layers.length, 0);
  assert.deepEqual(map.restored, {center: [-41, 173], zoom: 10});
});
test('route clicks show that trip and the overview explains the historical evidence', () => {
  const {control, cards} = setup();
  control.layer.items[2].click();
  assert.equal(cards[0], '<h3>August</h3>');
  control.summary.events.click();
  assert.match(cards[1], /ikke registrerede GPS-spor/);
  assert.match(cards[1], /August/);
});
test('pages without historical routes get no extra controls', () => {
  const {control, elements} = setup([]);
  assert.equal(control, null);
  assert.equal(elements.length, 0);
});

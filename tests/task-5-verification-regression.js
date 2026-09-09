'use strict';

var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');
var data = fs.readFileSync('assets/site-v09/data.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function section(id) {
  var start = html.indexOf('<section id="' + id + '"');
  assert(start !== -1, id + ' section is missing');
  var end = html.indexOf('</section>', start);
  assert(end !== -1, id + ' section is not closed');
  return html.slice(start, end + '</section>'.length);
}

var prototype = section('prototype');
var markers = prototype.match(/<span class="story-route-step[^"]*"[^>]*data-stage="[0-9]+"[^>]*>/g) || [];
assert(markers.length === 4, 'story route must keep exactly four semantic markers');
assert(markers.join('') === [
  '<span class="story-route-step is-active" data-stage="0">',
  '<span class="story-route-step" data-stage="1">',
  '<span class="story-route-step" data-stage="2">',
  '<span class="story-route-step" data-stage="3">'
].join(''), 'story route marker stages must remain 0 through 3');
var protoStart = data.indexOf(' "protoSteps": [');
var protoEnd = data.indexOf(' "protoRows": [', protoStart);
assert(protoStart !== -1 && protoEnd !== -1, 'prototype data block is missing');
var protoData = data.slice(protoStart, protoEnd);
assert((protoData.match(/\n  \[/g) || []).length === 5, 'prototype data must retain exactly five internal states');
assert(protoData.indexOf('[\n   "Закрыта",') !== -1, 'prototype data must retain the Закрыта state');

var contentStart = core.indexOf('function content(k) {');
var contentEnd = core.indexOf('\n    function paint() {', contentStart);
assert(contentStart !== -1 && contentEnd !== -1, 'prototype content renderer is missing');
var content = core.slice(contentStart, contentEnd);
assert(content.indexOf('var routeStage = Math.min(k, 3);') !== -1, 'final internal prototype state must map to route stage 3');
assert(content.indexOf('root.dataset.routeStage = String(routeStage);') !== -1, 'route stage data attribute must use the semantic route stage');
assert(content.indexOf('Number(el.getAttribute(\'data-stage\')) === routeStage') !== -1, 'route marker matching must use the semantic route stage');
assert(content.indexOf("el.setAttribute('aria-current', 'step');") !== -1, 'active route marker must expose aria-current=step');

assert(html.indexOf('.tone-scene{transition:background-color') === -1, 'static tone scenes must not keep a no-op background transition');
assert(/\.tone-transition\{height:clamp\(64px,10vw,140px\);background:linear-gradient\(to bottom,var\(--tone-from\),var\(--tone-to\)\);pointer-events:none\}/.test(html), 'tone changes must use real gradient transition zones');

console.log('PASS task 5 route-stage mapping and reduced-motion tone transition contract');

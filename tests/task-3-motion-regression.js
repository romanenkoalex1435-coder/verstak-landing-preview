'use strict';

var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');

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

var builder = section('builder');
assert(/<section id="builder"[^>]*data-sx="constructor"[^>]*data-motion-scene="constructor"/.test(builder), 'builder must be a constructor motion scene');
assert(/<div class="section-head">/.test(builder), 'builder heading must stay visible before scene entry');
assert(/<div class="brick-grid">/.test(builder), 'builder grid must remain visible and interactive');
assert(/<aside class="summary-panel">/.test(builder), 'builder summary must remain visible and interactive');

var works = section('works');
assert(/<section id="works" class="sect" data-sx="gallery" data-motion-scene="works">/.test(works), 'works must be a gallery motion scene');
assert(/<div class="section-head on-panel">/.test(works), 'works heading must stay visible before scene entry');
assert(/<div class="tabs-col">/.test(works), 'works tabs must remain visible and interactive');
assert(/<div class="stage-switch-surface" data-sx="stage">/.test(works), 'works media must use an independent switch surface');
assert(/<div class="stage-copy">/.test(works), 'works copy and navigation must remain visible');

assert(core.indexOf('timer = setTimeout(render, 180);') !== -1, 'gallery render delay must be 180ms');
assert(core.indexOf('clearTimeout(timer);') !== -1, 'gallery must cancel a pending render before switching');
assert(html.indexOf('.stage-switch-surface{transition:opacity 180ms var(--ease),transform 180ms var(--ease)}') !== -1, 'stage switch surface must transition opacity and transform over 180ms');
assert(html.indexOf('.stage-switch-surface.is-changing{opacity:.25;transform:translateY(8px)}') !== -1, 'stage changing state must use the specified short exit');
assert(html.indexOf('.is-motion-ready [data-motion-scene] [data-motion-decor]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms);transform:translateY(10px)}') !== -1, 'mobile scene cascade must use 10px distance and 70ms delays');
assert(html.indexOf('.is-motion-ready [data-motion-scene].is-in-view [data-motion-decor]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms)}') !== -1, 'mobile scene delay must override the more specific desktop in-view rule');

console.log('PASS task 3 motion scenes and interruptible gallery contract');

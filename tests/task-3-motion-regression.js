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
assert(/<div class="section-head" data-motion-layer style="--motion-index:0">/.test(builder), 'builder heading must be layer 0');
assert(/<div class="brick-grid" data-motion-layer style="--motion-index:1">/.test(builder), 'builder grid must be layer 1');
assert(/<aside class="summary-panel" data-motion-layer style="--motion-index:2">/.test(builder), 'builder summary must be layer 2');

var works = section('works');
assert(/<section id="works" class="sect tone-scene tone-works" data-sx="gallery" data-motion-scene="works">/.test(works), 'works must be a toned gallery motion scene');
assert(/<div class="section-head on-panel" data-motion-layer style="--motion-index:0">/.test(works), 'works heading must be layer 0');
assert(/<div class="tabs-col" data-motion-layer style="--motion-index:1">/.test(works), 'works tabs must be layer 1');
assert(/<div class="stage-media" data-sx="stage" data-motion-layer style="--motion-index:2">/.test(works), 'works media must be layer 2');
assert(/<div class="stage-copy" data-motion-layer style="--motion-index:3">/.test(works), 'works copy must be layer 3');

assert(core.indexOf('timer = setTimeout(render, 180);') !== -1, 'gallery render delay must be 180ms');
assert(core.indexOf('clearTimeout(timer);') !== -1, 'gallery must cancel a pending render before switching');
assert(html.indexOf('.stage-media{\n  border-radius:var(--radius-nested);overflow:hidden;background:var(--panel-nested);\n  border:1px solid var(--hairline);margin-bottom:18px;\n  transition:opacity 180ms var(--ease),transform 180ms var(--ease);') !== -1, 'stage media must transition opacity and transform over 180ms');
assert(html.indexOf('.stage-media.is-changing{opacity:.25;transform:translateY(8px)}') !== -1, 'stage changing state must use the specified short exit');
assert(html.indexOf('.tone-works{background:#d4d9de}') !== -1, 'works tone is missing');
assert(html.indexOf('.is-motion-ready [data-motion-scene="constructor"] [data-motion-layer],') !== -1, 'mobile constructor cascade override is missing');
assert(html.indexOf('.is-motion-ready [data-motion-scene="works"] [data-motion-layer]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms);transform:translateY(10px)}') !== -1, 'mobile works cascade override is missing');
assert(html.indexOf('.is-motion-ready [data-motion-scene="works"].is-in-view [data-motion-layer]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms)}') !== -1, 'mobile works delay must override the more specific desktop in-view rule');

console.log('PASS task 3 motion scenes and interruptible gallery contract');

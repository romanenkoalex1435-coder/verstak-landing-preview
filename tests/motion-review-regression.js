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
var works = section('works');

assert(html.indexOf('data-motion-layer') === -1, 'the retired motion-layer contract must not wrap interactive content');
assert(!/class="brick-grid"[^>]*data-motion-decor/.test(builder), 'motion decor must not wrap builder bricks');
assert(/<div class="section-head">/.test(builder), 'unique builder heading must stay fully visible before scene entry');
assert(!/class="section-head"[^>]*data-motion-decor/.test(builder), 'builder heading must not use the hidden decorative entrance target');
assert(!/class="tabs-col"[^>]*data-motion-decor/.test(works), 'motion decor must not wrap gallery tabs');
assert(/<div class="section-head on-panel">/.test(works), 'unique gallery heading must stay fully visible before scene entry');
assert(!/class="section-head on-panel"[^>]*data-motion-decor/.test(works), 'gallery heading must not use the hidden decorative entrance target');
assert(!/class="stage-copy"[^>]*data-motion-decor/.test(works), 'motion decor must not wrap gallery navigation');
assert(!/class="gallery-foot"[^>]*data-motion-decor/.test(works), 'motion decor must not wrap gallery CTA');

assert(/<div class="stage-switch-surface" data-sx="stage">/.test(works), 'gallery stage must use an independent switch surface');
assert(html.indexOf('.stage-switch-surface{transition:opacity 180ms var(--ease),transform 180ms var(--ease)}') !== -1, 'switch surface must own its 180ms transition');
assert(html.indexOf('.stage-switch-surface.is-changing{opacity:.25;transform:translateY(8px)}') !== -1, 'switch state must use an independent selector');
assert(!/class="stage-switch-surface"[^>]*data-motion-decor/.test(works), 'scene entrance must not override gallery switch styles');

assert(core.indexOf("var motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;") !== -1, 'motion query must guard missing matchMedia');
assert(core.indexOf('var reduced = function () { return !!(motionQuery && motionQuery.matches); };') !== -1, 'reduced helper must tolerate a missing media query');
assert(core.indexOf('function onMotionChange(fn) {') !== -1, 'motion change helper is missing');
assert(core.indexOf("if (motionQuery.addEventListener) motionQuery.addEventListener('change', fn);") !== -1, 'motion helper must prefer addEventListener');
assert(core.indexOf("else if (motionQuery.addListener) motionQuery.addListener(fn);") !== -1, 'motion helper must support legacy addListener');
assert(core.indexOf('onMotionChange(sync);') !== -1, 'prototype motion subscription must use the guarded helper');

assert(html.indexOf('.is-motion-ready [data-motion-decor]{opacity:0;transform:translateY(18px)}') !== -1, 'desktop entrance must use decorative layers');
assert(html.indexOf('.is-motion-ready [data-motion-scene] [data-motion-decor]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms);transform:translateY(10px)}') !== -1, 'mobile entrance must use 10px distance and at most 70ms delays for every scene');
assert(html.indexOf('.is-motion-ready .hero.is-in-view .hero-route::after{height:128px}') !== -1, 'hero progress line must stop at the active third point');
assert(html.indexOf('.hero-route::after{transition-delay:70ms}') !== -1, 'mobile hero progress line delay must be capped at 70ms');

console.log('PASS motion accessibility and gallery transition regression contract');

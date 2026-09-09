'use strict';

var fs = require('fs');
var source = fs.readFileSync('assets/site-v09/core.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function functionBody(name) {
  var start = source.indexOf('function ' + name + '() {');
  assert(start !== -1, name + '() is missing');
  var open = source.indexOf('{', start), depth = 0;
  for (var i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(name + '() is not closed');
}

var sync = functionBody('sync');
var reduced = sync.indexOf('if (reduced()) {');
var noIo = sync.indexOf("if (!('IntersectionObserver' in window)) {");
var final = sync.indexOf('content(steps.length - 1);', noIo);
var normal = sync.indexOf('if (visible)', noIo);
var raf = sync.indexOf('requestAnimationFrame(tick)', noIo);

assert(reduced !== -1, 'reduced-motion branch is missing');
assert(noIo !== -1, 'no-IntersectionObserver final-state branch is missing');
assert(reduced < noIo, 'reduced-motion must keep precedence over the no-IntersectionObserver fallback');
assert(final > noIo && final < normal, 'no-IntersectionObserver fallback must set the final prototype state');
assert(raf > normal, 'no-IntersectionObserver fallback must exit before requestAnimationFrame');

console.log('PASS prototype fallback reaches final state without requestAnimationFrame');

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

var works = section('works');
assert(works.indexOf('works-scene') === -1, 'works section must not carry the old scroll-hijack scene wrapper');
assert(works.indexOf('data-scrub') === -1, 'works section must not carry the sticky-pin scrub attribute');
assert(works.indexOf('class="gallery-shell"') !== -1, 'works section must still render the compact tabs+stage gallery');
assert((works.match(/Структура будущего интерфейса на демонстрационных данных/g) || []).length === 1, 'works section must show exactly one demo-data disclaimer');
assert(works.indexOf('макет на демонстрационных данных') === -1, 'the duplicate stage-level demo-data caption must be gone');

assert(html.indexOf('.works-scene') === -1, 'no CSS should target the removed works-scene wrapper');
assert(html.indexOf('data-scrub') === -1, 'no CSS should target the removed data-scrub attribute');

assert(core.indexOf('initScrollScene') === -1, 'core.js must not contain the sticky-pin scroll scene initializer');
assert(core.indexOf('works-scene') === -1, 'core.js must not query the removed works-scene wrapper');
assert(core.indexOf('data-sx="niche"') === -1, 'core.js must not populate the removed niche field');

console.log('PASS works gallery has no scroll-hijack and a single demo-data disclaimer');

'use strict';

var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function section(id) {
  var start = html.indexOf('<section id="' + id + '"');
  assert(start !== -1, id + ' section is missing');
  var end = html.indexOf('</section>', start);
  assert(end !== -1, id + ' section is not closed');
  return { start: start, html: html.slice(start, end + '</section>'.length) };
}

var faq = section('faq');
var requestCta = section('request-cta');

assert(requestCta.start > faq.start, 'final request CTA must follow the FAQ');
assert(/<section id="request-cta"[^>]*class="[^"]*tone-warm[^"]*"[^>]*data-motion-scene="request-cta"/.test(requestCta.html), 'final CTA must be a warm request-cta motion scene');
assert(requestCta.html.indexOf('<div class="route-complete"') !== -1, 'final CTA must contain the completion indicator');
assert(requestCta.html.indexOf('Результат сохранён') !== -1, 'final CTA must retain the completion copy');
assert(/<a class="btn-primary" href="request\.html" data-sx="request-link">Оставить заявку<\/a>/.test(requestCta.html), 'final CTA must link to request.html');

var main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
assert(main.indexOf('<form') === -1 && main.indexOf('data-sx="form"') === -1, 'home page must not contain the old request form');

assert(/\.tone-transition\{height:clamp\(64px,10vw,140px\);background:linear-gradient\(to bottom,var\(--tone-from\),var\(--tone-to\)\);pointer-events:none\}/.test(html), 'tone transition must render a non-interactive linear gradient zone');
assert(html.indexOf('.tone-scene{transition:background-color') === -1, 'static tone scenes must not use a no-op background-color transition');

var transitions = html.match(/<div class="tone-transition"[^>]*><\/div>/g) || [];
assert(transitions.length === 3, 'neutral, Works, and final tones must be connected by three transition zones');
transitions.forEach(function (transition) {
  assert(/aria-hidden="true"/.test(transition), 'tone transition must stay out of the accessibility tree and tab order');
});

var works = section('works');
var beforeWorks = html.lastIndexOf('<div class="tone-transition"', works.start);
var afterWorks = html.indexOf('<div class="tone-transition"', works.start + works.html.length);
var beforeFinal = html.lastIndexOf('<div class="tone-transition"', requestCta.start);
assert(beforeWorks !== -1 && beforeWorks < works.start, 'neutral-to-Works transition is missing');
assert(afterWorks !== -1 && afterWorks > works.start && afterWorks < requestCta.start, 'Works-to-neutral transition is missing');
assert(beforeFinal !== -1 && beforeFinal < requestCta.start, 'neutral-to-final transition is missing');

console.log('PASS final CTA follows FAQ and tone transitions are real gradient zones');

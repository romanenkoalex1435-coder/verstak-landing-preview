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
assert(/<section id="request-cta"[^>]*data-motion-scene="request-cta"/.test(requestCta.html), 'final CTA must be a request-cta motion scene');
assert(requestCta.html.indexOf('<div class="route-complete"') !== -1, 'final CTA must contain the completion indicator');
assert(requestCta.html.indexOf('Результат сохранён') !== -1, 'final CTA must retain the completion copy');
assert(/<a class="btn-primary" href="request\.html" data-sx="request-link">Оставить заявку<\/a>/.test(requestCta.html), 'final CTA must link to request.html');

var main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
assert(main.indexOf('<form') === -1 && main.indexOf('data-sx="form"') === -1, 'home page must not contain the old request form');

/* Replaced the discrete per-section tone strips (.tone-transition / .tone-cool /
   .tone-works / .tone-warm) with a single scroll-driven ambient gradient, so the
   cold-to-warm transition is continuous instead of three fixed seams. */
assert(html.indexOf('<div class="scroll-aura"') !== -1 && /aria-hidden="true"/.test(html.slice(html.indexOf('<div class="scroll-aura"'), html.indexOf('<div class="scroll-aura"') + 60)), 'scroll aura layer must exist and stay out of the accessibility tree');
var auraBlobs = html.match(/<span class="aura-blob aura-blob--[abc]"><\/span>/g) || [];
assert(auraBlobs.length === 3, 'ambient gradient must render exactly three blurred blobs');
assert(html.indexOf('--aura-c1') !== -1 && html.indexOf('--aura-ax1') !== -1, 'aura blob position and color must be driven by scroll-linked custom properties');
assert(html.indexOf('.tone-transition') === -1 && html.indexOf('.tone-cool') === -1 && html.indexOf('.tone-works') === -1 && html.indexOf('.tone-warm') === -1, 'discrete tone-strip rules must not coexist with the ambient gradient');

console.log('PASS final CTA follows FAQ and the ambient gradient replaces the discrete tone strips');

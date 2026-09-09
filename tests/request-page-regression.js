'use strict';

var fs = require('fs');
var index = fs.readFileSync('index.html', 'utf8');
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync('request.html'), 'request page must exist');
var request = fs.readFileSync('request.html', 'utf8');

assert(request.indexOf('data-sx="form"') !== -1, 'request page must contain the form');
assert(request.indexOf('data-sx="form-section"') !== -1, 'request page must contain the form section');
assert(request.indexOf('data-sx="sum-rows"') !== -1, 'request page must contain summary rows');
assert(index.indexOf('data-sx="form"') === -1, 'home page must not contain the form');
assert(index.indexOf('href="#request"') === -1, 'home page must not link to a request anchor');

var requestLinks = index.match(/<a\b[^>]*data-sx="request-link"[^>]*>/g) || [];
assert(requestLinks.length === 4, 'header, builder, final CTA, and footer request CTAs must be marked');
requestLinks.forEach(function (link) {
  assert(/href="request\.html"/.test(link), 'request CTA must link to request.html');
});

assert(core.indexOf("sx-request-build-v1") !== -1, 'core must use the request build storage key');
assert(core.indexOf('sessionStorage.setItem') !== -1, 'core must save the request build');
assert(core.indexOf('sessionStorage.getItem') !== -1, 'core must restore the request build');

console.log('PASS request page structure and state transfer contract');

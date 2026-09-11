'use strict';

var fs = require('fs');
var index = fs.readFileSync('index.html', 'utf8');
var request = fs.readFileSync('request.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(index.indexOf('Онлайн-приём заявок отключён') !== -1, 'index footer must carry the prelaunch legal note');
assert(index.indexOf('не является офертой') !== -1, 'index footer must disclaim that the estimate is not an offer');
assert(request.indexOf('Данные остаются в браузере') !== -1, 'request page must disclose local-only handling before the form fields');
assert(request.indexOf('Онлайн-приём заявок отключён') !== -1, 'request page must carry the prelaunch legal note');
assert(request.indexOf('не является офертой') !== -1, 'request page must disclaim that the estimate is not an offer');

['index.html', 'request.html', 'assets/site-v09/core.js'].forEach(function (file) {
  var src = fs.readFileSync(file, 'utf8');
  assert(src.indexOf('SX_FORM_ENDPOINT') === -1, file + ' must not reference a serverless form endpoint');
});
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');
assert(core.indexOf('api.telegram.org') === -1, 'core.js must not wire up a Telegram Bot API delivery channel');
assert(core.indexOf('fetch(') === -1, 'core.js must not perform any network fetch');

assert(fs.existsSync('docs/legal-launch-checklist.md'), 'private prelaunch legal checklist must exist for the next launch step');
var checklist = fs.readFileSync('docs/legal-launch-checklist.md', 'utf8');
assert(checklist.indexOf('Роскомнадзор') !== -1, 'checklist must cover the Roskomnadzor notification step');
assert(checklist.indexOf('трансграничной передачи') !== -1, 'checklist must cover cross-border transfer review');

console.log('PASS prelaunch legal wording is present on both pages and the private checklist exists');

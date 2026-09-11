'use strict';

var fs = require('fs');
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');
var request = fs.readFileSync('request.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// The prelaunch legal decision (docs/legal-launch-checklist.md) removed the
// online submission path entirely: no fetch, no SX_FORM_ENDPOINT, no
// "delivered" success state. The form must only ever build local text.
assert(core.indexOf('fetch(') === -1, 'core.js must not perform any network fetch');
assert(core.indexOf('SX_FORM_ENDPOINT') === -1, 'core.js must not reference a form submission endpoint');
assert(core.indexOf('AbortController') === -1, 'core.js must not contain request-timeout plumbing for a network call');
assert(core.indexOf('Заявка доставлена') === -1, 'core.js must never claim the request was delivered');
assert(core.indexOf('form_success') === -1, 'core.js must not track a network form-success event');

var submitStart = core.indexOf("form.addEventListener('submit'");
assert(submitStart !== -1, 'submit handler is missing');
var submitEnd = core.indexOf('\n  })();', submitStart);
var submit = core.slice(submitStart, submitEnd);
assert(submit.indexOf('fallback.hidden = false') !== -1, 'submit handler must always reveal the local copy box');
assert(submit.indexOf("dataset.state = 'ok'") !== -1, 'submit handler must report the local ready state, not an error');

assert(request.indexOf('type="checkbox"') === -1, 'request page must not show a consent checkbox without a defined data operator');
assert(request.indexOf('Данные остаются в браузере') !== -1, 'request page must disclose that data stays in the browser before the fields');
assert(request.indexOf('Собрать текст заявки') !== -1, 'submit button must promise collecting text, not sending it');
assert(request.indexOf('Онлайн-приём заявок отключён') !== -1, 'request page must carry the prelaunch legal note');

console.log('PASS request form only ever builds local copyable text, never claims delivery');

'use strict';

var fs = require('fs');
var html = fs.readFileSync('request.html', 'utf8');
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

var request = section('request');
assert(/<section id="request"[^>]*data-sx="form-section"[^>]*data-motion-scene="request"/.test(request), 'request must be a request motion scene');
assert(/<section id="request"[^>]*class="[^"]*tone-scene[^\"]*tone-warm[^\"]*"/.test(request), 'request must use the warm scene tone');

var completion = '<div class="route-complete" data-motion-layer style="--motion-index:0" aria-label="Маршрут завершён">';
var completionAt = request.indexOf(completion);
var formAt = request.indexOf('<form data-sx="form"');
assert(completionAt !== -1, 'request completion indicator is missing');
assert(formAt !== -1 && completionAt < formAt, 'completion indicator must precede the form');
assert(request.indexOf('<span class="route-complete-mark" aria-hidden="true">✓</span>', completionAt) !== -1, 'completion mark is missing or exposed');
assert(request.indexOf('<span>Результат сохранён</span>', completionAt) !== -1, 'completion copy is missing');

assert(html.indexOf('.tone-warm{background:#ddd8d0}') !== -1, 'warm scene tone is missing');
assert(html.indexOf('.route-complete{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px;font-size:14px;font-weight:600}') !== -1, 'completion indicator layout is missing');
assert(html.indexOf('.route-complete-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ink-black);color:#fff;transform:scale(.7) rotate(-12deg)}') !== -1, 'completion mark initial state is missing');
assert(html.indexOf('.is-motion-ready .is-in-view .route-complete-mark{transform:none;transition:transform 520ms var(--motion-ease) 140ms}') !== -1, 'completion mark entrance is missing');
assert(html.indexOf('@media (prefers-reduced-motion:reduce){.route-complete-mark,.is-motion-ready .is-in-view .route-complete-mark{transform:none;transition:none}}') !== -1, 'completion mark reduced-motion state is missing');

var controlNames = ['name', 'contact', 'task', 'agree'];
var previous = -1;
controlNames.forEach(function (name) {
  var position = request.indexOf('name="' + name + '"');
  assert(position !== -1 && position > previous, name + ' control must retain native form order');
  previous = position;
});
var submitPosition = request.indexOf('type="submit" class="submit-btn"');
assert(submitPosition !== -1 && submitPosition > previous, 'submit button must follow the form fields');
assert(!/<(?:input|textarea|button)[^>]*\bdisabled(?:\s|=|>)/.test(request), 'request controls must not be disabled by the scene');
assert(!/<(?:input|textarea|button)[^>]*\baria-disabled(?:\s|=|>)/.test(request), 'request controls must not be aria-disabled by the scene');
assert(!/<(?:input|textarea|button)[^>]*\btabindex\s*=/.test(request), 'request controls must keep native focus order');
var motionStart = core.indexOf('  (function initMotionScenes() {');
var motionEnd = core.indexOf('\n  })();', motionStart);
assert(motionStart !== -1 && motionEnd !== -1, 'shared motion scene initializer is missing');
var motion = core.slice(motionStart, motionEnd);
assert(motion.indexOf("document.documentElement.classList.add('is-motion-ready');") !== -1, 'shared motion scene initializer must mark readiness');
assert(motion.indexOf("scene.classList.add('is-in-view');") !== -1, 'shared motion scene initializer must reveal scenes');
assert(motion.indexOf('.disabled') === -1 && motion.indexOf('tabIndex') === -1, 'motion initializer must not alter control enabled or focus state');

console.log('PASS task 4 request completion scene and form accessibility contract');

'use strict';

var fs = require('fs');
var vm = require('vm');
var core = fs.readFileSync('assets/site-v09/core.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* извлекаем только animateNumber, чтобы проверить логику токена изолированно,
   не поднимая весь модуль (он требует DOM/SX_DATA) */
var start = core.indexOf('function animateNumber');
assert(start !== -1, 'animateNumber must exist in core.js');
var end = core.indexOf('\n  }\n', start) + '\n  }\n'.length;
var fnSrc = core.slice(start, end);
assert(/numberAnimTokens\.set\(el, \{\}\);/.test(fnSrc) &&
  fnSrc.indexOf('numberAnimTokens.set(el, {});') < fnSrc.indexOf('if (!numberAnimTokens || isNaN(from) || from === to || reduced())'),
  'token must be invalidated before any early return, including the from===to short-circuit');

var rafQueue = [];
function fmt(n) { return String(n) + ' ₽'; }

var sandbox = {
  numberAnimTokens: new WeakMap(),
  reduced: function () { return false; },
  SX: { fmt: fmt },
  requestAnimationFrame: function (cb) { rafQueue.push(cb); },
  isNaN: isNaN,
  Math: Math,
  parseInt: parseInt,
  String: String
};
vm.createContext(sandbox);
vm.runInContext(fnSrc + '\nthis.animateNumber = animateNumber;', sandbox);

var el = { textContent: '60 000 ₽' };

/* воспроизводим сценарий codex: 60000 -> включить блок (старт анимации к 100000)
   -> сразу выключить обратно на 60000, пока на экране ещё старое значение */
sandbox.animateNumber(el, 100000);
assert(rafQueue.length === 1, 'first call must schedule one animation frame');

sandbox.animateNumber(el, 60000);
assert(el.textContent === fmt(60000), 'second call (from===to) must write the correct value immediately');

/* старый RAF должен видеть, что его токен инвалидирован, и не перезаписать текст */
var staleStep = rafQueue[0];
staleStep(16);
assert(el.textContent === fmt(60000), 'stale animation frame must not overwrite the reverted value with the old target');

console.log('PASS odometer token invalidation on rapid on/off toggle');

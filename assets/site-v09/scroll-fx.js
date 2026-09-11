/* ============================================================
   Скролл-эффекты: живой градиент фона, маршрутная нить, FAQ.
   Не зависит от core.js / data.js — читает только DOM и scroll.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = function () { return !!(motionQuery && motionQuery.matches); };

  /* ============================================================
     FAQ — тихий эксклюзивный аккордеон без чёрной заливки
     ============================================================ */
  (function () {
    var items = [].slice.call(document.querySelectorAll('[data-faq]'));
    if (!items.length) return;

    var list = document.querySelector('[data-faq-list]');
    if (list) list.classList.add('faq-js');

    function setOpen(item, open) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-panel');
      if (open) item.setAttribute('data-open', ''); else item.removeAttribute('data-open');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      if (!btn) return;
      setOpen(item, false);
      btn.addEventListener('click', function () {
        var wasOpen = item.hasAttribute('data-open');
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, !wasOpen);
      });
    });
  })();

  /* ============================================================
     Живой scroll-gradient: полноэкранное mesh-поле (3 радиальных
     массы + база), положение/угол/тон считаются напрямую от
     прокрутки, без бесконечной анимации.
     ============================================================ */
  (function () {
    var aura = document.querySelector('.scroll-aura');
    if (!aura) return;

    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

    var stops = [
      [0,   [244, 227, 208]],
      [0.5, [214, 214, 226]],
      [1,   [186, 209, 236]]
    ];
    function toneAt(f) {
      for (var i = 0; i < stops.length - 1; i++) {
        var a = stops[i], b = stops[i + 1];
        if (f >= a[0] && f <= b[0]) {
          var t = (b[0] === a[0]) ? 0 : (f - a[0]) / (b[0] - a[0]);
          return [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t), lerp(a[1][2], b[1][2], t)];
        }
      }
      return stops[stops.length - 1][1].slice();
    }
    function mixWhite(c, t) { return [lerp(c[0], 255, t), lerp(c[1], 255, t), lerp(c[2], 255, t)]; }

    var units = { x1: '%', y1: '%', x2: '%', y2: '%', x3: '%', y3: '%', angle: 'deg' };
    var scalarKeys = Object.keys(units);
    var colorKeys = ['c1', 'c2', 'c3'];
    var target = {
      x1: 15, y1: 20, x2: 50, y2: 35, x3: 85, y3: 80, angle: 135,
      c1: toneAt(0), c2: mixWhite(toneAt(0), .58), c3: toneAt(0)
    };
    var current = {
      x1: target.x1, y1: target.y1, x2: target.x2, y2: target.y2, x3: target.x3, y3: target.y3, angle: target.angle,
      c1: target.c1.slice(), c2: target.c2.slice(), c3: target.c3.slice()
    };
    var raf = 0;

    function computeTargets() {
      var max = root.scrollHeight - window.innerHeight;
      var f = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      /* холодная и тёплая массы: широкая амплитуда, центр может уходить за
         границы viewport (даём координатам выходить за 0-100%) */
      target.x1 = 50 + 55 * Math.sin(f * Math.PI * 0.9 + 0.3);
      target.y1 = 45 + 45 * Math.cos(f * Math.PI * 0.7);
      target.x3 = 50 + 55 * Math.cos(f * Math.PI * 0.8 + 1.1);
      target.y3 = 50 + 45 * Math.sin(f * Math.PI * 0.6);
      /* молочное ядро: держим ближе к центру, оно остаётся видимым фокусом света */
      target.x2 = 50 + 28 * Math.sin(f * Math.PI * 1.4);
      target.y2 = 38 + 24 * Math.cos(f * Math.PI * 1.0 + 0.6);
      target.angle = 110 + f * 170;
      target.c1 = toneAt(f);
      target.c2 = mixWhite(toneAt(f), .58);
      target.c3 = toneAt(clamp(f + 0.18, 0, 1));
    }

    function apply(withLerp) {
      var settled = true;
      scalarKeys.forEach(function (k) {
        if (withLerp) {
          current[k] = lerp(current[k], target[k], 0.09);
          if (Math.abs(current[k] - target[k]) > 0.5) settled = false;
        } else {
          current[k] = target[k];
        }
      });
      colorKeys.forEach(function (k) {
        if (withLerp) {
          current[k] = [
            lerp(current[k][0], target[k][0], 0.09),
            lerp(current[k][1], target[k][1], 0.09),
            lerp(current[k][2], target[k][2], 0.09)
          ];
          var d = Math.max(
            Math.abs(current[k][0] - target[k][0]),
            Math.abs(current[k][1] - target[k][1]),
            Math.abs(current[k][2] - target[k][2])
          );
          if (d > 0.5) settled = false;
        } else {
          current[k] = target[k].slice();
        }
      });
      scalarKeys.forEach(function (k) { root.style.setProperty('--mesh-' + k, current[k].toFixed(1) + units[k]); });
      colorKeys.forEach(function (k) { root.style.setProperty('--mesh-' + k, rgb(current[k])); });
      return settled;
    }

    function loop() {
      var settled = apply(true);
      raf = settled ? 0 : requestAnimationFrame(loop);
    }

    function onScroll() {
      computeTargets();
      if (reduced()) { apply(false); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    }

    computeTargets();
    apply(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  })();

  /* ============================================================
     Маршрутная нить: прототип → конструктор → работы → процесс → заявка
     ============================================================ */
  (function () {
    var thread = document.querySelector('[data-route-thread]');
    if (!thread) return;

    var stops = [].slice.call(thread.querySelectorAll('[data-route-target]'));
    var sections = stops.map(function (s) { return document.getElementById(s.getAttribute('data-route-target')); });
    if (!sections.length || sections.indexOf(null) > -1) return;

    function update() {
      var viewline = window.innerHeight * 0.4;
      var firstTop = sections[0].getBoundingClientRect().top + window.scrollY;
      var lastBottom = sections[sections.length - 1].getBoundingClientRect().bottom + window.scrollY;
      var span = Math.max(1, lastBottom - firstTop);
      var frac = Math.max(0, Math.min(1, ((window.scrollY + viewline) - firstTop) / span));
      thread.style.setProperty('--route-fill', (frac * 100).toFixed(1) + '%');

      var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= viewline) activeIndex = i;
      });
      if (atBottom) activeIndex = sections.length - 1;
      stops.forEach(function (stop, i) { stop.classList.toggle('is-active', i === activeIndex); });
      thread.classList.toggle('is-complete', activeIndex === sections.length - 1);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  })();
})();

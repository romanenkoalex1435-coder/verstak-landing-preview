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
     Живой scroll-gradient: 2-3 размытых пятна, положение и тон
     считаются напрямую от прокрутки, без бесконечной анимации.
     ============================================================ */
  (function () {
    var aura = document.querySelector('.scroll-aura');
    if (!aura) return;

    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

    var stops = [
      [0,    [207, 211, 216]],
      [0.35, [220, 220, 218]],
      [0.7,  [231, 221, 206]],
      [1,    [232, 221, 201]]
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

    var posKeys = ['ax1', 'ay1', 'ax2', 'ay2', 'ax3', 'ay3'];
    var colorKeys = ['c1', 'c2', 'c3'];
    var target = { ax1: 0, ay1: 0, ax2: 0, ay2: 0, ax3: 0, ay3: 0, c1: toneAt(0), c2: mixWhite(toneAt(0), .4), c3: toneAt(0) };
    var current = {
      ax1: 0, ay1: 0, ax2: 0, ay2: 0, ax3: 0, ay3: 0,
      c1: target.c1.slice(), c2: target.c2.slice(), c3: target.c3.slice()
    };
    var raf = 0;

    function computeTargets() {
      var max = root.scrollHeight - window.innerHeight;
      var f = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      var w = window.innerWidth, h = window.innerHeight;
      target.ax1 = w * 0.16 * Math.sin(f * Math.PI * 1.3);
      target.ay1 = h * 0.22 * (f - 0.5);
      target.ax2 = w * -0.14 * Math.sin(f * Math.PI * 1.7 + 1);
      target.ay2 = h * 0.18 * Math.cos(f * Math.PI * 1.1);
      target.ax3 = w * 0.10 * Math.cos(f * Math.PI * 0.8);
      target.ay3 = h * 0.25 * (f - 0.5);
      target.c1 = toneAt(f);
      target.c2 = mixWhite(toneAt(f), .4);
      target.c3 = toneAt(clamp(f + 0.18, 0, 1));
    }

    function apply(withLerp) {
      var settled = true;
      posKeys.forEach(function (k) {
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
      posKeys.forEach(function (k) { root.style.setProperty('--aura-' + k, current[k].toFixed(1) + 'px'); });
      colorKeys.forEach(function (k) { root.style.setProperty('--aura-' + k, rgb(current[k])); });
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

      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= viewline) activeIndex = i;
      });
      stops.forEach(function (stop, i) { stop.classList.toggle('is-active', i === activeIndex); });
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

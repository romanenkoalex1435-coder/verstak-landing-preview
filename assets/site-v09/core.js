/* ============================================================
   Функциональное ядро сайта.
   Логика использует data-атрибуты, чтобы визуальная система
   оставалась независимой от поведения и расчётов.
   ============================================================ */
(function () {
  'use strict';

  var D = window.SX_DATA;
  if (!D) { console.warn('SX: data.js не подключён'); return; }

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = function () { return !!(motionQuery && motionQuery.matches); };
  function onMotionChange(fn) {
    if (!motionQuery) return;
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', fn);
    else if (motionQuery.addListener) motionQuery.addListener(fn);
  }

  /* одометр: плавно перематывает отображаемое число вместо мгновенной подмены */
  var numberAnimTokens = typeof WeakMap === 'function' ? new WeakMap() : null;
  function animateNumber(el, to) {
    var from = parseInt(String(el.textContent || '').replace(/\D/g, ''), 10);
    if (numberAnimTokens) numberAnimTokens.set(el, {});
    if (!numberAnimTokens || isNaN(from) || from === to || reduced()) {
      el.textContent = SX.fmt(to);
      return;
    }
    var token = {};
    numberAnimTokens.set(el, token);
    var start = null;
    var duration = 420;
    function step(ts) {
      if (numberAnimTokens.get(el) !== token) return;
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = SX.fmt(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  (function initMotionScenes() {
    var scenes = $$('[data-motion-scene]');
    if (!scenes.length) return;
    document.documentElement.classList.add('is-motion-ready');
    function show(scene) { scene.classList.add('is-in-view'); }
    if (reduced() || !('IntersectionObserver' in window)) {
      scenes.forEach(show);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.18 });
    scenes.forEach(function (scene) { observer.observe(scene); });
  })();

  /* ---------- состояние сборки ---------- */
  var SX = (function () {
    var listeners = [];
    var chosen = D.modules.filter(function (m) { return m.preset; }).map(function (m) { return m.id; });

    function mods() {
      return D.modules.filter(function (m) { return chosen.indexOf(m.id) > -1; });
    }
    function total() {
      return D.base.price + mods().reduce(function (a, m) { return a + m.price; }, 0);
    }
    function weeks() {
      return Math.min(6, 2 + Math.ceil(mods().length / 3));
    }
    function fmt(n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
    }
    function weeksText(n) {
      var d = n % 100, t = n % 10;
      if (d >= 11 && d <= 14) return n + ' недель';
      if (t === 1) return n + ' неделя';
      if (t >= 2 && t <= 4) return n + ' недели';
      return n + ' недель';
    }
    function snapshot() {
      return { modules: mods(), total: total(), weeks: weeks(),
               weeksText: weeksText(weeks()), base: D.base };
    }
    function emit() {
      var s = snapshot();
      listeners.forEach(function (fn) { try { fn(s); } catch (e) {} });
    }
    return {
      get: snapshot,
      fmt: fmt,
      ids: function () { return chosen.slice(); },
      restore: function (ids) {
        if (!Array.isArray(ids)) return;
        chosen = ids.filter(function (id) { return D.modules.some(function (m) { return m.id === id; }); });
        emit();
      },
      has: function (id) { return chosen.indexOf(id) > -1; },
      toggle: function (id) {
        var i = chosen.indexOf(id);
        if (i > -1) chosen.splice(i, 1); else chosen.push(id);
        emit();
      },
      baseOnly: function () { chosen = []; emit(); },
      on: function (fn) { listeners.push(fn); fn(snapshot()); }
    };
  })();
  window.SX = SX;

  var requestBuildKey = 'sx-request-build-v1';

  if ($('[data-sx="form"]')) {
    try {
      var savedBuild = JSON.parse(sessionStorage.getItem(requestBuildKey));
      SX.restore(savedBuild && savedBuild.ids);
    } catch (e) {}
  }

  $$('[data-sx="request-link"]').forEach(function (link) {
    link.addEventListener('click', function () {
      try {
        sessionStorage.setItem(requestBuildKey, JSON.stringify({ ids: SX.ids() }));
      } catch (e) {}
    });
  });

  /* аналитика-заглушка: реального приёмника нет */
  window.sxTrack = window.sxTrack || function () {};

  /* ============================================================
     1. КОНСТРУКТОР
     ============================================================ */
  (function () {
    var root = $('[data-sx="constructor"]');
    if (!root) return;

    var bricks = $$('[data-sx-brick]', root);
    var hint = $('[data-sx="preset-hint"]', root);
    var touched = false;
    var prevIds = null;

    function dropHint() {
      if (hint && hint.parentNode) { hint.parentNode.removeChild(hint); hint = null; }
    }

    bricks.forEach(function (el) {
      var id = el.getAttribute('data-sx-brick');
      if (el.tagName !== 'BUTTON') {
        el.setAttribute('role', 'button');
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      }
      function toggle() {
        if (!touched) { touched = true; dropHint(); }
        SX.toggle(id);
        window.sxTrack('constructor_change', { count: SX.get().modules.length });
      }
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    var baseBtn = $('[data-sx="base-only"]', root);
    if (baseBtn) baseBtn.addEventListener('click', function () {
      touched = true; dropHint(); SX.baseOnly();
      window.sxTrack('constructor_reset_to_base');
    });

    SX.on(function (s) {
      bricks.forEach(function (el) {
        var on = SX.has(el.getAttribute('data-sx-brick'));
        el.setAttribute('aria-pressed', String(on));
        el.classList.toggle('is-on', on);
      });

      $$('[data-sx="total"]', root).forEach(function (el) { animateNumber(el, s.total); });
      $$('[data-sx="weeks"]', root).forEach(function (el) { el.textContent = s.weeksText; });

      var stack = $('[data-sx="stack"]', root);
      if (stack) {
        var currentIds = s.modules.map(function (m) { return m.id; });
        var addedId = prevIds
          ? currentIds.filter(function (id) { return prevIds.indexOf(id) === -1; })[0]
          : null;

        stack.replaceChildren();
        var settlingRow = null;
        s.modules.slice().reverse().forEach(function (m) {
          var row = document.createElement('div');
          row.className = 'sx-stack-row';
          var n = document.createElement('span'); n.textContent = m.name;
          var p = document.createElement('b'); p.textContent = m.price.toLocaleString('ru-RU');
          row.append(n, p);
          stack.appendChild(row);
          if (m.id === addedId && !reduced()) { row.classList.add('is-settling'); settlingRow = row; }
        });
        var core = document.createElement('div');
        core.className = 'sx-stack-row is-base';
        var cn = document.createElement('span'); cn.textContent = D.base.name;
        var cp = document.createElement('b'); cp.textContent = D.base.price.toLocaleString('ru-RU');
        core.append(cn, cp);
        stack.appendChild(core);

        var ghost = $('[data-sx="stack-ghost"]', root);
        if (ghost) stack.insertBefore(ghost, stack.firstChild);

        if (settlingRow) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { settlingRow.classList.remove('is-settling'); });
          });
        }
        prevIds = currentIds;
      }
    });
  })();

  /* ============================================================
     2. СВОДКА В ФОРМЕ + ОТПРАВКА
     ============================================================ */
  (function () {
    var form = $('[data-sx="form"]');
    if (!form) return;

    var status   = $('[data-sx="status"]');
    var btn      = $('[data-sx="submit"]', form) || $('[data-sx="submit"]');
    var fallback = $('[data-sx="fallback"]');
    var started = false;

    /* --- живая сводка --- */
    SX.on(function (s) {
      var t = $('[data-sx="sum-total"]');
      if (t) animateNumber(t, s.total);
      var w = $('[data-sx="sum-weeks"]');
      if (w) w.textContent = s.weeksText;

      var rows = $('[data-sx="sum-rows"]');
      if (rows) {
        rows.replaceChildren();
        var add = function (text) {
          var p = document.createElement('p');
          p.className = 'sx-sum-row';
          p.textContent = text;
          rows.appendChild(p);
        };
        add(D.base.name + ' — ' + SX.fmt(D.base.price));
        s.modules.forEach(function (m) { add(m.name + ' — ' + SX.fmt(m.price)); });
      }
      var hidBuild = form.querySelector('[name="build"]');
      if (hidBuild) hidBuild.value = s.modules.map(function (m) { return m.name; }).join(', ');
      var hidTotal = form.querySelector('[name="total"]');
      if (hidTotal) hidTotal.value = String(s.total);
    });

    /* --- валидация --- */
    function fieldOf(n) { return form.querySelector('[name="' + n + '"]'); }

    function setErr(name, msg) {
      var f = fieldOf(name);
      var box = $('[data-sx-err="' + name + '"]', form);
      if (f) {
        f.setAttribute('aria-invalid', msg ? 'true' : 'false');
        f.classList.toggle('is-invalid', !!msg);
        if (box && box.id) f.setAttribute('aria-describedby', box.id);
      }
      if (box) { box.textContent = msg || ''; box.hidden = !msg; }
    }

    function validate() {
      var bad = [];
      var name = fieldOf('name'), contact = fieldOf('contact');

      if (name) {
        if (!name.value.trim()) { setErr('name', 'Напишите, как к вам обращаться'); bad.push(name); }
        else setErr('name', '');
      }
      if (contact) {
        var c = contact.value.trim();
        var okPhone = /^[+()\-\s\d]{7,}$/.test(c) && c.replace(/\D/g, '').length >= 7;
        var okTg = /^@?[A-Za-z0-9_]{4,}$/.test(c);
        if (!c) { setErr('contact', 'Оставьте телефон или Telegram — иначе не сможем ответить'); bad.push(contact); }
        else if (!okPhone && !okTg) { setErr('contact', 'Похоже на опечатку. Телефон или @имя в Telegram'); bad.push(contact); }
        else setErr('contact', '');
      }
      return bad;
    }

    form.addEventListener('input', function (e) {
      if (!started) { started = true; window.sxTrack('form_start'); }
      var n = e.target.getAttribute('name');
      if (n && e.target.getAttribute('aria-invalid') === 'true') validate();
    });

    /* --- копирование текста заявки --- */
    var copyBtn = $('[data-sx="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var t = $('[data-sx="fallback-text"]');
      if (!t) return;
      t.select();
      try {
        document.execCommand('copy');
        var old = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано';
        setTimeout(function () { copyBtn.textContent = old; }, 2000);
      } catch (e) {}
    });

    /* онлайн-приёма нет и не планируется в этом прелонче (правовое решение,
       см. docs/legal-launch-checklist.md) — форма всегда собирает текст
       локально и никогда не сообщает о «доставке» */
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var bad = validate();
      if (bad.length) {
        if (status) { status.textContent = 'Проверьте отмеченные поля'; status.dataset.state = 'bad'; }
        window.sxTrack('form_error', { fields: bad.length });
        bad[0].focus();
        return;
      }

      var s = SX.get();
      var payload = {
        name: (fieldOf('name') || {}).value || '',
        contact: (fieldOf('contact') || {}).value || '',
        task: ((fieldOf('task') || {}).value || '').trim(),
        build: s.modules.map(function (m) { return m.name; }),
        total: s.total, weeks: s.weeks
      };
      payload.name = payload.name.trim();
      payload.contact = payload.contact.trim();

      if (status) { status.textContent = 'Текст обращения готов — скопируйте его ниже и пришлите нам.'; status.dataset.state = 'ok'; }
      window.sxTrack('form_text_ready', { total: payload.total });

      if (fallback) {
        fallback.hidden = false;
        var t = $('[data-sx="fallback-text"]', fallback) || $('textarea', fallback);
        if (t) t.value = 'Обращение с сайта\n' +
          'Имя: ' + payload.name + '\n' +
          'Контакт: ' + payload.contact + '\n' +
          'Задача: ' + (payload.task || '—') + '\n' +
          'Состав: ' + (payload.build.length ? payload.build.join(', ') : 'только базовый') + '\n' +
          'Предварительно: ' + SX.fmt(payload.total);
        fallback.scrollIntoView({ block: 'nearest' });
      }
    });
  })();

  /* ============================================================
     3. ГАЛЕРЕЯ ДЕМО-ИНТЕРФЕЙСОВ
     ============================================================ */
  (function () {
    var root = $('[data-sx="gallery"]');
    if (!root) return;

    var cases = D.cases;
    var tabs  = $$('[data-sx-tab]', root);
    var stage = $('[data-sx="stage"]', root);
    var shot  = $('[data-sx="shot"]', root);
    var i = 0, timer = 0;

    var tablist = $('[data-sx="tabs"]', root);
    if (tablist) { tablist.setAttribute('role', 'tablist'); tablist.setAttribute('aria-label', 'Демонстрационные кейсы'); }
    if (stage) { stage.id = stage.id || 'sx-gallery-panel'; stage.setAttribute('role', 'tabpanel'); }

    function put(sel, text) { var el = $(sel, root); if (el) el.textContent = text; }

    function render() {
      var c = cases[i];
      if (shot) {
        shot.replaceChildren();
        var head = document.createElement('div'); head.className = 'stage-mock-head';
        var headLabel = document.createElement('span'); headLabel.textContent = c.caption;
        var headDot = document.createElement('span'); headDot.className = 'stage-mock-dot';
        head.append(headLabel, headDot);
        shot.appendChild(head);
        c.rows.forEach(function (r) {
          var row = document.createElement('div'); row.className = 'stage-mock-row';
          var left = document.createElement('div');
          var t = document.createElement('p'); t.className = 'stage-mock-row-title'; t.textContent = r.title;
          var m = document.createElement('p'); m.className = 'stage-mock-row-meta'; m.textContent = r.meta;
          left.append(t, m);
          var tag = document.createElement('span'); tag.className = 'stage-mock-tag'; tag.textContent = r.tag;
          row.append(left, tag);
          shot.appendChild(row);
        });
      }
      put('[data-sx="caption"]', c.caption);
      put('[data-sx="case-title"]', c.title);
      put('[data-sx="case-lead"]', c.lead);
      put('[data-sx="count"]', (i + 1) + ' / ' + cases.length);

      var feat = $('[data-sx="features"]', root);
      if (feat) {
        feat.replaceChildren();
        c.features.forEach(function (text, k) {
          var row = document.createElement('div'); row.className = 'sx-feat-row';
          var n = document.createElement('i'); n.textContent = '0' + (k + 1);
          var s = document.createElement('span'); s.textContent = text;
          row.append(n, s); feat.appendChild(row);
        });
      }
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-on', k === i);
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      var pr = $('[data-sx="progress"]', root);
      if (pr) pr.style.width = ((i + 1) / cases.length * 100) + '%';
      if (stage) { stage.classList.remove('is-changing'); stage.setAttribute('aria-busy', 'false'); }
      if (stage && tabs[i]) stage.setAttribute('aria-labelledby', tabs[i].id);
    }

    function show(n, immediate) {
      i = (n + cases.length) % cases.length;
      clearTimeout(timer);
      if (immediate || reduced() || !stage) { render(); return; }
      stage.classList.add('is-changing');
      stage.setAttribute('aria-busy', 'true');
      timer = setTimeout(render, 180);
    }

    tabs.forEach(function (t, k) {
      t.id = t.id || 'sx-gallery-tab-' + k;
      t.setAttribute('role', 'tab');
      if (stage) t.setAttribute('aria-controls', stage.id);
      if (t.tagName !== 'BUTTON') { t.setAttribute('tabindex', '-1'); }
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        var n = k, L = cases.length;
        if (e.key === 'ArrowRight') n = (k + 1) % L;
        else if (e.key === 'ArrowLeft') n = (k + L - 1) % L;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = L - 1;
        else if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        show(n);
        tabs[n].focus({ preventScroll: true });
        tabs[n].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    });

    var prev = $('[data-sx="prev"]', root), next = $('[data-sx="next"]', root);
    [[prev, -1], [next, 1]].forEach(function (pair) {
      var el = pair[0], dir = pair[1];
      if (!el) return;
      if (el.tagName !== 'BUTTON') { el.setAttribute('role', 'button'); el.tabIndex = 0; }
      el.setAttribute('aria-label', dir > 0 ? 'Следующий кейс' : 'Предыдущий кейс');
      var go = function () { show(i + dir); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });

    show(i, true);
  })();

  /* ============================================================
     4. ПРОТОТИП ЗАЯВКИ — цикл 14 с, пауза вне экрана
     ============================================================ */
  (function () {
    var root = $('[data-sx="proto"]');
    if (!root) return;

    var steps = D.protoSteps;
    var bars  = $$('[data-sx="proto-bars"] > *', root);
    var row   = $('[data-sx="proto-active"]', root);
    var detail = $('[data-sx="proto-detail"]', root);
    var visible = false, raf = 0, last = 0, elapsed = 0, phase = -1, cycle = -1;

    function put(sel, text) { var el = $(sel, root); if (el) el.textContent = text; }

    function content(k) {
      var s = steps[k];
      put('[data-sx="proto-status"]', s[0]);
      put('[data-sx="proto-person"]', k ? 'Бригада 3' : 'Не назначен');
      put('[data-sx="proto-title"]', s[1]);
      put('[data-sx="proto-text"]', s[2]);
      bars.forEach(function (b, n) { b.classList.toggle('is-on', n <= k); });
      var routeStage = Math.min(k, 3);
      root.dataset.routeStage = String(routeStage);
      $$('[data-stage]', root).forEach(function (el) {
        var active = Number(el.getAttribute('data-stage')) === routeStage;
        el.classList.toggle('is-active', active);
        if (active) el.setAttribute('aria-current', 'step');
        else el.removeAttribute('aria-current');
      });
      root.dataset.phase = s[0];
    }

    function paint() {
      var t = elapsed % 14000;
      var c = Math.floor(elapsed / 14000);
      var next = Math.min(steps.length - 1, Math.floor(t / 2600));
      var age = t - next * 2600;
      if (c !== cycle || next !== phase) { cycle = c; phase = next; content(next); }
      var shown = t >= 100 && t < 13300;
      if (row) {
        row.classList.toggle('is-visible', shown);
        row.setAttribute('aria-hidden', String(!shown));
        row.classList.toggle('is-pulse', shown && age < 600);
      }
      if (detail) detail.classList.toggle('is-changing', (t >= 13300) || (next < steps.length - 1 && age >= 2200));
    }

    function tick(now) {
      if (last) elapsed += now - last;
      last = now;
      paint();
      raf = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (reduced()) {
        content(steps.length - 1);
        if (row) { row.classList.add('is-visible'); row.classList.remove('is-pulse'); row.setAttribute('aria-hidden', 'false'); }
        if (detail) detail.classList.remove('is-changing');
        root.dataset.running = 'false';
        return;
      }
      if (!('IntersectionObserver' in window)) {
        content(steps.length - 1);
        if (row) { row.classList.add('is-visible'); row.classList.remove('is-pulse'); row.setAttribute('aria-hidden', 'false'); }
        if (detail) detail.classList.remove('is-changing');
        root.dataset.running = 'false';
        return;
      }
      if (visible) { root.dataset.running = 'true'; raf = requestAnimationFrame(tick); }
      else { root.dataset.running = 'false'; }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        sync();
      }, { threshold: 0.25 }).observe(root);
    } else { visible = true; }

    onMotionChange(sync);
    content(0);
    sync();
  })();

  /* ============================================================
     5. ГОД В ПОДВАЛЕ
     ============================================================ */
  $$('[data-sx="year"]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

/* ============================================================
   VERSTAK v10 — функциональное ядро.
   Логика отделена от разметки через data-атрибуты.
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
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }

  /* ============================================================
     0. SCROLL REVEAL + HEADER COMPACTION
     ============================================================ */
  (function initMotionScenes() {
    var scenes = $$('[data-motion-scene]');
    document.documentElement.classList.add('is-motion-ready');
    function show(scene) { scene.classList.add('is-in-view'); }
    if (!scenes.length) return;
    if (reduced() || !('IntersectionObserver' in window)) { scenes.forEach(show); return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.16 });
    scenes.forEach(function (scene) { observer.observe(scene); });
  })();

  (function initHeaderScroll() {
    var header = $('.site-header');
    if (!header) return;
    var ticking = false;
    function paint() {
      header.classList.toggle('is-compact', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(paint); ticking = true; }
    }, { passive: true });
    paint();
  })();

  (function initMobileNav() {
    var toggle = $('[data-sx="nav-toggle"]');
    var panel = $('[data-sx="nav-mobile"]');
    if (!toggle || !panel) return;
    function close() {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('nav-lock');
    }
    function open() {
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('nav-lock');
    }
    toggle.addEventListener('click', function () {
      panel.classList.contains('is-open') ? close() : open();
    });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ============================================================
     1. СИГНАТУРНЫЙ ПЕРЕКЛЮЧАТЕЛЬ — одна система, разная логика
     ============================================================ */
  (function initSwitcher() {
    var root = $('[data-sx="switcher"]');
    if (!root) return;
    var types = D.businessTypes;
    var tabs = $$('[data-sx-switch]', root);
    var stage = $('[data-sx="switch-stage"]', root);
    var idx = 0;

    function render() {
      var t = types[idx];
      var objRow = $('[data-sx="sw-objects"]', root);
      if (objRow) {
        objRow.replaceChildren();
        t.objects.forEach(function (name, k) {
          var b = document.createElement('span');
          b.className = 'sw-object' + (k === 0 ? ' is-primary' : '');
          b.textContent = name;
          objRow.appendChild(b);
        });
      }
      var flow = $('[data-sx="sw-flow"]', root);
      if (flow) {
        flow.replaceChildren();
        t.flow.forEach(function (step, k) {
          var node = document.createElement('span');
          node.className = 'sw-flow-step' + (k === t.flow.length - 1 ? ' is-last' : '');
          node.textContent = step;
          flow.appendChild(node);
          if (k < t.flow.length - 1) {
            var arrow = document.createElement('span');
            arrow.className = 'sw-flow-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';
            flow.appendChild(arrow);
          }
        });
      }
      var setText = function (sel, val) { var el = $(sel, root); if (el) el.textContent = val; };
      setText('[data-sx="sw-record-label"]', t.recordLabel);
      setText('[data-sx="sw-record-title"]', t.recordTitle);
      setText('[data-sx="sw-record-meta"]', t.recordMeta);
      setText('[data-sx="sw-record-assignee"]', t.recordAssignee);
      setText('[data-sx="sw-record-time"]', t.recordTime);
      setText('[data-sx="sw-record-status"]', t.recordStatus);

      tabs.forEach(function (tab, k) {
        var on = k === idx;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', String(on));
      });
    }

    function go(n) {
      idx = (n + types.length) % types.length;
      if (stage && !reduced()) {
        stage.classList.add('is-switching');
        setTimeout(function () { stage.classList.remove('is-switching'); render(); }, 140);
      } else {
        render();
      }
    }

    tabs.forEach(function (tab, k) {
      tab.setAttribute('role', 'tab');
      tab.addEventListener('click', function () { go(k); });
    });

    render();

    /* лёгкий автопереход, останавливается при взаимодействии и вне экрана */
    var auto = null, userTouched = false, visible = false;
    function startAuto() {
      if (auto || userTouched || reduced()) return;
      auto = setInterval(function () { go(idx + 1); }, 4200);
    }
    function stopAuto() { clearInterval(auto); auto = null; }
    root.addEventListener('pointerdown', function () { userTouched = true; stopAuto(); }, { once: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) startAuto(); else stopAuto();
      }, { threshold: 0.5 }).observe(root);
    } else { startAuto(); }
    onMotionChange(function () { if (reduced()) stopAuto(); });
  })();

  window.sxTrack = window.sxTrack || function () {};

  /* ============================================================
     2. КАЛЬКУЛЯТОР — предварительная оценка стоимости
     ============================================================ */
  (function initCalculator() {
    var root = $('[data-sx="calc"]');
    if (!root) return;
    var chosen = [];
    function weeksText(n) {
      var d = n % 100, t = n % 10;
      if (d >= 11 && d <= 14) return n + ' недель';
      if (t === 1) return n + ' неделя';
      if (t >= 2 && t <= 4) return n + ' недели';
      return n + ' недель';
    }
    function render() {
      var mods = D.modules.filter(function (m) { return chosen.indexOf(m.id) > -1; });
      var total = D.base.price + mods.reduce(function (a, m) { return a + m.price; }, 0);
      var weeks = Math.min(6, 2 + Math.ceil(mods.length / 3));
      $$('[data-sx-chip]', root).forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chosen.indexOf(chip.getAttribute('data-sx-chip')) > -1));
      });
      var totalEl = $('[data-sx="calc-total"]');
      if (totalEl) totalEl.textContent = fmt(total);
      var weeksEl = $('[data-sx="calc-weeks"]');
      if (weeksEl) weeksEl.textContent = weeksText(weeks);
    }
    $$('[data-sx-chip]', root).forEach(function (chip) {
      chip.addEventListener('click', function () {
        var id = chip.getAttribute('data-sx-chip');
        var i = chosen.indexOf(id);
        if (i > -1) chosen.splice(i, 1); else chosen.push(id);
        render();
      });
    });
    render();
  })();

  /* ============================================================
     3. ФОРМА
     ============================================================ */
  (function () {
    var form = $('[data-sx="form"]');
    if (!form) return;
    var status = $('[data-sx="status"]');
    var btn = $('[data-sx="submit"]', form) || $('[data-sx="submit"]');
    var fallback = $('[data-sx="fallback"]');
    var sending = false, sent = false, started = false;

    function fieldOf(n) { return form.querySelector('[name="' + n + '"]'); }
    function setErr(name, msg) {
      var f = fieldOf(name);
      var box = $('[data-sx-err="' + name + '"]', form);
      if (f) { f.setAttribute('aria-invalid', msg ? 'true' : 'false'); f.classList.toggle('is-invalid', !!msg); if (box && box.id) f.setAttribute('aria-describedby', box.id); }
      if (box) { box.textContent = msg || ''; box.hidden = !msg; }
    }
    function validate() {
      var bad = [];
      var name = fieldOf('name'), contact = fieldOf('contact');
      if (name) { if (!name.value.trim()) { setErr('name', 'Напишите, как к вам обращаться'); bad.push(name); } else setErr('name', ''); }
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

    var copyBtn = $('[data-sx="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var t = $('[data-sx="fallback-text"]');
      if (!t) return;
      t.select();
      try { document.execCommand('copy'); var old = copyBtn.textContent; copyBtn.textContent = 'Скопировано'; setTimeout(function () { copyBtn.textContent = old; }, 2000); } catch (e) {}
    });

    /* Prelaunch: online submission stays off until the legal/PDn baseline is
       closed (see docs/legal-launch-checklist.md) — no fetch is attempted,
       ever. The form only assembles text locally for the person to copy. */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sent) return;

      var bad = validate();
      if (bad.length) {
        if (status) { status.textContent = 'Проверьте отмеченные поля'; status.dataset.state = 'bad'; }
        window.sxTrack('form_error', { fields: bad.length });
        bad[0].focus();
        return;
      }

      var payload = {
        name: (fieldOf('name') || {}).value.trim() || '',
        contact: (fieldOf('contact') || {}).value.trim() || '',
        company: (fieldOf('company') || {}).value.trim() || '',
        task: ((fieldOf('task') || {}).value || '').trim()
      };

      sent = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Текст собран ниже'; }
      if (status) { status.textContent = 'Онлайн-приём заявок отключён. Текст обращения собран ниже — скопируйте и пришлите нам напрямую.'; status.dataset.state = 'ok'; }
      window.sxTrack('form_assembled', {});

      if (fallback) {
        fallback.hidden = false;
        var t = $('[data-sx="fallback-text"]', fallback) || $('textarea', fallback);
        if (t) t.value = 'Обращение с сайта\n' +
          'Имя: ' + payload.name + '\n' +
          'Контакт: ' + payload.contact + '\n' +
          'Компания: ' + (payload.company || '—') + '\n' +
          'Что сейчас вручную: ' + (payload.task || '—');
      }
    });
  })();

  $$('[data-sx="year"]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();

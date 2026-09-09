# Scroll Story Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Связать ключевые части лендинга спокойной скролл-историей маршрута заявки, слоистыми появлениями интерфейсов и мягкой сменой температуры фона.

**Architecture:** Разметка сцен и слоёв хранится в `index.html`, а общий контроллер появления — в отдельном IIFE-модуле `core.js`. Существующий модуль прототипа остаётся источником его текущей стадии и сообщает её через `data-route-stage`; CSS отображает движение через классы и data-атрибуты без сторонних библиотек.

**Tech Stack:** HTML, CSS, vanilla JavaScript, IntersectionObserver, requestAnimationFrame, Vercel.

## Global Constraints

- Маршрут появляется только в хиро, прототипе и финальном CTA.
- Конструктор и работы получают слоистое появление без сквозного маршрута.
- Анимируются преимущественно `transform`, `opacity` и CSS-переменные цвета.
- Управление и форма доступны до завершения движения.
- При `prefers-reduced-motion: reduce` сразу отображаются конечные состояния.
- При отсутствии `IntersectionObserver` сразу отображаются конечные состояния.
- Не добавлять внешние библиотеки, чужие ассеты и бесконечные декоративные циклы.
- Не менять тексты оффера, расчёт цены, отправку формы, тарифы, данные проектов и навигацию.

---

### Task 1: Базовая система сцен и движение хиро

**Files:**
- Modify: `index.html:35-270`
- Modify: `index.html:704-733`
- Modify: `assets/site-v09/core.js:1-20`
- Modify: `assets/site-v09/core.js:500-520`

**Interfaces:**
- Consumes: `[data-motion-scene]`, `[data-motion-layer]`, `prefers-reduced-motion`.
- Produces: класс `.is-motion-ready` на `html`, класс `.is-in-view` на сцене, CSS-переменная `--motion-index` на слое.

- [ ] **Step 1: Зафиксировать отсутствие новой системы**

```bash
! rg "data-motion-scene|is-motion-ready|initMotionScenes" index.html assets/site-v09/core.js
```

Expected: команда завершается с кодом 0.

- [ ] **Step 2: Пометить хиро как сцену и четыре этапа как слои**

```html
<section class="hero" data-motion-scene="hero">
  ...
  <div class="hero-route-step" data-motion-layer style="--motion-index:0">...</div>
  <div class="hero-route-step" data-motion-layer style="--motion-index:1">...</div>
  <div class="hero-route-step is-current" data-motion-layer style="--motion-index:2">...</div>
  <div class="hero-route-step" data-motion-layer style="--motion-index:3">...</div>
</section>
```

- [ ] **Step 3: Добавить CSS-контракт сцен**

```css
:root{--motion-ease:cubic-bezier(.22,1,.36,1);--motion-enter:520ms}
.is-motion-ready [data-motion-layer]{opacity:0;transform:translateY(18px)}
.is-motion-ready [data-motion-scene].is-in-view [data-motion-layer]{opacity:1;transform:none;transition:opacity var(--motion-enter) var(--motion-ease),transform var(--motion-enter) var(--motion-ease);transition-delay:calc(var(--motion-index,0) * 80ms)}
.hero-route::after{content:"";position:absolute;left:18px;top:35px;width:1px;height:0;background:var(--ink-black);transition:height 720ms var(--motion-ease) 120ms}
.is-motion-ready .hero.is-in-view .hero-route::after{height:calc(66.666% - 24px)}
@media (prefers-reduced-motion:reduce){.is-motion-ready [data-motion-layer]{opacity:1;transform:none;transition:none}.hero-route::after{height:calc(66.666% - 24px);transition:none}}
```

- [ ] **Step 4: Реализовать единый IntersectionObserver**

```js
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
```

- [ ] **Step 5: Проверить контракт и синтаксис**

```bash
rg -n "data-motion-scene=\"hero\"|initMotionScenes|is-motion-ready" index.html assets/site-v09/core.js
node --check assets/site-v09/core.js
git diff --check
```

Expected: все три контракта найдены, команды завершаются с кодом 0.

---

### Task 2: Синхронизация маршрута прототипа и фоновые переходы

**Files:**
- Modify: `index.html:271-350`
- Modify: `index.html:735-790`
- Modify: `assets/site-v09/core.js:436-505`

**Interfaces:**
- Consumes: `D.protoSteps`, существующая функция `content(k)`.
- Produces: `data-route-stage="0|1|2|3"` на секции прототипа и `.story-route-step` с соответствующим `data-stage`.

- [ ] **Step 1: Добавить компактный маршрут в секцию прототипа**

```html
<section id="prototype" class="proto-wrap tone-scene tone-cool" data-sx="proto" data-motion-scene="prototype" data-route-stage="0">
  <div class="story-route" aria-label="Текущий этап заявки" data-motion-layer style="--motion-index:0">
    <span class="story-route-step is-active" data-stage="0">Заявка</span>
    <span class="story-route-step" data-stage="1">Исполнитель</span>
    <span class="story-route-step" data-stage="2">Выезд</span>
    <span class="story-route-step" data-stage="3">Результат</span>
  </div>
  ...
</section>
```

- [ ] **Step 2: Синхронизировать UI маршрута в `content(k)`**

```js
root.dataset.routeStage = String(k);
$$('[data-stage]', root).forEach(function (el) {
  var active = Number(el.getAttribute('data-stage')) === k;
  el.classList.toggle('is-active', active);
  if (active) el.setAttribute('aria-current', 'step');
  else el.removeAttribute('aria-current');
});
```

- [ ] **Step 3: Добавить устойчивые переходы состояния**

```css
.tone-scene{transition:background-color 900ms var(--motion-ease)}
.tone-cool{background:#d8dce0}
.story-route{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:24px}
.story-route-step{position:relative;padding:12px 10px;border-top:1px solid var(--hairline-strong);font-size:13px;color:var(--ink-secondary-on-bg)}
.story-route-step::before{content:"";position:absolute;top:-4px;left:0;width:7px;height:7px;border-radius:50%;background:var(--hairline-strong)}
.story-route-step.is-active{color:var(--ink);font-weight:600}
.story-route-step.is-active::before{background:var(--ink-black);transform:scale(1.25)}
```

- [ ] **Step 4: Проверить конечное reduced-motion состояние**

При `prefers-reduced-motion: reduce` существующая `sync()` вызывает `content(steps.length - 1)`, поэтому `data-route-stage` должен стать `3`, а «Результат» получить `aria-current="step"` без ожидания.

Run:

```bash
node --check assets/site-v09/core.js
rg -n "data-route-stage|aria-current.*step|tone-cool" index.html assets/site-v09/core.js
```

Expected: код 0 и найденные контракты.

---

### Task 3: Слоистое появление конструктора и работ

**Files:**
- Modify: `index.html:350-470`
- Modify: `index.html:790-920`
- Modify: `index.html:974-1024`
- Modify: `assets/site-v09/core.js:350-435`

**Interfaces:**
- Consumes: общий `[data-motion-scene]`, существующие `.brick`, `.summary-panel`, `.stage-media`, `.stage-features`.
- Produces: последовательности `constructor` и `works`; класс `.is-changing` по-прежнему управляет переключением проекта.

- [ ] **Step 1: Разметить конструктор крупными слоями**

```html
<section id="builder" data-sx="constructor" data-motion-scene="constructor">
  <div class="section-head" data-motion-layer style="--motion-index:0">...</div>
  <div class="bricks-grid" data-motion-layer style="--motion-index:1">...</div>
  <aside class="summary-panel" data-motion-layer style="--motion-index:2">...</aside>
</section>
```

- [ ] **Step 2: Разметить дашборд работ функциональными слоями**

```html
<section id="works" class="sect tone-scene tone-works" data-sx="gallery" data-motion-scene="works">
  <div class="section-head" data-motion-layer style="--motion-index:0">...</div>
  <div class="tabs-col" data-motion-layer style="--motion-index:1">...</div>
  <div class="stage-media" data-sx="stage" data-motion-layer style="--motion-index:2">...</div>
  <div class="stage-copy" data-motion-layer style="--motion-index:3">...</div>
</section>
```

- [ ] **Step 3: Сделать смену проекта прерываемой и короткой**

Сохранить существующий `clearTimeout(timer)` перед каждым переключением. Снизить таймер рендера до 180 мс и добавить класс к оболочке содержимого:

```js
function show(n, immediate) {
  i = (n + cases.length) % cases.length;
  clearTimeout(timer);
  if (immediate || reduced() || !stage) { render(); return; }
  stage.classList.add('is-changing');
  stage.setAttribute('aria-busy', 'true');
  timer = setTimeout(render, 180);
}
```

```css
.stage-media{transition:opacity 180ms var(--ease),transform 180ms var(--ease)}
.stage-media.is-changing{opacity:.25;transform:translateY(8px)}
.tone-works{background:#d4d9de}
```

- [ ] **Step 4: Сократить каскад на мобильном**

```css
@media (max-width:640px){
  .is-motion-ready [data-motion-scene="constructor"] [data-motion-layer],
  .is-motion-ready [data-motion-scene="works"] [data-motion-layer]{transition-delay:calc(min(var(--motion-index,0),1) * 70ms);transform:translateY(10px)}
  .is-motion-ready [data-motion-scene].is-in-view [data-motion-layer]{transform:none}
}
```

- [ ] **Step 5: Проверить быстрое переключение**

В браузере нажать «Следующий кейс» не менее пяти раз быстрее 180 мс. После паузы `aria-labelledby`, активная вкладка, счётчик и изображение должны относиться к одному проекту; `aria-busy` должен быть `false`.

---

### Task 4: Финальное завершение маршрута

**Files:**
- Modify: `index.html:471-535`
- Modify: `index.html:919-973`

**Interfaces:**
- Consumes: общий `[data-motion-scene]`.
- Produces: финальная сцена `request` с `.route-complete` и текстом «Результат сохранён».

- [ ] **Step 1: Добавить финальный индикатор перед формой**

```html
<div class="route-complete" data-motion-layer style="--motion-index:0" aria-label="Маршрут завершён">
  <span class="route-complete-mark" aria-hidden="true">✓</span>
  <span>Результат сохранён</span>
</div>
```

Секция `#request` получает `data-motion-scene="request"` и класс `tone-scene tone-warm`.

- [ ] **Step 2: Оформить завершение без блокировки формы**

```css
.tone-warm{background:#ddd8d0}
.route-complete{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px;font-size:14px;font-weight:600}
.route-complete-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ink-black);color:#fff;transform:scale(.7) rotate(-12deg)}
.is-motion-ready .is-in-view .route-complete-mark{transform:none;transition:transform 520ms var(--motion-ease) 140ms}
@media (prefers-reduced-motion:reduce){.route-complete-mark,.is-motion-ready .is-in-view .route-complete-mark{transform:none;transition:none}}
```

- [ ] **Step 3: Проверить доступность формы до и после входа сцены**

В браузере до завершения перехода поля `name`, `contact`, `task`, checkbox и кнопка отправки должны иметь `isEnabled() === true` и сохранять порядок клавиатурного фокуса.

---

### Task 5: Полная браузерная и production-проверка

**Files:**
- Modify: `docs/superpowers/plans/2026-09-09-scroll-story-motion.md` только для отметки выполненных пунктов.

**Interfaces:**
- Consumes: все сцены Tasks 1–4.
- Produces: проверенный production deployment.

- [ ] **Step 1: Выполнить статические проверки**

```bash
node --check assets/site-v09/core.js
node --check assets/site-v09/data.js
git diff --check
```

Expected: все команды завершаются с кодом 0.

- [ ] **Step 2: Проверить целевые размеры**

В браузере проверить 1440×900, 1280×720, 390×844 и 320×700. Для каждого размера:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Expected: `true`; тексты и кнопки не перекрываются.

- [ ] **Step 3: Проверить обычное движение**

Проверить хиро до/после, четыре состояния прототипа, появление конструктора, появление работ, быстрое переключение и финальную галочку. В консоли нет ошибок уровня `error`.

- [ ] **Step 4: Проверить уменьшенное движение**

Эмулировать `prefers-reduced-motion: reduce`, перезагрузить страницу и подтвердить: все слои видимы сразу, прототип показывает последнюю стадию, transitions отключены.

- [ ] **Step 5: Зафиксировать изменения**

```bash
git add index.html assets/site-v09/core.js docs/superpowers/plans/2026-09-09-scroll-story-motion.md
git commit -m "Add guided scroll motion system"
git push origin main
```

Expected: `origin/main` указывает на новый коммит.

- [ ] **Step 6: Опубликовать и сверить production**

```bash
npx --yes vercel --prod --yes
curl -fsS https://verstak-preview-ten.vercel.app/ | shasum -a 256
shasum -a 256 index.html
```

Expected: Vercel сообщает `READY`, обе SHA-256 суммы совпадают.

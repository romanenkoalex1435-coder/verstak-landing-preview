# Request Page and Motion Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вынести форму заявки на отдельную страницу, завершить скролл-историю в настоящем финале главной и устранить все Important-замечания итогового ревью анимаций.

**Architecture:** `index.html` остаётся главной презентационной страницей и перед переходом сохраняет снимок конструктора в `sessionStorage`. Новый `request.html` содержит форму и сводку, использует те же данные и `core.js`, а модули инициализируются по наличию соответствующих data-атрибутов. Анимационная система разделяет декоративные entrance-слои и интерактивные элементы, а цветовые переходы выполняются реальными градиентными зонами.

**Tech Stack:** статический HTML/CSS, vanilla JavaScript, sessionStorage, IntersectionObserver, Vercel.

## Global Constraints

- Форма и живая сводка находятся только на `/request.html`.
- Все CTA заявки ведут на `/request.html`.
- Выбранный состав, сумма и срок передаются через `sessionStorage`; прямое открытие использует базовый состав.
- Логика валидации, честный fallback формы и расчёт цены не меняются.
- Финальный CTA с «Результат сохранён» расположен после FAQ на главной.
- Интерактивные и уникальные текстовые элементы не скрываются через opacity до входа сцены.
- Gallery entrance и project-switch используют разные DOM-обёртки/селекторы.
- Цветовые переходы между сценами имеют реальные градиентные зоны без резких полноширинных полос.
- `matchMedia` защищён feature detection и поддерживает `addEventListener` и legacy `addListener`.
- Reduced motion и отсутствие IntersectionObserver сразу дают корректное конечное состояние.
- Не добавлять библиотеки и внешние ассеты.

---

### Task 1: Отдельная страница заявки и перенос состояния

**Files:**
- Create: `request.html`
- Modify: `index.html`
- Modify: `assets/site-v09/core.js`
- Create: `tests/request-page-regression.js`

**Interfaces:**
- Consumes: `SX.get()`, `D.base`, `D.modules`, существующие data-атрибуты формы.
- Produces: ключ `sx-request-build-v1` в `sessionStorage` со значением `{ ids: string[] }`; функция восстановления выбора до подписки формы.

- [ ] **Step 1: Написать падающую проверку структуры**

Тест должен подтвердить: `request.html` существует и содержит `[data-sx="form"]`, `[data-sx="form-section"]`, `[data-sx="sum-rows"]`; главная не содержит форму; все CTA заявки используют `href="request.html"`; `core.js` читает и пишет `sx-request-build-v1`.

Run: `node tests/request-page-regression.js`

Expected before implementation: FAIL because `request.html` is absent.

- [ ] **Step 2: Добавить сохранение выбранных идентификаторов**

В публичный объект `SX` добавить:

```js
ids: function () { return chosen.slice(); },
restore: function (ids) {
  if (!Array.isArray(ids)) return;
  chosen = ids.filter(function (id) { return D.modules.some(function (m) { return m.id === id; }); });
  emit();
}
```

На главной перехватывать только ссылки `[data-sx="request-link"]`, синхронно сохранять `{ ids: SX.ids() }` в `sessionStorage`, затем разрешать обычную навигацию. Ошибка storage не должна блокировать переход.

- [ ] **Step 3: Создать `request.html`**

Перенести без изменения полей, имён, ошибок, кнопки, fallback и сводки. Подключить `data.js` и `core.js`. Перед инициализацией формы восстановить допустимые ids из `sessionStorage`; при отсутствии/ошибке оставить preset `D.modules`.

- [ ] **Step 4: Удалить форму с главной и обновить CTA**

Удалить старый `#request` с главной. Ссылки шапки, конструктора и футера сделать `href="request.html" data-sx="request-link"`. Якорей `#request` на главной не должно остаться.

- [ ] **Step 5: Запустить проверки и закоммитить**

```bash
node tests/request-page-regression.js
for test in tests/*.js; do node "$test"; done
node --check assets/site-v09/core.js
node --check assets/site-v09/data.js
git diff --check
git add index.html request.html assets/site-v09/core.js tests/request-page-regression.js
git commit -m "Move request form to dedicated page"
```

Expected: все проверки проходят; коммит создан.

---

### Task 2: Исправить архитектуру entrance и project-switch анимаций

**Files:**
- Modify: `index.html`
- Modify: `assets/site-v09/core.js`
- Create: `tests/motion-review-regression.js`

**Interfaces:**
- Consumes: общий scene observer и существующий gallery timer.
- Produces: `data-motion-decor` только на неинтерактивных оболочках; `.stage-switch-surface` для смены кейса; безопасный media-query helper.

- [ ] **Step 1: Написать падающую проверку замечаний ревью**

Тест должен проверить, что `[data-motion-layer]` не оборачивает `.brick`, gallery tabs, gallery nav или CTA; `.stage-switch-surface.is-changing` имеет более специфичный независимый selector; `reduced()` не вызывает отсутствующий `matchMedia`; подписка media query использует `addEventListener` либо `addListener`.

Run: `node tests/motion-review-regression.js`

Expected before implementation: FAIL на интерактивных слоях или media-query guard.

- [ ] **Step 2: Оставить скрываемыми только декоративные слои**

Заменить глобальный контракт на `[data-motion-decor]`. Интерактивные grids/tabs/links остаются видимыми; появление получают заголовки, декоративный корпус дашборда и неинтерактивные панели, внутри которых элементы никогда не становятся focusable в невидимом состоянии.

- [ ] **Step 3: Разделить анимацию входа и переключения**

Добавить вложенную `.stage-switch-surface` вокруг изображения. Перенести `is-changing` и `aria-busy` на неё либо использовать селектор:

```css
.stage-switch-surface{transition:opacity 180ms var(--ease),transform 180ms var(--ease)}
.stage-switch-surface.is-changing{opacity:.25;transform:translateY(8px)}
```

Scene entrance не должен переопределять эти computed styles.

- [ ] **Step 4: Защитить media-query API**

```js
var motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
var reduced = function () { return !!(motionQuery && motionQuery.matches); };
function onMotionChange(fn) {
  if (!motionQuery) return;
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', fn);
  else if (motionQuery.addListener) motionQuery.addListener(fn);
}
```

Все прямые подписки заменить на `onMotionChange(sync)`.

- [ ] **Step 5: Исправить линию хиро и мобильные смещения**

Высоту progress-линии привязать к центру активной третьей точки без захода к «Результату». На `max-width:640px` для всех сцен использовать 10px вход и задержки не более 70ms.

- [ ] **Step 6: Проверить и закоммитить**

```bash
node tests/motion-review-regression.js
for test in tests/*.js; do node "$test"; done
node --check assets/site-v09/core.js
git diff --check
git add index.html assets/site-v09/core.js tests/motion-review-regression.js
git commit -m "Fix motion accessibility and gallery transitions"
```

Expected: проверки проходят; коммит создан.

---

### Task 3: Настоящие цветовые переходы и финальный CTA

**Files:**
- Modify: `index.html`
- Create: `tests/motion-finale-regression.js`

**Interfaces:**
- Consumes: текущие tone colors и scene contract.
- Produces: `.tone-transition` градиентные зоны и `#request-cta` после FAQ.

- [ ] **Step 1: Написать падающую проверку порядка**

Тест должен подтвердить, что `#request-cta` расположен после `#faq`, содержит «Результат сохранён» и ссылку `request.html`; `.tone-transition` использует `linear-gradient`; старой формы на главной нет.

- [ ] **Step 2: Переместить завершение после FAQ**

Создать секцию `#request-cta` после FAQ с классами `tone-warm` и `data-motion-scene="request-cta"`. Перенести `.route-complete` и добавить явную CTA-кнопку на `request.html`.

- [ ] **Step 3: Добавить реальные переходные зоны**

Между нейтральным, холодным Works и тёплым финалом использовать псевдоэлементы либо блоки:

```css
.tone-transition{height:clamp(64px,10vw,140px);background:linear-gradient(to bottom,var(--tone-from),var(--tone-to));pointer-events:none}
```

Зоны не содержат текст и не участвуют в tab order. Удалить неработающие `transition:background-color` со статичных секций.

- [ ] **Step 4: Проверить и закоммитить**

```bash
node tests/motion-finale-regression.js
for test in tests/*.js; do node "$test"; done
git diff --check
git add index.html tests/motion-finale-regression.js
git commit -m "Complete scroll story after page content"
```

Expected: проверки проходят; коммит создан.

---

### Task 4: Браузерная проверка, слияние и production

**Files:**
- No product files unless verification reveals a defect.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: reviewed `main` and verified Vercel production deployment.

- [ ] **Step 1: Проверить обе страницы**

На 1440×900, 1280×720, 390×844 и 320×700 проверить `index.html` и `request.html`: нет page-level overflow, консоль без errors, CTA открывают форму, direct-load показывает базовый состав.

- [ ] **Step 2: Проверить перенос состояния**

Изменить состав в конструкторе, перейти по CTA, подтвердить совпадение строк сводки, суммы и срока. Повторить с повреждённым storage — форма должна загрузиться с безопасным preset/fallback.

- [ ] **Step 3: Проверить движение и доступность**

Проверить intermediate computed style gallery switch, четыре семантические стадии прототипа, финальный CTA после FAQ, Tab-доступность до входа сцен, reduced-motion/no-IO контракты и отсутствие нескольких RAF-циклов.

- [ ] **Step 4: Полная статическая проверка**

```bash
for test in tests/*.js; do node "$test"; done
node --check assets/site-v09/core.js
node --check assets/site-v09/data.js
git diff --check
```

- [ ] **Step 5: Финальное ревью, merge и deploy**

После чистого whole-branch review слить `feature/scroll-story-motion` в `main`, повторить проверки, push `origin main`, выполнить `npx --yes vercel --prod --yes` в привязанном основном checkout.

- [ ] **Step 6: Сверить production**

Проверить HTTP 200 для `/` и `/request.html`, совпадение SHA-256 локальных и production-файлов, отсутствие console errors и overflow на 1280×720 и 390×844.

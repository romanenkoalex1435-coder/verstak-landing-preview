# Hero Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать повторение этапов в хиро и связать четыре названия непосредственно с точками вертикального маршрута.

**Architecture:** Изменение локализовано в `index.html`: существующие декоративная линия и четыре строки объединяются в единый список этапов. JavaScript и бизнес-логика не меняются.

**Tech Stack:** статический HTML, CSS, vanilla JavaScript, Vercel.

## Global Constraints

- Менять только разметку и стили хиро.
- Подзаголовок: «Вся работа — в одной программе. Базовый состав от 60 000 ₽, сборка около трёх недель».
- Удалить «Маршрут заявки», строку со стрелками и номера 01–04.
- Сохранить «Выезд» текущим тёмным этапом.
- Не допускать горизонтального переполнения на 1280×720 и 390×844.

---

### Task 1: Перестроить маршрут в хиро

**Files:**
- Modify: `index.html:192-285`
- Modify: `index.html:724-761`

**Interfaces:**
- Consumes: существующие CSS-переменные `--ink-black`, `--hairline-strong`, `--panel`, `--radius-nested`.
- Produces: статический список `.hero-route` из четырёх `.hero-route-step`, один с модификатором `.is-current`.

- [ ] **Step 1: Зафиксировать проверку старого состояния**

Run:

```bash
rg -n "Маршрут заявки|hero-route-inline|class=\"num\"" index.html
```

Expected: найдены заголовок, строка со стрелками и номера этапов.

- [ ] **Step 2: Заменить разметку хиро**

Использовать следующую структуру справа:

```html
<div class="hero-route" aria-label="Этапы работы с заявкой">
  <div class="hero-route-step"><span class="route-dot" aria-hidden="true"></span><span>Заявка</span></div>
  <div class="hero-route-step"><span class="route-dot" aria-hidden="true"></span><span>Исполнитель</span></div>
  <div class="hero-route-step is-current"><span class="route-dot" aria-hidden="true"></span><span>Выезд</span></div>
  <div class="hero-route-step"><span class="route-dot" aria-hidden="true"></span><span>Результат</span></div>
</div>
```

Удалить `.hero-route-inline`, `.nav-panel-label`, `.num` и заменить `.hero-sub` согласованным текстом.

- [ ] **Step 3: Оформить точки, линию и активный этап**

Добавить сетку, в которой каждая точка стоит рядом со своим названием; соединительную линию построить псевдоэлементом списка:

```css
.hero-route{position:relative;display:flex;flex-direction:column;gap:10px;padding:16px 0}
.hero-route::before{content:"";position:absolute;left:18px;top:34px;bottom:34px;width:1px;background:var(--hairline-strong)}
.hero-route-step{position:relative;z-index:1;display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;min-height:54px;padding:0 18px 0 0;color:var(--ink);font-size:16px;font-weight:500}
.route-dot{justify-self:center;width:8px;height:8px;border-radius:50%;background:var(--hairline-strong)}
.hero-route-step.is-current{background:var(--ink-black);color:#fff;border-radius:var(--radius-nested)}
.hero-route-step.is-current .route-dot{width:9px;height:9px;background:#fff}
```

- [ ] **Step 4: Проверить отсутствие старых элементов и синтаксис**

Run:

```bash
! rg "Маршрут заявки|hero-route-inline|class=\"num\"" index.html
node --check assets/site-v09/core.js
node --check assets/site-v09/data.js
```

Expected: `rg` ничего не находит, обе проверки Node завершаются с кодом 0.

- [ ] **Step 5: Проверить страницу в браузере**

На production-preview проверить 1280×720 и 390×844: четыре подписи стоят у соответствующих точек, «Выезд» выделен, `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 6: Зафиксировать и опубликовать**

```bash
git add index.html docs/superpowers/plans/2026-09-09-hero-route.md
git commit -m "Refine hero application route"
git push origin main
npx --yes vercel --prod --yes
```

Expected: GitHub `main` указывает на новый коммит, production URL отвечает `200` и содержит новый подзаголовок.

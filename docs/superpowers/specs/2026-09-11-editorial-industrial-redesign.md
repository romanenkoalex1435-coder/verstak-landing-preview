# 2026-09-11 — Editorial/industrial redesign + legal prelaunch mode

Source of truth: codex's contract in the Buzz thread (event `db286ac2...`), decided
unilaterally per alexandr's delegation ("подтверждения alexandr не ждём"). This file
is a working record of that contract for the branch, not a new decision.

## Direction

"Операционная редакционная система" — technical-journal / dispatch-board / industrial
web hybrid. Removes template-SaaS feel while keeping the product legible.

- Full-viewport field: warm sand → cold graphite-violet → clean blue, driven only by
  scroll-progress (existing `scroll-aura` mesh in `scroll-fx.js`), no autonomous motion,
  no separate decorative blobs.
- Asymmetric editorial grid, large Cyrillic type, thin coordinate lines, stage numbers,
  one cobalt accent.
- Fonts (already local in `assets/site-v09/fonts/`, no new deps): Unbounded for display
  headings, Golos Text for body, JetBrains Mono for prices/status/labels.
- Remove card/pill slop: no repeated white cards per paragraph, no glass/glow, no
  matching pill badges, no card-in-card. Surfaces are background + line + grid division.
  Radius only where it explains interaction/status.
- One signature motif only: the route/coordinate thread. No second competing effect.

## Structure & content

1. Hero: direct pitch — program for requests/visits/results, tailored to a specific
   company's process. Subhead aligns on: base from 60 000 ₽ and from two weeks; typical
   selected composition ~3 modules; exact price/timeline fixed after task review. (Data
   check: `weeks(0 modules) = 2`, preset modules = card+mobile+photo = 3, `weeks(3) = 3`.)
2. Prototype stays first proof; fix the `span.obj` selector bug (`.proto-table td.obj`
   never matches — markup is `<td>text<span class="obj">`, needs descendant combinator)
   and confirm table readability at 320/390px.
3. Constructor stays the main interactive/pricing-transparency piece; keep "предварительная
   оценка" visible.
4. Works → compact specimen scene, three manual tabs only. Remove the desktop sticky
   scroll-hijack (`works-scene[data-scrub]` pin + `initScrollScene` in core.js). Keep one
   honest disclaimer about demo data; remove the repeated "макет / структура / не кейс"
   copies.
5. Bounds + Process merge into one contrasting block: "что берём → как делаем." No new
   promises.
6. About: keep Дмитрий/Александр as founders talking to clients directly, remove the
   decorative avatar-initial cards. No invented names/roles/experience/photos.
7. FAQ: quiet wide rows (unchanged pattern), fix the timeline answer to the base-two /
   typical-three / exact-before-start schema.
8. Final CTA: replace "Результат сохранён" completion claim with "Соберите обращение —
   без отправки данных." CTA/header copy must not promise delivery anywhere on the site.

## Legal prelaunch mode

Baseline: `RESEARCH/VERSTAK_RF_LEGAL_BASELINE_2026_09_11.md`.

- No Telegram/serverless/analytics/pixels.
- `request.html`, before the fields: explicit notice that data stays in the browser,
  the site does not send it, and after filling in the form a copyable text is produced.
- Remove the "согласие на обработку ПДн" checkbox — without a defined operator, that
  consent cannot be specific/informed.
- Button: "Собрать текст заявки", never "Отправить". Success state means only "текст
  готов", never "заявка доставлена".
- Footer + request page: short legal note — online intake is off; the estimate is
  preliminary and not an offer; terms are fixed in writing. No fabricated policy doc,
  no placeholder legal entity details.
- `docs/legal-launch-checklist.md`: private checklist (operator + details, policy,
  separate consent, RKN notification, RF-based storage, cross-border transfer review,
  contract/terms) — not a public compliance claim.

## Meta

Cherry-picked `70289b5` (favicon/OG/Twitter/theme-color) from `feature/site-packaging`
onto this branch as commit `15ce085`. Regenerate `og-image.jpg` after the hero copy/visual
changes land, since it currently renders the pre-redesign H1/subhead.

## Acceptance

- Visual checks: 1440×900, 1280×800, 390×844, 320×568, plus reduced-motion and
  keyboard-only.
- Contrast at every gradient stop, no overflow, no console/network errors, all
  interactive elements, copy-to-clipboard form flow, direct asset URLs, 404 behavior,
  meta/favicon/OG.
- Full `tests/*.js`, `node --check` on every JS file, `git diff --check`.
- New regression tests: compact Works (no scroll-hijack), local-only form mode (no
  fetch, no false success copy), key legal wording.
- Before merge: commit SHA, diff summary, desktop/mobile/reduced-motion proof to codex
  for independent review. Merge/deploy ourselves after fixes, without waiting on
  alexandr (explicit delegation).

# Design QA — утверждённый вариант 09

## Evidence

- Source visual truth: `assets/site-v09/proof/reference-09.png`.
- Accepted implementation render: `assets/site-v09/proof/desktop-1440x900.png`.
- Mobile render: `assets/site-v09/proof/mobile-390x844.png`.
- Desktop viewport: 1440 × 900 CSS px, device scale factor 2; implementation image 2880 × 1800 px.
- Source image: 1200 × 1200 px. It is an art-direction reference rather than a pixel-identical webpage, so comparison is by visual system and composition rather than identical crop.
- State: initial page load, first viewport.
- Comparison method: the reference and desktop render were opened in the same visual comparison pass with `view_image`; the mobile render was inspected in the immediately following responsive pass.
- Production-transfer proof: after normalizing only `assets/site-v09/` back to the laboratory's `../shared/` path, the production `index.html` is byte-equivalent to the accepted `variant-09/index.html`.
- Browser note: Codex IAB blocked opening the new local `file://` path under its URL policy. The accepted variant had already been browser-rendered and functionally tested before the path-only production transfer.

## Required fidelity surfaces

- Fonts and typography: Commissioner is loaded locally in Latin and Cyrillic subsets. The thin display hierarchy, compact navigation, readable body copy and mobile wrapping match the approved 09 direction.
- Spacing and layout rhythm: the open cool-gray field, large first-screen spacing, single soft panel and restrained radii preserve the accepted composition. Desktop and 390 px mobile renders show no clipping or horizontal overflow.
- Colors and tokens: cool gray background, near-white surface, black primary state and muted gray secondary text reproduce the selected monochrome system without gradients or decorative color noise.
- Image and asset quality: the hero intentionally contains no raster decoration. Demo-case images are real local JPG assets, not placeholders, and their production paths were verified.
- Copy and content: navigation, H1, lead, route, CTAs and niche line are unchanged from the accepted render. Above-the-fold copy diff: no additions, removals or reordering.

## Full-view comparison evidence

The implementation keeps the reference's recognizable skeleton: cool neutral canvas, thin dividing lines, large soft white control surface, one black selected state, restrained typography and generous negative space. It translates the reference navigation system into a conversion landing page without importing the reference's unrelated archive/menu content.

## Focused-region comparison

No extra crop was required: the 2880 × 1800 render keeps the header, complete hero typography, both CTAs, route labels and the full hero panel readable at inspection size. The mobile render separately verifies responsive typography, header CTA and stacked hero continuation.

## Findings

- No actionable P0, P1 or P2 fidelity mismatch remains.
- P3: the production form still requires a real endpoint and approved privacy-policy copy; this is a product/content dependency, not a visual mismatch.

## Comparison history

- Earlier mobile QA found navigation items escaping the 320–390 px viewport.
- Fix: below 640 px the secondary navigation strip is hidden while the brand and primary request CTA remain visible.
- Post-fix evidence: `assets/site-v09/proof/mobile-390x844.png` and the final machine QA both pass control visibility and horizontal-overflow checks.

## Core interaction verification

- Constructor totals: 60,000 ₽ / 2 weeks; 100,000 ₽ / 3 weeks; 175,000 ₽ / 5 weeks.
- Gallery and prototype transitions respond.
- Form validation, focus placement and offline fallback respond; fields remain populated and no false `form_success` fires without server confirmation.
- Keyboard focus, six responsive viewports and reduced-motion mode passed the final QA protocol.

## Implementation checklist

- [x] Promote approved 09 markup and styles.
- [x] Move all runtime dependencies into `assets/site-v09/`.
- [x] Preserve honest form behavior.
- [x] Verify required resources and JavaScript syntax.
- [x] Verify production markup equivalence to the accepted render.
- [x] Prepare a clean handoff package.

final result: passed

# 0004 — Parallax in JavaScript, keyed to document coordinates

**Date:** 2026-09-09
**Status:** Accepted
**Supersedes:** [ADR 0003](0003-no-parallax-on-touch.md) entirely, and the "CSS scroll-driven
animations, not JS scroll handlers" choice in §5 and §7 of
`documentation/superpowers/specs/2026-09-09-hltsom-website-design.md`

## Context

The parallax was built with CSS scroll-driven animations (`animation-timeline: view()`) because
they run on the compositor and need no JavaScript. On a real phone the blocks shivered during a
slow drag.

The cause: `view()` — and `scroll()` equally — measures progress against the **scrollport**.
Mobile browsers hide their toolbar as you drag, changing `innerHeight` mid-gesture. Each change
remaps the timeline, so the animation's position moves *independently of the scroll*. Measured:
a 58px visual jump at an unchanged scroll position. Only blocks inside their animation range can
jump, which is exactly the reported symptom — the cards that are not at 1× are the ones that
shiver.

[ADR 0003](0003-no-parallax-on-touch.md) responded by disabling the effect on touch devices.
That removed the symptom by removing the feature, on phones, for a mobile-first site. The owner
rejected it, correctly.

## Decision

The parallax is computed in `main.js` from **document coordinates only** —
`window.scrollY`, `element.offsetTop`, `element.offsetHeight`. None of those change when a
toolbar hides, so the toolbar cannot move a block relative to its neighbours. It runs on every
device, touch included.

`offsetTop` and `offsetHeight` are layout values and are unaffected by the transforms this code
applies, so the calculation cannot feed back on itself.

Updates are coalesced into one `requestAnimationFrame` per frame from a passive `scroll`
listener, and only `transform` is written — no layout is read or invalidated during scroll.

**A test forbids `innerHeight`, `clientHeight`, `visualViewport` and `getBoundingClientRect`
inside the parallax function**, because reintroducing any of them reintroduces the bug. A second
test asserts the applied offset equals what document coordinates predict, before *and* after a
viewport height change.

## Consequences

**The effect is back on phones**, which is what the brief asked for.

**The maths became exact.** A block exits over precisely its own height of scrolling, so
displacing it by `height × factor` leaves it moving at `(1 − factor)` of scroll speed.
`--parallax-factor: .5` now means literally half speed, and measures −0.50 to −0.55 on every
block on both desktop and mobile. The CSS version drifted between −0.22 and −0.62 depending on
block height, and needed an unexplained `0.8` fudge factor to land near the target.

**We gave up the compositor.** This is the real cost, and it was measured rather than assumed:
mobile Lighthouse is unchanged at 95 with **0ms total blocking time**. Four transform writes per
frame is not enough work to matter. On a much heavier page the trade would look different.

**Paint order is now explicit.** With CSS, every block carried an animation and therefore a
stacking context, so DOM order decided what covered what. With JavaScript only the moving block
has a transform, which would have made an exiting block paint *over* the one arriving. Blocks
now carry explicit `z-index: 1..4` and the footer `z-index: 5`.

**Without JavaScript there is no parallax at all.** Previously the CSS ran regardless. This is
decoration, and the page is complete without it.

## What was tried and rejected

- **`loading`-style hints or reducing the travel.** Shrinks the jump, does not remove it.
- **`animation-timeline: scroll()` with absolute ranges.** Also normalised against the
  scrollport; same failure.
- **Scrolling a fixed-height inner container** so the toolbar never collapses. Works, but breaks
  native scroll behaviour, pull-to-refresh and address-bar auto-hide — a much larger change than
  the effect justifies.

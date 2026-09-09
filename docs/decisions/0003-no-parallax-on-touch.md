# 0003 — No scroll parallax on touch devices

**Date:** 2026-09-09
**Status:** Superseded by [ADR 0004](0004-parallax-in-javascript.md) — the jitter was fixed rather than avoided, and parallax runs on touch devices again
**Supersedes:** the "at every viewport width" scope in §5 of
`docs/superpowers/specs/2026-09-09-hltsom-website-design.md`

## Context

The parallax was first built desktop-only, then widened to every viewport width on the argument
that a mobile-first brief should not hide a headline effect from phones. That reasoning was
sound and the conclusion was wrong, because it was never tested on a real device — only in a
headless browser, where the failure cannot occur.

On a real phone the owner reported the blocks "shiver and slightly jump" during a slow drag,
and noted precisely that **it is always the block not moving at 1× that jumps.**

That detail identifies the cause exactly. Mobile browsers show and hide their toolbar as you
drag, which changes `innerHeight` mid-gesture. `animation-timeline: view()` measures progress
against the scrollport, so every height change remaps the timeline and the animation's current
position moves — instantly, and independently of the scroll. Blocks outside their animation
range have nothing to remap and sit still; blocks inside it jump. Exactly as reported.

Reproduced by changing the viewport height from 900px to 915px at an unchanged scroll position:
the transform moved 18.5px and the block moved **58px** on screen.

## Decision

Parallax is scoped to `@media (hover: hover) and (pointer: fine)` — pointing devices, where the
viewport does not resize during scroll. Touch devices get no parallax; every block scrolls at
1×, which is a calm and entirely complete page.

**There is no CSS-only fix.** Every scroll-driven timeline — `view()` and `scroll()` alike — is
measured against a viewport that mobile browsers deliberately resize mid-gesture. Reducing the
travel would shrink the jump without removing it, and a JavaScript implementation would be
worse: it would run on the main thread and jitter for additional reasons.

## Consequences

**Phones lose the effect.** This is a real loss against the original brief, accepted because a
shivering card looks broken while a page without parallax looks deliberate.

**A tablet with a stylus or trackpad keeps it**, and a touchscreen laptop does not. The media
query approximates "stable viewport" rather than measuring it, because nothing exposes that
directly.

**If it is ever wanted back on phones,** the honest options are: accept the jitter, or lock the
toolbar by scrolling a fixed-height inner container instead of the document — which breaks
native scroll behaviour and address-bar collapse, and is a larger change than the effect is
worth.

`tests/e2e/motion.spec.js` asserts parallax is *absent* on the touch project and present on
desktop, so re-enabling it globally fails the suite rather than silently shipping the jitter.

## Related

The same investigation found that the lagging last block slid over the footer — 14px on
desktop, 57px on a phone. The footer is now `position: relative; z-index: 1` so it paints above
block 4, arriving over it the way every block arrives over the one before. The footer itself
never parallaxes: it is far shorter than the viewport, so there is no exit phase to animate.

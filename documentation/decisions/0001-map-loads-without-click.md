# 0001 — The map loads without a click

**Date:** 2026-09-09
**Status:** Accepted
**Supersedes:** Decision D6, and the consent guarantee in §10, of
`documentation/superpowers/specs/2026-09-09-hltsom-website-design.md`

## Context

The original design put the Google Map behind a click-to-load poster ("Vis kart"). The iframe
did not exist in the DOM until the visitor asked for it, so Google set no cookies on page load.
That was chosen specifically so the site needed no cookie consent banner.

The owner has since required that the map load on its own — explicitly: *"google maps MUST
preload, but lazy-load, I cannot have 'load on click'"*. A poster the visitor has to tap was
judged to cost more in usability than the consent handling costs in complexity.

## Decision

The map loads automatically, deferred until the contact block approaches the viewport.

**`loading="lazy"` alone was measured and does not work here.** With the attribute set and no
other mechanism, Chromium requested Google at ~60ms — before the page load event — on both a
Pixel 7 and a 1280×720 desktop. The attribute is a hint, and on a fast connection its
distance-from-viewport threshold is effectively "load it now".

Real deferral therefore comes from an `IntersectionObserver` in `main.js` with a 400px
`rootMargin`, which inserts the iframe as the contact block nears the viewport.
`loading="lazy"` is kept as a secondary hint. Visitors without JavaScript get the iframe
directly from a `<noscript>` block, so the map never depends on the script existing.

## Consequences

**Google now sets cookies without prior consent.** This is the substantive change, and it is a
compliance matter, not a technical one. Under Norwegian implementation of the EU ePrivacy
rules, storing or accessing information on a visitor's device for non-essential purposes
requires consent. A Google Maps embed does exactly that as soon as it loads.

The site therefore needs **a cookie consent mechanism before it goes live**, and this is
recorded in the spec's open items. Until that exists, the site is not launch-ready in this
respect — separately from the placeholder content that also blocks launch.

**The tests changed, and that was deliberate.** `tests/e2e/map-consent.spec.js` previously
asserted that no Google request and no cookie occurred before a click. Those assertions were
rewritten as part of this decision. They were not weakened by accident or by an agent
"fixing" a failing test. What replaced them is stronger than a bare attribute check: the suite
now asserts the map does *not* load at the top of the page and *does* load once the contact
block is reached, which is what proves the IntersectionObserver still works.

**What was gained.** No interaction cost for the visitor, and the map still stays off the
critical path — a ~600KB third-party embed no longer competes with the splash image for
bandwidth on first paint.

**What was lost.** The property that made this site unusually clean: zero cookies, no banner,
nothing to consent to. That is now gone and can only be restored by reverting to click-to-load.

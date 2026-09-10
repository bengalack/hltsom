# HLT Søm — One-Page Website Design

**Status:** Implemented — placeholder content and imagery pending
**Last updated:** 2026-09-09
**Owner:** bengalack

> This is a **living document**. It always describes the site as it *should currently be*.
> When a decision changes, edit this file in place so it stays the single source of truth.
> Decisions that **reverse** something recorded here also get an ADR in `docs/decisions/`,
> explaining why — see [Governance](#12-governance--how-to-change-this-design).

---

## 1. What this is

A single-page website for **HLT Søm**, a one-woman tailoring business operating from a home
workshop in Bærum, serving Oslo and Bærum, Norway.

**The visitor:** someone local who needs clothing altered or repaired.

**Success criterion.** Within ten seconds of landing, the visitor knows:

1. the name,
2. the main services,
3. that she is local to them, and
4. how to make contact.

Every decision below is subordinate to that criterion. The site is a brochure, not an
application: there is no booking, no cart, no account, no form.

---

## 2. Decisions at a glance

| # | Decision | Rationale |
|---|---|---|
| D1 | Norwegian (bokmål) only | Local customer base; a second language doubles content maintenance on a page whose whole virtue is being small |
| D2 | Zero-build static site — hand-written HTML/CSS/JS, no `package.json` | Longevity. The repo must open and work unchanged years from now; npm dependency rot is the main way small sites become hostile to their next maintainer |
| D3 | Hosted on GitHub Pages, eventually at `hltsom.no` | Free, HTTPS included, deploy is `git push` |
| D4 | Four full-height blocks + slim footer, no visible header | Client requirement; also the cleanest expression of the minimal brief |
| D5 | Contact = phone, email, address; no contact form | No backend, no spam handling, no GDPR data processing. Phone is the natural channel for this business |
| D6 | Static OpenStreetMap preview, upgrading to Google's interactive map on click | Settled by [ADR 0002](../../decisions/0002-static-map-preview.md) after [ADR 0001](../../decisions/0001-map-loads-without-click.md). Seeing the location is free; only interactivity costs a click, and that click is the consent action. No cookie banner needed |
| D7 | Cloudflare Web Analytics | Cookieless and free. No consent banner, no recurring bill that can lapse |
| D8 | Self-hosted fonts, subset to Latin + æøå | Google Fonts CDN sends visitor IPs to Google (a GDPR problem in the EU) and costs an extra connection |
| D9 | Wordmark is lowercase *søm* in Cormorant Infant Italic — **provisional** | Chosen from a live comparison; see [§6.1](#61-typography) for what must be re-checked |
| D10 | All imagery is CC0 placeholder photography, pending her own | Carousel and both block images are real photographs; only `logo.svg` is still drawn. See §8 |
| D11 | Menu is a full-screen takeover on mobile, a dropdown panel on desktop | A takeover exists because a thumb needs large targets on a small screen. On desktop the same four links fit under the burger without hiding the page |
| D12 | Colour palette is derived from the carousel photography | The photos are the loudest colour on the page; deriving the palette from them makes the site read as one material rather than as photos dropped into a template |

---

## 3. Page structure

No header. The logo (~100×100) and burger menu float over the page, fixed.

```
┌──────────────────────────────────────────┐
│ [logo]                         [burger]  │  fixed overlay, all blocks
├──────────────────────────────────────────┤
│ BLOCK 1 — Splash          full-viewport  │  photo carousel, dark
│   "søm" + tagline, centred               │
├──────────────────────────────────────────┤
│ BLOCK 2 — Tjenester            white bg  │  image left  / text right
├──────────────────────────────────────────┤
│ BLOCK 3 — Kontakt              black bg  │  text left   / MAP right
├──────────────────────────────────────────┤
│ BLOCK 4 — Om meg               white bg  │  image left  / text right
├──────────────────────────────────────────┤
│ FOOTER                         black bg  │  centred, single line
└──────────────────────────────────────────┘
```

Adjacent blocks always contrast. The footer is black specifically because block 4 is white.

### 3.1 Block 1 — Splash

- Full-viewport background image, `cover`. Use `100svh`/`100dvh`, never `100vh` — iOS Safari's
  collapsing address bar makes `vh` wrong on exactly the devices most visitors use.
- Background is a **carousel of 1–n images**, crossfading every 5s (fade 1.2s).
- Wordmark **søm**, centred, Cormorant Infant Italic, white.
- Tagline below: **"Godt håndverk, lokalt i Bærum"**, sans-serif, uppercase, letter-spaced.
- A scroll cue at the bottom edge.
- A fixed dark scrim overlays the photo so text contrast never depends on the photo alone
  (see [§8](#8-image-specification)).

### 3.2 Block 2 — Tjenester

White background, dark text. Image left, text right (desktop). 100–150 words:
a short warm intro of two or three sentences, then the services as a **scannable list**.

The list matters more than the prose. A hurried visitor on a phone scans; they do not read
paragraphs. It also puts real service keywords in the markup, which is most of the SEO value
this page can carry.

### 3.3 Block 3 — Kontakt

Black background, light text. **Text left, map right** (desktop).

Left column: address, phone (`tel:` link), email (`mailto:` link), opening hours.
Right column: Google Map, click-to-load.

The map replaces what would otherwise be a photo, so the block keeps the same two-column
rhythm as blocks 2 and 4 without introducing a fifth visual element.

**The map is a static OpenStreetMap image that upgrades to Google's interactive embed on
click** ([ADR 0002](../../decisions/0002-static-map-preview.md)). The visitor sees where the
workshop is with no interaction and no third-party request; only panning, zooming and
directions require the click, and that click is the consent action.

The element is an `<a>`, not a `<button>`, so without JavaScript it opens Google Maps in a new
tab.

**The OpenStreetMap credit beneath the preview is required by the ODbL licence and must stay
visible while the preview is shown.** It is deliberately removed when Google's map replaces the
preview: the credit describes tiles that are no longer on screen, and Google attributes itself
inside its own iframe. Both states are asserted by tests.

The preview centres on Sandvika generally and must be regenerated once the real street address
is known.

### 3.4 Block 4 — Om meg

White background, dark text. Image left, text right (desktop). Who she is: name, background,
experience. This is what turns an anonymous page into a person, which is the entire trust
proposition of a one-woman business.

### 3.5 Footer

Black, light text, horizontally centred, one line (wrapping on narrow screens):

```
Organisasjonsnummer: xxx xxx xxx | E-post: xxx@yyy.no | Telefon: 00 99 88 77
```

### 3.6 Mobile stacking

Blocks 2–4 alternate image-side on desktop. On mobile everything stacks:

| Block | Mobile order |
|---|---|
| 2 — Tjenester | Image, then text |
| 4 — Om meg | Image, then text |
| **3 — Kontakt** | **Text, then map** |

Mirroring the desktop alternation on a phone does not read as rhythm, it reads as
inconsistency — hence image-first as the default rule.

**Block 3 is a deliberate exception, and must stay one.** Its media pane holds the map, not a
photograph. Under the default rule a phone visitor reaching Kontakt would meet a large map —
possibly still blank while it loads — with the phone number pushed below it, burying the single
most important element on the page. The rule exists to serve the ten-second goal in §1;
applying it literally here would defeat that goal.

An agent tidying this into consistency would be undoing the point. On mobile the map is
supporting detail and comes last.

---

## 4. Navigation

- Logo top-left, burger top-right. Both **fixed**, visible over every block.
- They sit over both white and black backgrounds, so they use `mix-blend-mode: difference`:
  automatically legible against either, with no JS scroll-watching and nothing to desynchronise.
- **In-page links are handled in JavaScript and scroll to `offsetTop`, not by the browser's own
  anchor jump.** The blocks are transformed by the parallax, and a browser resolves an anchor
  against the element's *rendered* position — so a plain `href="#splash"` lands short by
  whatever the target is currently displaced, and the visitor converges on it by clicking
  repeatedly. That is exactly how the logo behaved: one click from scrollY 2000 left the page at
  420 instead of 0. `offsetTop` is a layout value and ignores transforms. Tests assert one click
  lands.
- Burger opens a menu with four links to the blocks. **Two presentations, one implementation:**
  a full-screen takeover below 800px, a dropdown panel anchored under the burger at 800px and
  above. Same DOM, same JavaScript — the difference is entirely CSS. Scroll-lock applies to the
  takeover only; locking the page behind a small dropdown would strand a desktop visitor.
- Overlay closes on: link click, Escape, outside click. Focus is trapped while open, and
  returns to the burger on close. `aria-expanded` reflects state.
- In-page links smooth-scroll, unless reduced motion is requested.

**The burger's bars are centred under the "MENY" label, not flush right with it.** The label
also carries `margin-right: -.18em`. That negative margin is not a typo and is not dead code:
letter-spacing is applied after the final letter as well, so the word's ink sits half a space
left of its own box and reads visibly off-centre above the bars without the compensation. Bars
are 30px wide against a ~36px label. A test measures the two centres against each other rather
than describing the intent.

---

## 5. Motion

| Effect | Behaviour |
|---|---|
| Carousel | Crossfade 1.2s, hold 5s. Pauses while the tab is hidden. With a single image, no timer runs at all |
| Parallax | Outgoing block translates at **0.5×** scroll speed; incoming block at **1×**. Applies to **every block except the last**, on every device — [ADR 0004](../../decisions/0004-parallax-in-javascript.md). Block 4 and the footer are both static, and stay attached |
| Smooth scroll | On anchor navigation only |

Parallax is implemented in **JavaScript**, computed from document coordinates only
([ADR 0004](../../decisions/0004-parallax-in-javascript.md)).

It was originally built with CSS scroll-driven animations for the compositor. That failed on
real phones: `animation-timeline: view()` measures progress against the scrollport, and mobile
browsers resize the scrollport as the toolbar hides mid-drag, remapping the timeline and jumping
mid-animation blocks by up to 58px at an unchanged scroll position. There is no CSS-only fix —
`scroll()` normalises against the same viewport.

`main.js` uses `scrollY`, `offsetTop` and `offsetHeight`, none of which a toolbar can change.
**Never reintroduce `innerHeight`, `clientHeight`, `visualViewport` or `getBoundingClientRect`
into that function** — a test forbids each of them by name, because that is precisely the bug.

Cost of leaving the compositor, measured rather than assumed: mobile Lighthouse unchanged at 95,
**0ms total blocking time**. Without JavaScript there is no parallax; it is decoration.

**The translate must be positive.** To look *slower*, a block has to lag behind the page. A
negative offset moves it with the scroll and it exits *faster* than normal — measured at −1.17×
while looking entirely plausible in code review. This trap survives the move to JavaScript.

**The maths is exact where the effect is unclamped.** A block exits over precisely its own
height of scrolling, so displacing it by `height × factor` leaves it at `(1 − factor)` of scroll
speed: `--parallax-factor: .5` means literally half speed.

### 5.1 Known trade-offs — do not "fix" these by weakening the effect

The parallax is a headline feature of this site. Two attempts to constrain it were made and
**both were reverted at the owner's instruction**, because each traded the effect for a
secondary concern. If either looks like an obvious improvement, read this first.

**1. The last block lags away from the footer.** Block 4 travels downward as it exits, so the
distance between it and the footer changes, and on mobile — where the page is long enough for
block 4 to animate, and rubber-band overscroll adds more — it is visible.

*Tried:* freezing block 4 so the footer stayed attached. *Rejected:* it removed the effect from
a quarter of the page. The footer still carries `z-index: 5` so it is never painted over, and a
test still asserts the footer never moves in the document and that no gap opens above it.

**2. An arriving block covers the tail of the one it is replacing.** True half speed asks a
block to lag by half its own height, which is far more than the empty space beneath its content
— measured at 163–434px of readable text disappearing under the arriving block, worst on mobile
and small windows where blocks are tallest.

*Tried:* capping the lag to the space under each block's content. *Rejected:* it reduced blocks
2 and 3 to a ~92px twitch, which reads as no parallax at all. There is no middle setting: these
blocks carry ~96px of slack against the 300–530px half speed demands, so any cap that protects
the text also destroys the effect.

**If this needs solving properly**, the honest routes are structural rather than a smaller
number: move the parallax to the imagery inside each block instead of the block itself, or give
the blocks far more bottom padding so the lag has somewhere to go. Both change the design and
belong in a conversation with the owner, not in a quiet tweak.

**The ratio is now uniform.** Measured −0.50/−0.51/−0.51 on a 1440×900 desktop and
−0.50/−0.51/−0.51/−0.55 on a Pixel 7. The earlier CSS implementation drifted between −0.22 and
−0.62 depending on block height; the document-coordinate model removed that variance.

**Scope:** all four blocks including the splash, on every device. The splash was originally
excluded, which left the very first transition a visitor sees with no effect at all.

**Paint order is explicit** (`z-index: 1..4` on the blocks, `5` on the footer). With the CSS
implementation every block carried an animation and therefore a stacking context, so DOM order
decided what covered what. With JavaScript only the moving block has a transform, which would
otherwise make an exiting block paint *over* the one arriving.

**The last block is excluded, and must stay excluded.** A lagging block slides down over
whatever follows it — that is the effect. Block 4 has only the footer beneath it, and the footer
cannot parallax: it is far shorter than the viewport, so it has no exit phase. If block 4
lagged, it would drift away from the footer. On desktop this was invisible because the page is
too short for block 4 to animate at all; on mobile the page is long enough, and rubber-band
overscroll at the bottom made it obvious. Keeping block 4 static is *how* the footer stays
attached to it — a test asserts the distance between them never changes.

**The footer is excluded and must stay excluded.** It is far shorter than the viewport, so
there is no exit phase to animate. It carries `position: relative; z-index: 1` so the lagging
last block passes *under* it rather than over it — without that, block 4 slid across the footer
by up to 57px. The footer must never move while scrolling; a test asserts it holds a single
document position. `tests/e2e/motion.spec.js`
measures effective speed rather than asserting the CSS merely exists — an earlier test compared
computed-transform *strings*, which passed happily against a completely broken implementation.
That test must also disable `scroll-behavior: smooth` first, or every sample is taken while the
page is still gliding.

**`prefers-reduced-motion: reduce` disables the carousel (first image holds), the parallax,
and smooth scrolling.** This is a calm version of the page, not a broken one.

---

## 6. Visual system

All values live as CSS custom properties at the top of `assets/css/style.css` — the single
place to change the look without hunting through rules.

```css
--ink:       #171310;   /* warm near-black, pulled toward the photography */
--ink-soft:  #4a4038;   /* secondary text on light ground */
--paper:     #faf7f2;   /* warm off-white; pure #fff glares beside these photos */
--paper-dim: #efe8dd;   /* panels, image placeholders, map ground */
--accent:    #9a7b4f;   /* brass, from thread and needle highlights */
--hairline-dark:  rgba(23,19,16,.14);
--hairline-light: rgba(250,247,242,.22);
--scrim-edge: rgba(20,16,12,.82);   /* top band; see note below */
--scrim: rgba(20,16,12,.42) → rgba(20,16,12,.62);  /* splash overlay gradient */
--carousel-interval: 5s;
--crossfade: 1200ms;
--parallax-factor: .5;
```

**The palette is derived, not chosen.** The four carousel photographs average `#72675d`,
`#685c56`, `#675950` and `#8c7e68` — a tight warm brown-taupe family. Every colour above is
built on that hue. The photography is the loudest colour on the page; a palette picked
independently of it would read as stock imagery dropped into a template.

`--accent` measures ~3.7:1 against `--paper`. That is sufficient for borders, rules and large
text, and **insufficient for body copy** — never use it as a text colour at 17px. It appears as
link underlines, the service-list rules and the dropdown's top border.

If the photography is ever replaced with materially different colours, re-derive these values;
`docs/image-spec.md` documents the method.

**The canvas behind the document is `--ink`, set on `html`.** A phone rubber-bands past both
ends of the page and reveals the canvas; a desktop never does, so this only ever showed on
mobile — as an empty white band below the footer. The canvas takes its colour from the root
element, and an unset root falls back to white. Both ends of this page are dark (splash, footer),
so ink makes overscroll read as the page stretching rather than as a blank block appearing.

It has to be on `html`, not `body`: once the root carries a background, `body`'s background stops
propagating to the canvas and paints only its own box — which is precisely the behaviour needed
here. Moving it to `body` would look like a tidy-up and would bring the white band back.

**Why the scrim has a dark top band.** The fixed logo and burger use
`mix-blend-mode: difference`, which resolves cleanly against black and white blocks but washes
out over a mid-tone photograph — difference is at its weakest when the backdrop sits near 50%
grey, because |255 − 128| lands back on the backdrop. The top of a carousel image is whatever
the photographer happened to shoot, so the band forces a predictably dark ground for the nav.
It must stay dark: nudging it toward mid-grey makes the nav *less* legible, not more.

Spacing follows a 4px scale. Generous whitespace is a stated goal: when in doubt, more.

### 6.1 Typography

| Role | Face | Notes |
|---|---|---|
| Wordmark | **Cormorant Infant Italic**, lowercase `søm`, regular weight | Tracking is a token, tuned against the final photo |
| Tagline / UI | **Inter**, light (200–300), uppercase, wide tracking | |
| Body | **Inter**, regular | |

Both faces are open-licence, self-hosted as `.woff2`, subset to Latin + `æøå`.

Inter is a deliberately neutral choice: the serif wordmark carries all the personality, and a
quiet sans keeps the contrast legible rather than competing with it. It is reversible — a
different sans is an ordinary spec edit, not an ADR.

**Alternatives considered and parked** (compared side by side on 2026-09-09 against the real
wordmark, tagline and Norwegian body copy — do not re-litigate without new information):

| Face | Verdict |
|---|---|
| **Helvetica** | The owner's favourite, and the benchmark for this comparison. Not shippable: licensed, system-only |
| **Inter** | **Chosen.** Closest of the open-licence candidates — neo-grotesque skeleton, horizontal terminals, large x-height. Its apertures are slightly more open than Helvetica's *by design*, which is why it stays crisp at 12px on a phone where true Helvetica goes muddy. On a mobile-first page that trade favours Inter |
| **Nimbus Sans** | A truer Helvetica metric clone, but an older design with weaker hinting and no variable version. Renders worse on phones. Rejected for the same mobile-first reason |
| **Archivo** | More industrial, closer to Helvetica *signage* in attitude. Viable, less refined at small sizes |
| **Roboto** | Furthest from Helvetica of those tested: narrower, humanist angled terminals, Android-system-UI association. Rejected — a lateral move, not an upgrade |

If the sans is ever revisited, the change worth making is toward **warmth** (a humanist face
such as Work Sans or Karla) to match a craft business — not sideways to another grotesque.

**Why lowercase.** Three round, flowing shapes read as a signature rather than a sign. The `ø`
slash runs parallel to the italic angle and ties into the neighbouring letters — the detail
that makes the word hang together. Uppercase `Ø` sits in its own box and loses this.

**D9 is provisional — what to re-check.** The wordmark was chosen against a stand-in photo.
Cormorant Infant Italic at this weight is delicate and depends on the photo behind it staying
dark and visually quiet in the centre. When real photography arrives, verify the wordmark
still holds. If it does not, the options are: increase weight, increase the scrim opacity, or
change face. EIKO (commercial licence) was raised as a preferred alternative and remains a
legitimate paid option if the open-licence face disappoints.

---

## 7. Technology

| Layer | Choice |
|---|---|
| Markup | One hand-written `index.html` |
| Styling | Plain CSS — custom properties, Grid, Flexbox. No Tailwind, no Sass, no build |
| Scripting | Vanilla JS, ~60 lines. Three jobs only: burger toggle, carousel, click-to-load map |
| Parallax | CSS scroll-driven animations — zero JS |
| Images | **Currently WebP only**, one size, no `srcset`. The first splash slide is preloaded; the rest carry `data-src` and are filled in after load. The full `<picture>` treatment (AVIF + WebP + JPEG fallback) is the target for the final photography, not what ships today — see §8 |
| Image tooling | Squoosh (browser) or ImageMagick locally — deliberately **outside** the repo |
| Fonts | Self-hosted `.woff2` |
| Analytics | Cloudflare Web Analytics, one script tag with SRI |
| Hosting | GitHub Pages from `main` |

Rejected: Eleventy and Astro. Both solve problems this site does not have — content
collections, component reuse, many pages — and both trade the longevity requirement for
build-time convenience used a handful of times a year.

### 7.1 Repository layout

```
hltsom/
├── CLAUDE.md                    ← constraints; loaded automatically by agents
├── README.md                    ← humans: what this is, how to deploy
├── index.html
├── CNAME                        ← added only at domain switch-over
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   ├── fonts/
│   └── img/
├── tools/optimize-images.md
└── docs/
    ├── superpowers/specs/2026-09-09-hltsom-website-design.md   ← this file
    ├── decisions/               ← ADRs
    └── image-spec.md
```

### 7.2 Relative paths — non-negotiable

The site runs at `https://bengalack.github.io/hltsom/` (a **project** page, served from a
subpath) and later at `https://hltsom.no/` (an apex domain, served from root).

**Every asset and in-page reference must be relative** (`assets/img/…`), never root-absolute
(`/assets/img/…`). A root-absolute path works in exactly one of those two locations and
breaks silently in the other.

---

## 8. Image specification

The **carousel** now uses four CC0 photographs (vintage Singer body, needle through fabric,
presser foot on cloth, thread spool and thimble), sourced via Openverse and committed to
`assets/img/`. They are placeholders in the sense that they are not *her* workshop — but they
are real, coherent photography rather than grey rectangles, and the palette is derived from
them (§6). Provenance and licence for each file are recorded in `docs/image-spec.md`.

Known limitation: the source tops out at 1024px wide. That is acceptable for placeholders and
**not** acceptable for the final site — real photography must meet the 2400px figure below.

The **block images** (Tjenester, Om meg) are also CC0 photographs now, presented inside a
**circular passepartout**: the image is cropped to a circle and the page ground shows around
it, with no painted mount, so the photograph reads as an object on the page rather than a
rectangle pasted into it. Sources must therefore be **square with a centred subject** — a
circle throws the corners away.

`om.webp` holds a machine rather than a face on purpose. That slot is meant for a portrait of
the tailor, and filling it with a stranger's portrait would misrepresent the business even as a
placeholder. It is the first image to replace.

`docs/image-spec.md` records — per slot — the subject, aspect ratio, minimum resolution and
export recipe.

The one rule that is a **hard constraint rather than a preference**:

> Carousel images must have a **dark, visually quiet centre region**, because the wordmark and
> tagline sit there in white and the wordmark is a light italic serif.

This is written into the image spec so that swapping a photo later cannot quietly destroy the
wordmark's legibility. A fixed scrim gradient provides a floor of protection, but a bright or
busy centre still defeats it.

---

## 9. SEO

**The honest constraint.** "Strong SEO" and "roughly 350 words on one page" pull against each
other. Text volume is not where this page can win.

What actually moves a local service business:

1. **`LocalBusiness` JSON-LD** — name, address, phone, opening hours, service area, `priceRange`
2. **Consistent NAP** (name, address, phone) between the page, the structured data and her
   Google Business Profile
3. **A Google Business Profile** — outside this repo, and probably the single highest-impact
   task on the whole project
4. Real service keywords in the block 2 list
5. `lang="nb"`, one `<h1>`, semantic `<section>`s and heading order
6. Open Graph + canonical, `sitemap.xml`, `robots.txt`
7. Fast mobile load — a genuine ranking factor and free with this architecture

Items 1–7 are in scope. Item 3 is a documented task for the owner.

### 9.1 Pre-launch: the site is deliberately not indexable

While `index.html` still contains placeholder content, it carries:

```html
<meta name="robots" content="noindex, nofollow">
```

**Why this matters more than it looks.** The placeholders include a fake phone number, a fake
organisation number and `[Gateadresse] 00`. Wrong NAP data reaching a search index is worse
than no data at all: it is slow to correct, it can be scraped into third-party directories, and
it will not match the Google Business Profile created later — which is the single strongest
local-SEO signal this business has.

**Why `robots.txt` still allows crawling.** Blocking crawlers with `Disallow: /` looks stronger
but is weaker: a crawler that cannot fetch the page cannot read the `noindex` tag, and a URL
blocked in `robots.txt` can still appear in results as a bare link if something references it.
`Allow` plus `noindex` is the combination that actually keeps a page out of search. The
`Sitemap:` line is commented out for the same reason — a sitemap is an active invitation.

**This is not access control.** Anyone with the URL can read the page, and GitHub Pages on the
free tier cannot be password-protected. `noindex` governs search visibility only.

**Removing it is a launch-day step, not a cleanup task.** `tests/e2e/prelaunch.spec.js` binds
the tag to the placeholders in both directions: the suite fails if the tag is removed while
placeholders remain, *and* fails if placeholders are all gone while the tag is still present.
Neither mistake can pass silently.

**Consequence for Lighthouse:** while the tag is in place, the SEO category will not reach 100
— Lighthouse correctly reports the page as blocked from indexing. That is the intended state.
Do not remove the tag to raise the score.

---

## 10. Security and privacy

**Attack surface is the design.** No server, no database, no forms, no user input, no
authentication. There is essentially nothing to exploit, and that property comes free with the
zero-build choice — it is the strongest security posture available to a website.

| Control | Implementation |
|---|---|
| HTTPS | Enforced by GitHub Pages (Let's Encrypt) |
| CSP | `<meta http-equiv="Content-Security-Policy">` |
| Third-party script pinning | **Not SRI.** Cloudflare's `beacon.min.js` is unversioned and updated in place, so a pinned integrity hash would break the script the first time Cloudflare ships an update. The origin is restricted by CSP `script-src` instead, which is the appropriate control for a mutable third-party endpoint |
| Referrer | `Referrer-Policy: strict-origin-when-cross-origin` |
| Third-party code | Analytics only. The map iframe loads solely on user action |

**Known, accepted limitation.** GitHub Pages cannot send custom HTTP headers. CSP must
therefore be delivered via `<meta>`, which does not support `frame-ancestors` — so
clickjacking protection is unavailable. For a static brochure page with no login, no forms and
no state, the residual risk is negligible. It is recorded here rather than glossed over,
because moving off Pages later is the only real fix.

**Privacy.** No cookies are set on load. Analytics is cookieless. The map preview is an image
served from this origin, so nothing reaches Google until the visitor clicks it — and that click
is the consent action ([ADR 0002](../../decisions/0002-static-map-preview.md)).

**No cookie consent banner is required as long as this holds.** Adding any third party that
sets cookies without a consent action changes that conclusion and requires an ADR.

This position survived a reversal and a re-reversal: [ADR 0001](../../decisions/0001-map-loads-without-click.md)
briefly removed the click and created a compliance gap; ADR 0002 closed it by making the
preview a real map instead of an empty box, which removed the reason the click was objectionable
in the first place.

---

## 11. Verification

### 11.1 Automated (Playwright, `tests/`)

Automated coverage exists for the regressions that manual checking misses on the fifth visit —
above all the privacy guarantee, which is a legal obligation rather than a preference:

- **No cookie and no Google request before the map preview is clicked**; the interactive
  iframe appears only after, and the visitor is told what the click will do
- The OpenStreetMap credit is visible under the preview (ODbL requirement) and disappears once
  Google's map replaces it
- Burger overlay: opens, traps focus, closes on Escape, restores focus, `aria-expanded` correct
- Carousel advances, and holds still under `prefers-reduced-motion`
- Parallax and smooth scroll disabled under `prefers-reduced-motion`
- Menu is a dropdown on desktop and a full-screen takeover on mobile, with scroll-lock on the
  takeover only
- Only the first carousel slide is fetched with the page
- **No root-absolute asset paths** anywhere in the markup or CSS (§7.2)
- No `package.json` at the repository root (§12.1)

### 11.2 Manual

Done means all of these pass:

- [ ] Lighthouse (mobile, throttled): Performance **≥ 90**, Accessibility **100**,
      Best Practices **≥ 95**, SEO **100**. An image-led page will not hit 100 on
      Performance; 90 is the honest bar, and Accessibility has no excuse for missing 100.
      **While the pre-launch `noindex` tag is in place (§9.1), SEO will not reach 100** —
      Lighthouse correctly reports the page as blocked from indexing. Read the SEO number
      as "100 apart from the deliberate noindex" until launch day
- [ ] Rendered on a real phone, not just a resized desktop window
- [ ] Keyboard-only: menu opens, focus is trapped, Escape closes, focus returns
- [ ] `prefers-reduced-motion: reduce` — carousel, parallax and smooth scroll all stop
- [ ] **JS disabled** — page fully readable, phone number still tappable
- [ ] Wordmark legible over every carousel image
- [ ] Structured data passes Google's Rich Results test
- [ ] No cookies set before the map is clicked (verify in devtools)

---

## 12. Governance — how to change this design

**If you are an agent picking this project up later, read this section first.**

- **Ordinary iteration** — new content, wording, spacing, timings, adding a service, swapping a
  photo: just edit this document. No ceremony.
- **Reversing a decision** in [§2](#2-decisions-at-a-glance), or adding a lasting constraint —
  e.g. dropping the map, adding a build step, adding a cookie-setting service: write an ADR in
  `docs/decisions/`, naming the section it changes. Then edit this document to match and link
  the ADR.

This document answers *what is true now*. ADRs answer *why it stopped being what it was*. Git
history holds the fine-grained diff. Nothing here is frozen — the record just needs to stay
readable instead of becoming an archaeology exercise.

### 12.1 Constraints that should survive contact with future agents

These are the decisions most likely to be "helpfully" undone by someone who did not read the
reasoning:

1. **The site has no build step and no dependencies** (D2). `index.html`, the CSS and the JS are
   served exactly as committed. **One exception:** `tests/` contains its own isolated
   `package.json` for Playwright. It is developer tooling only — never deployed, never
   referenced by the site, and deletable without affecting anything. There must be no
   `package.json` at the repository root.
2. **No visible header** — the floating logo and burger are deliberate (D4)
3. **Norwegian only** (D1)
4. **No cookies before consent** — the map's click-to-load is a legal mechanism, not a
   performance trick (D6, §10)
5. **Relative asset paths only** (§7.2)
6. **Google Fonts CDN is not an acceptable shortcut** (D8)

---

## 13. Open items

| Item | Owner | Notes |
|---|---|---|
| Regenerate the map preview | Both | Once the real street address is known — it currently centres on Sandvika generally (ADR 0002) |
| Photography (2 block images, and real carousel shots) | Owner | Carousel currently uses CC0 stand-ins at 1024px; final needs her own work at 2400px. See §8 |
| Logo file (~100×100) | Owner | Placeholder until supplied |
| Real content: services, about text, opening hours | Owner | Placeholders ship in Norwegian |
| Real org.nr, email, phone, address | Owner | Placeholders in footer and block 3 |
| Register `hltsom.no` | Owner | `.no` requires a Norwegian org number |
| Cloudflare account for analytics | Owner | Free tier; no Cloudflare DNS or hosting needed |
| Google Business Profile | Owner | Highest-impact SEO task, outside this repo |
| Confirm wordmark against real photos | Both | D9 is provisional — see §6.1 |

---

## 14. Domain switch-over checklist

Currently the site is served at `https://bengalack.github.io/hltsom/`. When `hltsom.no` is
registered:

0. **Replace every placeholder** — real org.nr, phone, email, address, opening hours,
   services, about text and photography. Then remove the `noindex` tag (§9.1) and uncomment the
   `Sitemap:` line in `robots.txt`. `tests/e2e/prelaunch.spec.js` will fail until the tag and
   the placeholders agree, in either direction.
1. Add a `CNAME` file at the repo root containing `hltsom.no`
2. DNS: four `A` records at the apex pointing to GitHub Pages' IPs, plus a `www` `CNAME` to
   `bengalack.github.io`
3. Update the canonical URL, Open Graph URLs and `sitemap.xml` to the new origin
4. Enable **Enforce HTTPS** in the repository's Pages settings, once the certificate issues
5. Update the site URL in the `LocalBusiness` structured data
6. Update the Google Business Profile website field

Because all asset paths are relative (§7.2), no markup or CSS changes are needed for the move
itself — only the absolute URLs in metadata, which are listed above.

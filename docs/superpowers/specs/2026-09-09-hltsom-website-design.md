# HLT Søm — One-Page Website Design

**Status:** Approved, not yet implemented
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
| D6 | Embedded Google Map, behind a click-to-load poster | Client wants the map; click-to-load means no Google code and no cookies until the visitor asks, so no consent banner |
| D7 | Cloudflare Web Analytics | Cookieless and free. No consent banner, no recurring bill that can lapse |
| D8 | Self-hosted fonts, subset to Latin + æøå | Google Fonts CDN sends visitor IPs to Google (a GDPR problem in the EU) and costs an extra connection |
| D9 | Wordmark is lowercase *søm* in Cormorant Infant Italic — **provisional** | Chosen from a live comparison; see [§6.1](#61-typography) for what must be re-checked |
| D10 | All imagery is placeholder at launch of development | No photography exists yet; the image spec makes real photos a drop-in replacement |

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

Blocks 2–4 alternate image-side on desktop. On mobile all blocks stack **image first,
text second — consistently, in all three blocks.**

Mirroring the desktop alternation on a phone does not read as rhythm, it reads as
inconsistency; and in block 3 it would push the contact details — the most important content
on the page — below the fold.

---

## 4. Navigation

- Logo top-left, burger top-right. Both **fixed**, visible over every block.
- They sit over both white and black backgrounds, so they use `mix-blend-mode: difference`:
  automatically legible against either, with no JS scroll-watching and nothing to desynchronise.
- Burger opens a **full-screen overlay** with four links to the blocks.
- Overlay closes on: link click, Escape, outside click. Focus is trapped while open, and
  returns to the burger on close. `aria-expanded` reflects state.
- In-page links smooth-scroll, unless reduced motion is requested.

---

## 5. Motion

| Effect | Behaviour |
|---|---|
| Carousel | Crossfade 1.2s, hold 5s. Pauses while the tab is hidden. With a single image, no timer runs at all |
| Parallax | Outgoing block translates at **0.5×** scroll speed; incoming block at **1×** |
| Smooth scroll | On anchor navigation only |

Parallax is implemented with **CSS scroll-driven animations** (`animation-timeline: view()`),
not JS scroll handlers. It runs on the compositor, which is the difference between smooth and
janky on a mid-range Android. Browsers without support simply scroll normally — the page is
complete without the effect.

**`prefers-reduced-motion: reduce` disables the carousel (first image holds), the parallax,
and smooth scrolling.** This is a calm version of the page, not a broken one.

---

## 6. Visual system

All values live as CSS custom properties at the top of `assets/css/style.css` — the single
place to change the look without hunting through rules.

```css
--ink:   #14110f;   /* near-black: warmer and less harsh than #000 */
--paper: #fdfcfa;   /* off-white: pure #fff glares on phone screens */
--scrim: rgba(18,15,12,.42) → rgba(18,15,12,.60);  /* splash overlay gradient */
--carousel-interval: 5s;
--crossfade: 1200ms;
--parallax-factor: .5;
```

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
| Images | AVIF + WebP + JPEG fallback via `<picture>` and `srcset` |
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

No photography exists yet. Everything ships as clearly-marked placeholders, and
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

**Privacy.** No cookies are set on load. Analytics is cookieless. The map sets Google cookies
only after the visitor taps "Vis kart", which is the consent action. No consent banner is
required as long as this holds — **adding any cookie-setting third party changes that
conclusion and requires an ADR.**

---

## 11. Verification

### 11.1 Automated (Playwright, `tests/`)

Automated coverage exists for the regressions that manual checking misses on the fifth visit —
above all the privacy guarantee, which is a legal obligation rather than a preference:

- **No cookies and no Google request before the map is clicked**; the iframe appears only after
- Burger overlay: opens, traps focus, closes on Escape, restores focus, `aria-expanded` correct
- Carousel advances, and holds still under `prefers-reduced-motion`
- Parallax and smooth scroll disabled under `prefers-reduced-motion`
- **No root-absolute asset paths** anywhere in the markup or CSS (§7.2)
- No `package.json` at the repository root (§12.1)

### 11.2 Manual

Done means all of these pass:

- [ ] Lighthouse (mobile, throttled): Performance **≥ 90**, Accessibility **100**,
      Best Practices **≥ 95**, SEO **100**. An image-led page will not hit 100 on
      Performance; 90 is the honest bar, and Accessibility has no excuse for missing 100
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
| Photography (carousel + 2 block images) | Owner | Blocks the site looking real; see §8 |
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

1. Add a `CNAME` file at the repo root containing `hltsom.no`
2. DNS: four `A` records at the apex pointing to GitHub Pages' IPs, plus a `www` `CNAME` to
   `bengalack.github.io`
3. Update the canonical URL, Open Graph URLs and `sitemap.xml` to the new origin
4. Enable **Enforce HTTPS** in the repository's Pages settings, once the certificate issues
5. Update the site URL in the `LocalBusiness` structured data
6. Update the Google Business Profile website field

Because all asset paths are relative (§7.2), no markup or CSS changes are needed for the move
itself — only the absolute URLs in metadata, which are listed above.

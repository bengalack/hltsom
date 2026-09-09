# Image specification

## Current state

The **carousel** uses four real CC0 photographs. The **block images** (Tjenester, Om meg) and
the logo are still marked SVG placeholders.

| File | Subject | Licence | Source |
|------|---------|---------|--------|
| `splash-1.webp` | Vintage Singer sewing machine body | CC0 | <https://www.rawpixel.com/image/6113012> |
| `splash-2.webp` | Sewing machine, needle and fabric | CC0 | <https://www.rawpixel.com/image/6032464> |
| `splash-3.webp` | Presser foot on cloth | CC0 | <https://www.rawpixel.com/image/5948921> |
| `splash-4.webp` | Thread spool and thimble | CC0 | <https://www.rawpixel.com/image/6032574> |

Found via [Openverse](https://openverse.org). CC0 means no attribution is required and
commercial use is permitted; the table exists so provenance is never in doubt.

They were downloaded as JPEG and re-encoded to **WebP at quality 0.72**, which cut the set from
1.2MB to 166KB — the difference between a Lighthouse performance score of 82 and 97.

**Two known limitations, both acceptable for placeholders and not for the finished site:**

1. The source tops out at **1024px** wide; real photography must meet the resolutions in the
   table below.
2. These are shipped as **WebP only**, with no JPEG fallback, so a pre-2020 browser sees the
   dark background rather than a photograph. The wordmark stays legible either way. Real
   photography should use the full `<picture>` treatment described under *Swapping a
   placeholder for a real photo*.

## The palette is derived from these photographs

The four images average `#72675d`, `#685c56`, `#675950` and `#8c7e68` — a tight warm
brown-taupe family. `--ink`, `--paper`, `--paper-dim` and `--accent` in `style.css` are all
built on that hue, so the page reads as one material.

**If you replace the photography with materially different colours, re-derive the tokens.**
The method: sample each image's average colour, take the shared hue, then build a near-black
(`--ink`), a warm off-white (`--paper`) and one accent drawn from a highlight in the imagery.
Check the accent's contrast on `--paper` before using it for anything text-like — the current
one is ~3.7:1, which is borders-and-large-text only.

## Wordmark legibility is measurable, not a matter of taste

Every splash image must keep white text readable at its centre. The four in use measure between
6.3:1 and 10.0:1 for white-on-centre with the scrim applied, against a 4.5:1 requirement for
the tagline. Measure a replacement before trusting it.

## The hard rule

**Carousel images must have a dark, visually quiet centre.**

The wordmark `søm` sits there in white, in a light italic serif. A fixed scrim gradient
provides a floor of protection, but a bright or busy centre still defeats it. The four CC0
photographs in use were selected partly on this measurement, not only on subject.

**Verify the wordmark is still legible after every photo swap.** If it is not, the options are:
increase the wordmark weight, raise `--scrim-top` / `--scrim-bottom` opacity, or choose a
different photo. Changing the typeface is a spec edit (§6.1).

## Slots

| Slot | File stem | Aspect | Min resolution | Subject |
|------|-----------|--------|----------------|---------|
| Splash carousel | `splash-1`, `splash-2`, … | Fills viewport; crops from centre | 2400×1600 | Workshop, fabric, hands at work. Dark, quiet centre |
| Block 2 (Tjenester) | `tjenester` | 4:5 portrait | 1200×1500 | Work in progress: pinning, hemming, a machine |
| Block 4 (Om meg) | `om` | 4:5 portrait | 1200×1500 | The tailor herself. A face builds more trust than any copy |
| Logo | `logo` | 1:1 | 400×400, or SVG | Simple enough to read at 100×100 |

### Adding a carousel slide

Slides are `<img>` elements inside `.splash__slides`, not CSS backgrounds. That is what allows
slides after the first to be deferred.

```html
<img class="splash__slide" data-src="assets/img/splash-5.jpg" alt=""
     decoding="async" width="1024" height="768">
```

- The **first** slide carries a real `src` plus `fetchpriority="high"`, and is preloaded from
  `<head>`. It is the LCP element.
- **Every other slide carries `data-src`, never `src`.** `main.js` assigns the real `src` after
  the load event, keeping them off the critical path. A test fails if slides 2+ ship with a
  plain `src`.
- Always set `width` and `height` so the browser reserves space.
- No `style="…"` attributes anywhere: the CSP forbids inline styles and will silently blank the
  image.

The carousel adapts to any number of slides automatically; with a single slide it runs no timer
at all.

## Swapping a placeholder for a real photo

1. Export per `tools/optimize-images.md` → produces `name.avif`, `name.webp`, `name.jpg`.
2. Replace the `<img>` inside the relevant `<picture>` and add the two `<source>` lines:

```html
<picture>
  <source srcset="assets/img/tjenester.avif" type="image/avif">
  <source srcset="assets/img/tjenester.webp" type="image/webp">
  <img src="assets/img/tjenester.jpg" width="1200" height="1500"
       alt="..." loading="lazy" decoding="async">
</picture>
```

3. Keep `width` and `height` accurate. They reserve layout space and prevent the content shift
   that Lighthouse scores as CLS.
4. Write real Norwegian `alt` text describing what is in the photo — not the word "bilde".
5. Splash slides are `<img>` elements. Swap the file the `src` (slide 1) or `data-src`
   (slides 2+) points at, and update `width`/`height` to the new dimensions.
6. Re-run `cd tests && npx playwright test`.

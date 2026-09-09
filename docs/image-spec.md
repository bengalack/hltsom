# Image specification

No real photography exists yet. Every image in `assets/img/` is a placeholder SVG.

## The hard rule

**Carousel images must have a dark, visually quiet centre.**

The wordmark `søm` sits there in white, in a light italic serif. A fixed scrim gradient
provides a floor of protection, but a bright or busy centre still defeats it. The placeholder
SVGs are deliberately darkest at the centre so the wordmark is tested against a realistic worst
case rather than a flattering one.

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

Add more carousel slides by following the `splash-N` numbering and adding one
`.splash__slide` div in `index.html`. The carousel adapts to any number automatically; with a
single slide it runs no timer at all.

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
5. Splash slides are CSS background images, not `<picture>`. Swap the `background-image` URL on
   the `.splash__slide` div and point it at the `.jpg`; browsers that support AVIF/WebP can be
   served those via `image-set()` if you want the saving.
6. Re-run `cd tests && npx playwright test`.

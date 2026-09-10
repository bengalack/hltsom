# Preparing images

Image tooling is deliberately **outside** this repository, so the site stays dependency-free.
Use either route; both produce the same three files. Commit all three.

## Route A — Squoosh (no install)

<https://squoosh.app>. For each photo, export three times:

- AVIF, quality 50 → `name.avif`
- WebP, quality 75 → `name.webp`
- MozJPEG, quality 78 → `name.jpg`

Resize the longest edge to 2400px for splash images, 1500px for block images.

## Route B — ImageMagick (local)

```bash
magick input.jpg -resize 2400x2400\> -quality 50 name.avif
magick input.jpg -resize 2400x2400\> -quality 75 name.webp
magick input.jpg -resize 2400x2400\> -quality 78 -strip name.jpg
```

The `\>` suffix means "shrink only, never enlarge". `-strip` removes EXIF metadata, which cuts
file size and avoids publishing GPS coordinates from the camera.

## Then

Follow the swap steps in `documentation/image-spec.md`, and re-check that the wordmark is still legible
over any new splash image.

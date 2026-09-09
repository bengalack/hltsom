import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

/* One-off utility: build a static map preview from OpenStreetMap tiles.
   Not part of the site. Re-run when the real address is known.
   Tiles are © OpenStreetMap contributors (ODbL) — the attribution must stay
   visible next to the image on the page. */

const outDir = process.argv[2];
const lat = Number(process.argv[3] ?? 59.8917);   // Sandvika, Bærum
const lon = Number(process.argv[4] ?? 10.5250);
const zoom = Number(process.argv[5] ?? 14);
const cols = 4, rows = 3, TILE = 256;

const lon2tile = (l, z) => ((l + 180) / 360) * 2 ** z;
const lat2tile = (l, z) => {
  const r = (l * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z;
};

const cx = lon2tile(lon, zoom);
const cy = lat2tile(lat, zoom);
const x0 = Math.floor(cx - cols / 2);
const y0 = Math.floor(cy - rows / 2);

const urls = [];
for (let dy = 0; dy < rows; dy++) {
  for (let dx = 0; dx < cols; dx++) {
    urls.push({ dx, dy, url: `https://tile.openstreetmap.org/${zoom}/${x0 + dx}/${y0 + dy}.png` });
  }
}

// Fetch server-side with a real UA (OSM tile policy requires identification)
const tiles = [];
for (const t of urls) {
  const r = await fetch(t.url, { headers: { 'User-Agent': 'hltsom-site/1.0 (static map preview, one-off)' } });
  if (!r.ok) { console.log('tile failed', t.url, r.status); continue; }
  const b = Buffer.from(await r.arrayBuffer());
  tiles.push({ ...t, data: 'data:image/png;base64,' + b.toString('base64') });
}
console.log('tiles fetched:', tiles.length, 'of', urls.length);
if (tiles.length !== urls.length) { console.log('incomplete — aborting'); process.exit(1); }

const b = await chromium.launch();
const p = await b.newPage();
const dataUrl = await p.evaluate(async ({ tiles, cols, rows, TILE }) => {
  const c = document.createElement('canvas');
  c.width = cols * TILE; c.height = rows * TILE;
  const ctx = c.getContext('2d');
  for (const t of tiles) {
    const img = new Image();
    img.src = t.data;
    await img.decode();
    ctx.drawImage(img, t.dx * TILE, t.dy * TILE);
  }
  return c.toDataURL('image/webp', 0.82);
}, { tiles, cols, rows, TILE });

mkdirSync(outDir, { recursive: true });
const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
writeFileSync(`${outDir}/map-preview.webp`, buf);
console.log(`map-preview.webp written: ${cols * TILE}x${rows * TILE}, ${(buf.length / 1024).toFixed(0)}KB`);
await b.close();

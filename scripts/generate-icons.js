import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(resolve(__dirname, '../public/favicon.svg'));
const out = resolve(__dirname, '../public');

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 512, name: 'maskable-icon-512x512.png', padding: 0.1 },
];

for (const { size, name, padding = 0 } of sizes) {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  const img = sharp(svg).resize(inner, inner);
  if (pad > 0) {
    await img
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#00695c' })
      .png()
      .toFile(resolve(out, name));
  } else {
    await img.png().toFile(resolve(out, name));
  }
  console.log(`wrote ${name}`);
}

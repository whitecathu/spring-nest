import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

// SVG for PWA icons: green rounded rect + white leaf
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3f6751"/>
  <g transform="translate(128, 100) scale(8)">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l5.94 2.48c1.46-2.17 3.13-4.13 5.24-5.58C17.1 16.78 19.6 16 22 16c0 2.4-0.78 4.9-2.24 7-1.45 2.11-3.41 3.78-5.58 5.24l2.48 5.94C21.83 32.1 28 30 30 21" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 8c4.24 4.24 6.36 8.48 7 14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;

// Maskable icon: larger padding for safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3f6751"/>
  <g transform="translate(152, 130) scale(6.5)">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l5.94 2.48c1.46-2.17 3.13-4.13 5.24-5.58C17.1 16.78 19.6 16 22 16c0 2.4-0.78 4.9-2.24 7-1.45 2.11-3.41 3.78-5.58 5.24l2.48 5.94C21.83 32.1 28 30 30 21" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 8c4.24 4.24 6.36 8.48 7 14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;

async function generate() {
  const iconBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // pwa-192x192.png
  await sharp(iconBuffer).resize(192, 192).png().toFile(resolve(publicDir, 'pwa-192x192.png'));
  console.log('✓ pwa-192x192.png');

  // pwa-512x512.png
  await sharp(iconBuffer).resize(512, 512).png().toFile(resolve(publicDir, 'pwa-512x512.png'));
  console.log('✓ pwa-512x512.png');

  // pwa-maskable-512x512.png (maskable with safe zone padding)
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(resolve(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ pwa-maskable-512x512.png');

  // apple-touch-icon.png (180x180)
  await sharp(iconBuffer).resize(180, 180).png().toFile(resolve(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // favicon.ico (32x32 PNG — modern browsers accept PNG as favicon)
  await sharp(iconBuffer).resize(32, 32).png().toFile(resolve(publicDir, 'favicon.ico'));
  console.log('✓ favicon.ico (32x32 PNG)');

  // og-image.png (1200x630 from SVG)
  const ogSvg = readFileSync(resolve(publicDir, 'og-image.svg'));
  await sharp(ogSvg).resize(1200, 630).png().toFile(resolve(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x630)');

  console.log('\nAll icons generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});

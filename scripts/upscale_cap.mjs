// Re-samples the supplied Cap sheets (1080x1080, 360px cells) to 3x with Lanczos + light sharpening so the browser
// downsamples (high quality) instead of upscaling (blurry). The originals in charcter_img/ are never modified.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
const src = (n) => fileURLToPath(new URL(`../charcter_img/cap-${n}.webp`, import.meta.url))
const out = (n) => fileURLToPath(new URL(`../public/mascots/cap-${n}.webp`, import.meta.url))
for (const n of ['directions', 'reactions']) {
  await sharp(src(n)).resize(3240, 3240, { kernel: 'lanczos3' }).sharpen({ sigma: 1.1, m1: 0.8, m2: 2.2 }).webp({ quality: 96, alphaQuality: 100, effort: 5 }).toFile(out(n))
  console.log(n, 'ok')
}

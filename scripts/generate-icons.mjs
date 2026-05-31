import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

// SVG built with geometric rectangles so it doesn't depend on system fonts —
// produces an identical "F" on any machine.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f1117" rx="80"/>
  <rect x="146" y="116" width="70" height="280" fill="#3b7ff5"/>
  <rect x="146" y="116" width="220" height="70" fill="#3b7ff5"/>
  <rect x="146" y="210" width="170" height="60" fill="#3b7ff5"/>
</svg>`

const SIZES = [192, 512]
const OUT_DIR = 'public/icons'

await mkdir(OUT_DIR, { recursive: true })

for (const size of SIZES) {
  const out = `${OUT_DIR}/icon-${size}.png`
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${out}`)
}

import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const BG = '#0f1117'
const ACCENT = '#3b7ff5'

// Monograma "F" serif (Georgia) centrado sobre fondo cuadrado.
// OJO: renderizar texto depende de que la fuente esté instalada en el sistema
// que corre el script (Georgia existe en Windows/macOS). Si se genera en un CI
// sin Georgia, librsvg cae a otra serif.
//   fontSize → tamaño de la letra en el viewBox 0..512
//   radius   → radio de las esquinas del fondo (0 = sin redondear, para maskable)
function buildSvg({ fontSize, radius }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}" rx="${radius}"/>
  <text
    x="256"
    y="256"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${ACCENT}"
    text-anchor="middle"
    dominant-baseline="central">F</text>
</svg>`
}

// Ícono normal: F grande (~54%) con esquinas redondeadas (~15.6% del lado).
const REGULAR = buildSvg({ fontSize: 276, radius: 80 })

// Maskable: fondo a sangre (sin rx, lo enmascara Android) y F más chica (~40%)
// para que entre en la safe zone tras el recorte de ~10% por borde.
const MASKABLE = buildSvg({ fontSize: 205, radius: 0 })

const OUT_DIR = 'public/icons'
await mkdir(OUT_DIR, { recursive: true })

async function render(svg, size, name) {
  const out = `${OUT_DIR}/${name}`
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${out}`)
}

await render(REGULAR, 192, 'icon-192.png')
await render(REGULAR, 512, 'icon-512.png')
await render(MASKABLE, 512, 'icon-512-maskable.png')

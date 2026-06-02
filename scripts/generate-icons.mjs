import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const BG = '#0f1117'
const ACCENT = '#3b7ff5'

// Construye el SVG de un gráfico de línea ascendente (sparkline) sobre fondo
// cuadrado. No depende de fuentes del sistema, así el resultado es idéntico en
// cualquier máquina.
//   points     → array de [x, y] en el viewBox 0..512
//   stroke     → grosor del trazo
//   radius     → radio de las esquinas del fondo (0 = sin redondear)
//   fullBleed  → si true, el fondo ocupa todo el lienzo (para maskable)
function buildSvg({ points, stroke, radius }) {
  const path = points.map(([x, y]) => `${x},${y}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}" rx="${radius}"/>
  <polyline
    points="${path}"
    fill="none"
    stroke="${ACCENT}"
    stroke-width="${stroke}"
    stroke-linecap="round"
    stroke-linejoin="round"/>
  <circle cx="${lastX}" cy="${lastY}" r="${stroke * 0.9}" fill="${ACCENT}"/>
</svg>`
}

// Ícono normal: la línea usa casi todo el lienzo (con un margen cómodo).
const REGULAR = buildSvg({
  points: [
    [108, 340],
    [196, 282],
    [272, 312],
    [344, 214],
    [404, 160],
  ],
  stroke: 30,
  radius: 80,
})

// Maskable: Android recorta hasta el ~10% de cada borde y aplica su propia
// máscara. El fondo ocupa todo el lienzo (sin esquinas redondeadas) y la línea
// se encoge hacia el centro para quedar dentro de la "safe zone".
const MASKABLE = buildSvg({
  points: [
    [152, 314],
    [213, 273],
    [268, 296],
    [319, 227],
    [360, 192],
  ],
  stroke: 22,
  radius: 0,
})

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

export type PaperBackgroundStyle = 'none' | 'folded' | 'crumpled' | 'creased' | 'photocopy'

export const paperBackgroundOptions = [
  { label: 'Aucun fond', value: 'none' },
  { label: 'Papier plié', value: 'folded' },
  { label: 'Papier froissé', value: 'crumpled' },
  { label: 'Feuille marquée', value: 'creased' },
  { label: 'Photocopie ancienne', value: 'photocopy' }
] as const

export async function applyPaperBackground(
  pageBlob: Blob,
  style: PaperBackgroundStyle | undefined,
  seed = 1
): Promise<Blob> {
  if (!style || style === 'none') return pageBlob

  const source = await createImageBitmap(pageBlob)
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    source.close()
    return pageBlob
  }

  const w = canvas.width
  const h = canvas.height
  // Build a paper sheet at the same size as the PDF page.
  const base = ctx.createLinearGradient(0, 0, w * 0.9, h)
  if (style === 'photocopy') {
    base.addColorStop(0, '#e8e8e8')
    base.addColorStop(0.45, '#f6f5f1')
    base.addColorStop(1, '#e4e3df')
  } else {
    base.addColorStop(0, style === 'crumpled' ? '#f0efea' : '#f5f4f0')
    base.addColorStop(0.5, '#fffefa')
    base.addColorStop(1, style === 'creased' ? '#ecebe7' : '#f1f0eb')
  }
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Subtle fine grain, with deterministic randomness for stable previews.
  let state = (seed >>> 0) || 1
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  const grain = ctx.getImageData(0, 0, w, h)
  const d = grain.data
  const strength = style === 'photocopy' ? 13 : style === 'crumpled' ? 8 : 4
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.round((random() - 0.5) * strength)
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n))
  }
  ctx.putImageData(grain, 0, 0)

  const crease = (vertical: boolean, position: number, intensity: number, width: number) => {
    ctx.save()
    const p = vertical ? position * w : position * h
    const length = vertical ? h : w
    const gradient = vertical
      ? ctx.createLinearGradient(p - width, 0, p + width, 0)
      : ctx.createLinearGradient(0, p - width, 0, p + width)
    gradient.addColorStop(0, 'rgba(90,86,78,0)')
    gradient.addColorStop(0.42, `rgba(100,96,88,${intensity})`)
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.45)')
    gradient.addColorStop(1, 'rgba(90,86,78,0)')
    ctx.fillStyle = gradient
    if (vertical) ctx.fillRect(p - width, 0, width * 2, length)
    else ctx.fillRect(0, p - width, length, width * 2)
    ctx.restore()
  }

  if (style === 'folded') {
    crease(true, 0.5, 0.12, Math.max(5, w * 0.012))
    crease(false, 0.52, 0.16, Math.max(5, h * 0.01))
  } else if (style === 'creased') {
    crease(false, 0.28, 0.1, Math.max(4, h * 0.006))
    crease(false, 0.73, 0.09, Math.max(4, h * 0.005))
    crease(true, 0.66, 0.08, Math.max(4, w * 0.006))
  } else if (style === 'crumpled') {
    // Soft, irregular diagonal creases mimic a handled sheet without obscuring text.
    for (let i = 0; i < 18; i++) {
      const x = random() * w
      const y = random() * h
      const len = Math.min(w, h) * (0.08 + random() * 0.22)
      const angle = random() * Math.PI
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.strokeStyle = random() > 0.5 ? 'rgba(100,96,88,0.09)' : 'rgba(255,255,255,0.42)'
      ctx.lineWidth = Math.max(2, w * 0.003)
      ctx.stroke()
    }
  } else if (style === 'photocopy') {
    const band = ctx.createLinearGradient(0, 0, 0, h)
    band.addColorStop(0, 'rgba(70,70,70,0.10)')
    band.addColorStop(0.25, 'rgba(255,255,255,0)')
    band.addColorStop(0.72, 'rgba(255,255,255,0)')
    band.addColorStop(1, 'rgba(80,80,80,0.12)')
    ctx.fillStyle = band
    ctx.fillRect(0, 0, w, h)
  }

  // Multiply the original PDF page over the paper. White areas preserve the
  // texture, while dark text and graphics remain legible on top of it.
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(source, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  source.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create paper background')), 'image/png')
  })
}

export type PaperBackgroundStyle = 'none' | 'folded' | 'crumpled' | 'creased' | 'photocopy' | 'double-fold' | 'soft-folds'

export const paperBackgroundOptions = [
  { label: 'Aucun fond', value: 'none' },
  { label: 'Papier plié', value: 'folded' },
  { label: 'Papier froissé', value: 'crumpled' },
  { label: 'Feuille marquée', value: 'creased' },
  { label: 'Photocopie ancienne', value: 'photocopy' },
  { label: 'Deux plis horizontaux', value: 'double-fold' },
  { label: 'Plis doux réalistes', value: 'soft-folds' }
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
  const base = ctx.createLinearGradient(0, 0, w * 0.9, h)
  if (style === 'photocopy') {
    base.addColorStop(0, '#e8e8e8')
    base.addColorStop(0.45, '#f6f5f1')
    base.addColorStop(1, '#e4e3df')
  } else if (style === 'double-fold' || style === 'soft-folds') {
    base.addColorStop(0, '#faf9f7')
    base.addColorStop(0.48, '#fffefd')
    base.addColorStop(1, '#f4f4f2')
  } else {
    base.addColorStop(0, style === 'crumpled' ? '#f0efea' : '#f5f4f0')
    base.addColorStop(0.5, '#fffefa')
    base.addColorStop(1, style === 'creased' ? '#ecebe7' : '#f1f0eb')
  }
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  let state = (seed >>> 0) || 1
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  const grain = ctx.getImageData(0, 0, w, h)
  const d = grain.data
  const strength = style === 'photocopy' ? 13 : style === 'crumpled' ? 8 : style === 'double-fold' || style === 'soft-folds' ? 3 : 4
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

  if (style === 'double-fold') {
    // Like a sheet folded into thirds and opened again: two long, imperfect
    // horizontal creases with subtle cool-grey shadows and pale highlights.
    const first = 0.32 + (random() - 0.5) * 0.045
    const second = 0.68 + (random() - 0.5) * 0.045
    crease(false, first, 0.095 + random() * 0.025, Math.max(3, h * 0.006))
    crease(false, second, 0.075 + random() * 0.025, Math.max(3, h * 0.005))
    // A slight edge shadow and a few tiny paper specks make it feel scanned.
    const edge = ctx.createLinearGradient(0, 0, w, 0)
    edge.addColorStop(0, 'rgba(125,145,155,0.07)')
    edge.addColorStop(0.08, 'rgba(255,255,255,0)')
    edge.addColorStop(0.92, 'rgba(255,255,255,0)')
    edge.addColorStop(1, 'rgba(125,145,155,0.06)')
    ctx.fillStyle = edge
    ctx.fillRect(0, 0, w, h)
    const specks = Math.max(18, Math.floor(w * h / 18000))
    for (let i = 0; i < specks; i++) {
      const x = random() * w
      const y = random() * h
      ctx.fillStyle = `rgba(70,75,78,${0.035 + random() * 0.05})`
      ctx.fillRect(x, y, Math.max(1, w * 0.001), Math.max(1, h * 0.0007))
    }
  } else if (style === 'soft-folds') {
    // A quieter variant with diagonal and gently curved-looking fold bands.
    crease(false, 0.29 + (random() - 0.5) * 0.1, 0.055 + random() * 0.025, Math.max(3, h * 0.004))
    crease(true, 0.53 + (random() - 0.5) * 0.12, 0.035 + random() * 0.025, Math.max(3, w * 0.003))
    const count = 4 + Math.floor(random() * 4)
    for (let i = 0; i < count; i++) {
      const x = random() * w
      const y = random() * h
      const len = Math.min(w, h) * (0.06 + random() * 0.12)
      const angle = random() * Math.PI
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + Math.cos(angle + 0.35) * len * 0.5, y + Math.sin(angle + 0.35) * len * 0.5, x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.strokeStyle = random() > 0.5 ? 'rgba(100,110,115,0.045)' : 'rgba(255,255,255,0.22)'
      ctx.lineWidth = Math.max(2, w * 0.002)
      ctx.stroke()
    }
  } else if (style === 'folded') {
    const primaryVertical = random() > 0.5
    const primaryPosition = 0.36 + random() * 0.3
    const secondaryPosition = 0.35 + random() * 0.3
    crease(primaryVertical, primaryPosition, 0.09 + random() * 0.06, Math.max(4, (primaryVertical ? w : h) * 0.008))
    if (random() > 0.24) crease(!primaryVertical, secondaryPosition, 0.07 + random() * 0.06, Math.max(4, (primaryVertical ? h : w) * 0.006))
    if (random() > 0.65) crease(random() > 0.5, 0.2 + random() * 0.6, 0.035 + random() * 0.035, Math.max(3, Math.min(w, h) * 0.003))
  } else if (style === 'creased') {
    const count = 2 + Math.floor(random() * 3)
    for (let i = 0; i < count; i++) {
      const vertical = random() > 0.58
      const position = 0.15 + random() * 0.7
      crease(vertical, position, 0.045 + random() * 0.06, Math.max(3, (vertical ? w : h) * (0.003 + random() * 0.004)))
    }
  } else if (style === 'crumpled') {
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

  // Extract foreground from the rendered PDF: near-white pixels become
  // transparent, while text and colored graphics remain in their original
  // colors. This places the paper texture genuinely behind the document.
  const foregroundCanvas = document.createElement('canvas')
  foregroundCanvas.width = w
  foregroundCanvas.height = h
  const foregroundContext = foregroundCanvas.getContext('2d', { willReadFrequently: true })
  if (!foregroundContext) {
    source.close()
    return pageBlob
  }
  foregroundContext.drawImage(source, 0, 0)
  source.close()
  const foreground = foregroundContext.getImageData(0, 0, w, h)
  const pixels = foreground.data
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const darkness = 255 - (0.299 * r + 0.587 * g + 0.114 * b)
    pixels[i + 3] = Math.round(Math.max(0, Math.min(255, (darkness - 3) * 1.35)))
  }
  foregroundContext.putImageData(foreground, 0, 0)
  ctx.drawImage(foregroundCanvas, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create paper background')), 'image/png')
  })
}

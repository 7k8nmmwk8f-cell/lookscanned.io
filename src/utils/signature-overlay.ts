export interface SignatureOverlay {
  id?: string
  image?: Blob
  x: number
  y: number
  width: number
  page: number
  staple?: boolean
  enabled?: boolean
}

export const defaultSignatureOverlay: SignatureOverlay = {
  id: 'stamp-1',
  x: 68,
  y: 78,
  width: 22,
  page: 0,
  staple: false,
  enabled: true
}

export const defaultSignatureOverlays = (): SignatureOverlay[] => [
  { ...defaultSignatureOverlay, id: 'stamp-1', x: 68, y: 78 },
  { ...defaultSignatureOverlay, id: 'stamp-2', x: 32, y: 84 },
  { ...defaultSignatureOverlay, id: 'stamp-3', x: 50, y: 65 }
]

function drawStaple(context: CanvasRenderingContext2D, w: number, h: number) {
  const x = w * 0.055
  const y = h * 0.032
  const stapleWidth = w * 0.033
  const stapleHeight = stapleWidth * 0.19
  context.save()
  context.translate(x, y)
  context.rotate(-Math.PI / 7)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.fillStyle = 'rgba(45,45,45,0.28)'
  context.beginPath()
  context.ellipse(-stapleWidth * 0.34, stapleHeight * 1.15, stapleWidth * 0.07, stapleHeight * 0.22, 0, 0, Math.PI * 2)
  context.ellipse(stapleWidth * 0.34, stapleHeight * 1.15, stapleWidth * 0.07, stapleHeight * 0.22, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = 'rgba(25,25,25,0.28)'
  context.lineWidth = Math.max(2, stapleHeight * 0.85)
  context.beginPath()
  context.moveTo(-stapleWidth / 2, stapleHeight * 0.6)
  context.lineTo(-stapleWidth / 2, -stapleHeight * 0.15)
  context.lineTo(stapleWidth / 2, -stapleHeight * 0.15)
  context.lineTo(stapleWidth / 2, stapleHeight * 0.6)
  context.stroke()
  const metal = context.createLinearGradient(0, -stapleHeight, 0, stapleHeight)
  metal.addColorStop(0, '#fdfdfd')
  metal.addColorStop(0.35, '#8b8b8b')
  metal.addColorStop(0.62, '#eeeeee')
  metal.addColorStop(1, '#686868')
  context.strokeStyle = metal
  context.lineWidth = Math.max(2, stapleHeight * 0.5)
  context.beginPath()
  context.moveTo(-stapleWidth / 2, stapleHeight * 0.6)
  context.lineTo(-stapleWidth / 2, -stapleHeight * 0.15)
  context.lineTo(stapleWidth / 2, -stapleHeight * 0.15)
  context.lineTo(stapleWidth / 2, stapleHeight * 0.6)
  context.stroke()
  context.restore()
}

export async function applySignatureOverlay(
  pageBlob: Blob,
  overlays: SignatureOverlay | SignatureOverlay[] | undefined,
  pageNumber: number
): Promise<Blob> {
  const list = (Array.isArray(overlays) ? overlays : overlays ? [overlays] : [])
    .filter(item => item.enabled !== false)
  const applicable = list.filter(item => item.page === 0 || item.page === pageNumber)
  const applyStaple = applicable.some(item => item.staple)
  const stamps = applicable.filter(item => !!item.image)
  if (!applyStaple && stamps.length === 0) return pageBlob

  const pageImage = await createImageBitmap(pageBlob)
  const stampImages = await Promise.all(stamps.map(async overlay => ({
    overlay,
    image: await createImageBitmap(overlay.image!)
  })))
  const canvas = document.createElement('canvas')
  canvas.width = pageImage.width
  canvas.height = pageImage.height
  const context = canvas.getContext('2d')
  if (!context) {
    pageImage.close()
    stampImages.forEach(item => item.image.close())
    throw new Error('Canvas not supported')
  }

  context.drawImage(pageImage, 0, 0)
  // Hardware/metal detail is composited over the PDF content.
  if (applyStaple) drawStaple(context, canvas.width, canvas.height)
  // Array order is the layer order: later entries are drawn on top.
  for (const { overlay, image } of stampImages) {
    const targetWidth = Math.max(1, canvas.width * overlay.width / 100)
    const ratio = image.width ? image.height / image.width : 1
    const targetHeight = targetWidth * ratio
    const x = canvas.width * overlay.x / 100 - targetWidth / 2
    const y = canvas.height * overlay.y / 100 - targetHeight / 2
    context.drawImage(image, x, y, targetWidth, targetHeight)
    image.close()
  }
  pageImage.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create signature preview')), 'image/png')
  })
}

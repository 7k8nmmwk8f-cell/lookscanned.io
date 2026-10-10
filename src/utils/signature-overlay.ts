export interface SignatureOverlay {
  image?: Blob
  x: number
  y: number
  width: number
  page: number
  staple?: boolean
}

export const defaultSignatureOverlay: SignatureOverlay = {
  x: 68,
  y: 78,
  width: 22,
  page: 0,
  staple: false
}

export async function applySignatureOverlay(
  pageBlob: Blob,
  overlay: SignatureOverlay | undefined,
  pageNumber: number
): Promise<Blob> {
  const applyStamp = !!overlay?.image && (overlay.page === 0 || overlay.page === pageNumber)
  const applyStaple = !!overlay?.staple
  if (!applyStamp && !applyStaple) return pageBlob

  const pageImage = await createImageBitmap(pageBlob)
  const signatureImage = applyStamp && overlay?.image ? await createImageBitmap(overlay.image) : undefined
  const canvas = document.createElement('canvas')
  canvas.width = pageImage.width
  canvas.height = pageImage.height
  const context = canvas.getContext('2d')
  if (!context) {
    pageImage.close()
    signatureImage?.close()
    throw new Error('Canvas not supported')
  }

  context.drawImage(pageImage, 0, 0)
  // The staple is deliberately composited AFTER the PDF content, so it looks
  // like a real metal staple sitting on top of the scanned document.
  if (applyStaple) {
    const w = canvas.width
    const h = canvas.height
    const x = w * 0.055
    const y = h * 0.032
    const stapleWidth = w * 0.033
    const stapleHeight = stapleWidth * 0.19
    context.save()
    context.translate(x, y)
    context.rotate(-Math.PI / 7)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    // tiny punctures beside the ends
    context.fillStyle = 'rgba(45,45,45,0.28)'
    context.beginPath()
    context.ellipse(-stapleWidth * 0.34, stapleHeight * 1.15, stapleWidth * 0.07, stapleHeight * 0.22, 0, 0, Math.PI * 2)
    context.ellipse(stapleWidth * 0.34, stapleHeight * 1.15, stapleWidth * 0.07, stapleHeight * 0.22, 0, 0, Math.PI * 2)
    context.fill()
    // soft shadow
    context.strokeStyle = 'rgba(25,25,25,0.28)'
    context.lineWidth = Math.max(2, stapleHeight * 0.85)
    context.beginPath()
    context.moveTo(-stapleWidth / 2, stapleHeight * 0.6)
    context.lineTo(-stapleWidth / 2, -stapleHeight * 0.15)
    context.lineTo(stapleWidth / 2, -stapleHeight * 0.15)
    context.lineTo(stapleWidth / 2, stapleHeight * 0.6)
    context.stroke()
    // metallic wire highlight
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

  if (signatureImage && overlay) {
    const targetWidth = Math.max(1, canvas.width * overlay.width / 100)
    const ratio = signatureImage.width ? signatureImage.height / signatureImage.width : 1
    const targetHeight = targetWidth * ratio
    const x = canvas.width * overlay.x / 100 - targetWidth / 2
    const y = canvas.height * overlay.y / 100 - targetHeight / 2
    context.drawImage(signatureImage, x, y, targetWidth, targetHeight)
  }
  pageImage.close()
  signatureImage?.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create signature preview')), 'image/png')
  })
}

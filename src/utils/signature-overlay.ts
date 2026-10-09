export interface SignatureOverlay {
  image?: Blob
  x: number
  y: number
  width: number
  page: number
}

export const defaultSignatureOverlay: SignatureOverlay = {
  x: 68,
  y: 78,
  width: 22,
  page: 0
}

export async function applySignatureOverlay(
  pageBlob: Blob,
  overlay: SignatureOverlay | undefined,
  pageNumber: number
): Promise<Blob> {
  if (!overlay?.image || (overlay.page !== 0 && overlay.page !== pageNumber)) return pageBlob

  const [pageImage, signatureImage] = await Promise.all([
    createImageBitmap(pageBlob),
    createImageBitmap(overlay.image)
  ])
  const canvas = document.createElement('canvas')
  canvas.width = pageImage.width
  canvas.height = pageImage.height
  const context = canvas.getContext('2d')
  if (!context) {
    pageImage.close()
    signatureImage.close()
    throw new Error('Canvas not supported')
  }

  context.drawImage(pageImage, 0, 0)
  const targetWidth = Math.max(1, canvas.width * overlay.width / 100)
  const ratio = signatureImage.width ? signatureImage.height / signatureImage.width : 1
  const targetHeight = targetWidth * ratio
  const x = canvas.width * overlay.x / 100 - targetWidth / 2
  const y = canvas.height * overlay.y / 100 - targetHeight / 2
  context.drawImage(signatureImage, x, y, targetWidth, targetHeight)
  pageImage.close()
  signatureImage.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create signature preview')), 'image/png')
  })
}

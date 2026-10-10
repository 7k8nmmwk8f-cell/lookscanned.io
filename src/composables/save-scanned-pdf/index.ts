import type { Ref } from 'vue'
import { get } from '@vueuse/core'
import { ref, computed, watch } from 'vue'
import { buildPDF } from '@/utils/pdf-builder/pdf-lib'
import { applySignatureOverlay, type SignatureOverlay } from '@/utils/signature-overlay'
import { applyPaperBackground, type PaperBackgroundStyle } from '@/utils/paper-background'

interface PDFRenderer {
  renderPage(page: number, scale: number): Promise<{ blob: Blob; height: number; width: number; ppi: number }>
  getNumPages(): Promise<number>
}
interface ScanRenderer { renderPage(image: Blob): Promise<{ blob: Blob }> }

export function useSaveScannedPDF(
  pdf: Ref<File | undefined>,
  pdfRenderer: Ref<PDFRenderer | undefined>,
  scanRenderer: Ref<ScanRenderer | undefined>,
  scale: Ref<number>,
  signatureOverlay?: Ref<SignatureOverlay[]>,
  paperBackground?: Ref<PaperBackgroundStyle>
) {
  const finishedPages = ref(0)
  const totalPages = ref(0)
  const progress = computed(() => totalPages.value === 0 ? 0 : finishedPages.value / totalPages.value)
  const saving = ref(false)
  const scannedPDF = ref<File | undefined>(undefined)
  const outputFilename = computed(() => {
    const originalFilename = pdf.value?.name ?? 'doc.pdf'
    return `${originalFilename.replace(/\.[^/.]+$/, '')}-scan.pdf`
  })
  const reset = () => { finishedPages.value = 0; totalPages.value = 0; scannedPDF.value = undefined; saving.value = false }
  watch(pdfRenderer, reset)
  watch(scanRenderer, reset)
  watch(scale, reset)
  if (signatureOverlay) watch(signatureOverlay, reset, { deep: true })
  if (paperBackground) watch(paperBackground, reset)

  const save = async () => {
    try {
      finishedPages.value = 0; totalPages.value = 0; saving.value = true
      const pdf = get(pdfRenderer), scan = get(scanRenderer), scale_ = get(scale)
      if (!pdf || !scan) throw new Error('No PDF or Scan Renderer')
      const numPages = await pdf.getNumPages()
      totalPages.value = numPages
      const pages = Array.from({ length: numPages }, (_, i) => i + 1)
      const scanPages = await Promise.all(pages.map(async page => {
        const { blob: pdfPage, height, width } = await pdf.renderPage(page, scale_)
        const paperPage = await applyPaperBackground(pdfPage, paperBackground ? get(paperBackground) : undefined, page)
        const composedPage = await applySignatureOverlay(paperPage, signatureOverlay ? get(signatureOverlay) : undefined, page)
        const { blob: scanPage } = await scan.renderPage(composedPage)
        finishedPages.value += 1
        return { blob: scanPage, width, height, ppi: scale_ * 72 }
      }))
      const pdfDocument = await buildPDF(scanPages)
      scannedPDF.value = new File([pdfDocument], outputFilename.value, { type: 'application/pdf' })
      return pdfDocument
    } catch (e) {
      console.error(e)
      throw e
    } finally { saving.value = false }
  }
  return { save, progress, saving, scannedPDF }
}

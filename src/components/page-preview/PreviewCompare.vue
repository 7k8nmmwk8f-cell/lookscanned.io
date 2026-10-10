<template>
  <n-space vertical>
    <SideBySidePreview>
      <template #pdf><ImagePreview :image="image?.blob" /></template>
      <template #scan>
        <div class="scan-preview-stage" :style="stageStyle">
          <ImagePreview :image="scanning ? undefined : scanImage?.blob" :height="image?.height" :width="image?.width" />
          <img
            v-for="(overlay, index) in visibleOverlays"
            :key="overlay.id || index"
            :src="overlay.image ? getImageUrl(overlay.image) : undefined"
            class="draggable-stamp"
            :class="{ 'is-dragging': activeDragIndex === index }"
            :style="stampStyle(overlay, index)"
            :alt="(isFrench ? 'Tampon ' : 'Stamp ') + (index + 1)"
            draggable="false"
            @pointerdown.stop.prevent="startDrag($event, index)"
            @pointermove.stop.prevent="moveDrag($event, index)"
            @pointerup.stop.prevent="endDrag(index)"
            @pointercancel="endDrag(index)"
          />
        </div>
      </template>
    </SideBySidePreview>
    <n-space v-if="signatureOverlay?.some(item => item.image)" align="center" justify="space-between">
      <span class="drag-hint">{{ isFrench ? 'Déplace un tampon, puis relâche. Pour recalculer manuellement :' : 'Move a stamp and release. To recalculate manually:' }}</span>
      <n-button size="small" secondary :loading="scanning" @click="refreshPreview">{{ isFrench ? 'Actualiser l’aperçu' : 'Refresh preview' }}</n-button>
    </n-space>
    <PreviewPagination v-model:page="page" :numPages="numPages" v-if="numPages >= 2" />
  </n-space>
</template>

<script lang="ts" setup>
import SideBySidePreview from './SideBySidePreview.vue'
import ImagePreview from './ImagePreview.vue'
import { ref, computed, onBeforeUnmount } from 'vue'
import { computedAsync } from '@vueuse/core'
import PreviewPagination from './PreviewPagination.vue'
import { applySignatureOverlay, type SignatureOverlay, type DocumentOptions } from '@/utils/signature-overlay'
import { applyPaperBackground, type PaperBackgroundStyle } from '@/utils/paper-background'
import { NSpace, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const page = ref(1)
const scanning = ref(false)
const activeDragIndex = ref<number | null>(null)
const dragX = ref(50)
const dragY = ref(50)
const previewVersion = ref(0)
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
interface PDFRenderer {
  renderPage(page: number, scale: number): Promise<{ blob: Blob; width: number; height: number }>
  getNumPages(): Promise<number>
}
interface ScanRenderer { renderPage(image: Blob, options?: { signal?: AbortSignal }): Promise<{ blob: Blob }> }
const props = defineProps<{
  pdfRenderer?: PDFRenderer
  scanRenderer?: ScanRenderer
  scale: number
  signatureOverlay?: SignatureOverlay[]
  paperBackground?: PaperBackgroundStyle
  documentOptions?: DocumentOptions
}>()
const emit = defineEmits<{ (e: 'update:signatureOverlay', value: SignatureOverlay[]): void }>()
const objectUrls = new Map<Blob, string>()
function getImageUrl(blob: Blob) {
  let url = objectUrls.get(blob)
  if (!url) { url = URL.createObjectURL(blob); objectUrls.set(blob, url) }
  return url
}
onBeforeUnmount(() => { for (const url of objectUrls.values()) URL.revokeObjectURL(url); objectUrls.clear() })

const image = computedAsync(async () => {
  const renderer = props.pdfRenderer, currentPage = page.value, scale = props.scale
  if (!renderer) return { blob: undefined, height: undefined, width: undefined }
  const { blob, width, height } = await renderer.renderPage(currentPage, scale)
  return { blob, width, height }
})
const stageStyle = computed(() => ({
  aspectRatio: image.value?.width && image.value?.height ? `${image.value.width} / ${image.value.height}` : '1 / 1'
}))
const visibleOverlays = computed(() => (props.signatureOverlay || []).filter(item =>
  item.enabled !== false && item.image && (item.page === 0 || item.page === page.value)
))
function stampStyle(overlay: SignatureOverlay, index: number) {
  const active = activeDragIndex.value === index
  return {
    left: `${active ? dragX.value : overlay.x}%`,
    top: `${active ? dragY.value : overlay.y}%`,
    width: `${overlay.width}%`,
    zIndex: index + 5
  }
}
function startDrag(event: PointerEvent, index: number) {
  const overlay = visibleOverlays.value[index]
  if (!overlay) return
  activeDragIndex.value = index
  dragX.value = overlay.x
  dragY.value = overlay.y
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  updateDragPosition(event)
}
function updateDragPosition(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return
  dragX.value = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  dragY.value = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
}
function moveDrag(event: PointerEvent, index: number) {
  if (activeDragIndex.value !== index) return
  updateDragPosition(event)
}
function endDrag(index: number) {
  if (activeDragIndex.value !== index) return
  const visible = visibleOverlays.value[index]
  const all = props.signatureOverlay || []
  if (visible) {
    const sourceIndex = all.findIndex(item => item.id === visible.id)
    if (sourceIndex >= 0) {
      const next = all.map((item, i) => i === sourceIndex ? { ...item, x: dragX.value, y: dragY.value } : item)
      emit('update:signatureOverlay', next)
    }
  }
  activeDragIndex.value = null
}
function refreshPreview() { previewVersion.value++ }

let controller = new AbortController()
const scanImage = computedAsync(async () => {
  const version = previewVersion.value
  controller.abort()
  controller = new AbortController()
  const signal = controller.signal
  const source = image.value?.blob
  const renderer = props.scanRenderer
  const overlays = props.signatureOverlay ? props.signatureOverlay.map(item => ({ ...item })) : []
  const background = props.paperBackground
  const documentOptions = props.documentOptions
  const currentPage = page.value
  if (!renderer || !source) return
  scanning.value = true
  try {
    const paperPage = await applyPaperBackground(source, background, currentPage)
    if (signal.aborted) return
    const composedPage = await applySignatureOverlay(paperPage, overlays, currentPage, documentOptions)
    if (signal.aborted) return
    const { blob } = await renderer.renderPage(composedPage, { signal })
    if (signal.aborted || version !== previewVersion.value) return
    return { blob }
  } finally { if (!signal.aborted) scanning.value = false }
}, undefined)

const numPages = computedAsync(async () => {
  page.value = 1
  if (!props.pdfRenderer) return 1
  return await props.pdfRenderer.getNumPages()
}, 1)
</script>

<style scoped>
.scan-preview-stage { position: relative; width: 100%; overflow: hidden; touch-action: pan-y; }
.scan-preview-stage :deep(img) { display: block; max-width: 100%; }
.draggable-stamp {
  position: absolute; transform: translate(-50%, -50%); height: auto; max-width: none !important;
  cursor: move; touch-action: none; user-select: none; -webkit-user-drag: none;
  outline: 1px dashed rgba(40, 100, 220, 0.7); outline-offset: 3px;
}
.draggable-stamp.is-dragging { filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.25)); outline-color: #3478f6; }
.drag-hint { font-size: 12px; opacity: 0.72; }
</style>

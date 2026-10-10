<template>
  <n-space vertical>
    <SideBySidePreview>
      <template #pdf>
        <ImagePreview :image="image?.blob" />
      </template>
      <template #scan>
        <div class="scan-preview-stage" :style="stageStyle">
          <ImagePreview :image="scanning ? undefined : scanImage?.blob" :height="image?.height" :width="image?.width" />
          <img
            v-if="signatureOverlay?.image && (signatureOverlay.page === 0 || signatureOverlay.page === page)"
            :src="signatureUrl || undefined"
            class="draggable-stamp"
            :class="{ 'is-dragging': dragging }"
            :style="stampStyle"
            alt="Signature / tampon"
            draggable="false"
            @pointerdown.stop.prevent="startDrag"
            @pointermove.stop.prevent="moveDrag"
            @pointerup.stop.prevent="endDrag"
            @pointercancel="endDrag"
          />
        </div>
      </template>
    </SideBySidePreview>
    <n-space v-if="signatureOverlay?.image" align="center" justify="space-between">
      <span class="drag-hint">{{ isFrench ? 'Déplace le tampon, puis relâche pour actualiser l’aperçu.' : 'Move the stamp, then release to refresh the preview.' }}</span>
      <n-button size="small" secondary :loading="scanning" @click="refreshPreview">
        {{ isFrench ? 'Actualiser l’aperçu' : 'Refresh preview' }}
      </n-button>
    </n-space>
    <PreviewPagination v-model:page="page" :numPages="numPages" v-if="numPages >= 2" />
  </n-space>
</template>

<script lang="ts" setup>
import SideBySidePreview from './SideBySidePreview.vue'
import ImagePreview from './ImagePreview.vue'
import { ref, computed, watch } from 'vue'
import { computedAsync, useObjectUrl } from '@vueuse/core'
import PreviewPagination from './PreviewPagination.vue'
import { applySignatureOverlay, type SignatureOverlay } from '@/utils/signature-overlay'
import { applyPaperBackground, type PaperBackgroundStyle } from '@/utils/paper-background'
import { NSpace, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const page = ref(1)
const scanning = ref(false)
const dragging = ref(false)
const dragX = ref(68)
const dragY = ref(78)
const previewVersion = ref(0)
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))

interface PDFRenderer {
  renderPage(page: number, scale: number): Promise<{ blob: Blob; width: number; height: number }>
  getNumPages(): Promise<number>
}
interface ScanRenderer {
  renderPage(image: Blob, options?: { signal?: AbortSignal }): Promise<{ blob: Blob }>
}

const props = defineProps<{
  pdfRenderer?: PDFRenderer
  scanRenderer?: ScanRenderer
  scale: number
  signatureOverlay?: SignatureOverlay
  paperBackground?: PaperBackgroundStyle
}>()
const emit = defineEmits<{ (e: 'update:signatureOverlay', value: SignatureOverlay): void }>()
const signatureUrl = useObjectUrl(computed(() => props.signatureOverlay?.image))

const image = computedAsync(async () => {
  const renderer = props.pdfRenderer
  const currentPage = page.value
  const scale = props.scale
  if (!renderer) return { blob: undefined, height: undefined, width: undefined }
  const { blob, width, height } = await renderer.renderPage(currentPage, scale)
  return { blob, width, height }
})

const stageStyle = computed(() => ({
  aspectRatio: image.value?.width && image.value?.height ? `${image.value.width} / ${image.value.height}` : '1 / 1'
}))
const stampStyle = computed(() => ({
  left: `${dragging.value ? dragX.value : props.signatureOverlay?.x ?? 68}%`,
  top: `${dragging.value ? dragY.value : props.signatureOverlay?.y ?? 78}%`,
  width: `${props.signatureOverlay?.width ?? 22}%`
}))

function startDrag(event: PointerEvent) {
  if (!props.signatureOverlay) return
  dragging.value = true
  dragX.value = props.signatureOverlay.x
  dragY.value = props.signatureOverlay.y
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  updateDragPosition(event)
}
function updateDragPosition(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return
  dragX.value = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  dragY.value = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value) return
  // Keep this interaction purely visual while dragging: no PDF composition,
  // scan processing, or parent-state updates happen on every pointer event.
  updateDragPosition(event)
}
function endDrag() {
  if (!dragging.value) return
  dragging.value = false
  // One state update on release triggers only one new preview render.
  emit('update:signatureOverlay', {
    ...props.signatureOverlay!,
    x: dragX.value,
    y: dragY.value
  })
}
function refreshPreview() {
  previewVersion.value++
}

let controller = new AbortController()
const scanImage = computedAsync(async () => {
  const version = previewVersion.value
  controller.abort()
  controller = new AbortController()
  const signal = controller.signal
  const source = image.value?.blob
  const renderer = props.scanRenderer
  const overlay = props.signatureOverlay ? { ...props.signatureOverlay } : undefined
  const background = props.paperBackground
  const currentPage = page.value
  if (!renderer || !source) return
  scanning.value = true
  try {
    const paperPage = await applyPaperBackground(source, background, currentPage)
    if (signal.aborted) return
    const composedPage = await applySignatureOverlay(paperPage, overlay, currentPage)
    if (signal.aborted) return
    const { blob } = await renderer.renderPage(composedPage, { signal })
    if (signal.aborted || version !== previewVersion.value) return
    return { blob }
  } finally {
    if (!signal.aborted) scanning.value = false
  }
}, undefined)

watch(() => props.signatureOverlay && [
  props.signatureOverlay.image,
  props.signatureOverlay.x,
  props.signatureOverlay.y,
  props.signatureOverlay.width,
  props.signatureOverlay.page,
  props.signatureOverlay.staple
], () => {
  // Reactive updates from controls still refresh the preview, but dragging
  // only emits once on release.
})

const numPages = computedAsync(async () => {
  page.value = 1
  if (!props.pdfRenderer) return 1
  return await props.pdfRenderer.getNumPages()
}, 1)
</script>

<style scoped>
.scan-preview-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}
.scan-preview-stage :deep(img) {
  display: block;
  max-width: 100%;
}
.draggable-stamp {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -50%);
  height: auto;
  max-width: none !important;
  cursor: move;
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;
  outline: 1px dashed rgba(40, 100, 220, 0.7);
  outline-offset: 3px;
}
.draggable-stamp.is-dragging {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.25));
  outline-color: #3478f6;
}
.drag-hint {
  font-size: 12px;
  opacity: 0.72;
}
</style>

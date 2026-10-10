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
import { NSpace } from 'naive-ui'

const page = ref(1)
const scanning = ref(false)
const dragging = ref(false)
const stage = ref<HTMLElement>()
const signatureUrl = useObjectUrl(computed(() => props.signatureOverlay?.image))

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
  left: `${props.signatureOverlay?.x ?? 68}%`,
  top: `${props.signatureOverlay?.y ?? 78}%`,
  width: `${props.signatureOverlay?.width ?? 22}%`
}))

function startDrag(event: PointerEvent) {
  if (!props.signatureOverlay) return
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  moveDrag(event)
}
function moveDrag(event: PointerEvent) {
  if (!dragging.value || !props.signatureOverlay) return
  const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return
  const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
  emit('update:signatureOverlay', { ...props.signatureOverlay, x, y })
}
function endDrag() {
  dragging.value = false
}

let controller = new AbortController()
const scanImage = computedAsync(async () => {
  controller.abort()
  controller = new AbortController()
  // Read reactive inputs before the first await so changes trigger a new render.
  const source = image.value?.blob
  const renderer = props.scanRenderer
  const overlay = props.signatureOverlay ? { ...props.signatureOverlay } : undefined
  const background = props.paperBackground
  const currentPage = page.value
  if (!renderer || !source) return
  const paperPage = await applyPaperBackground(source, background, currentPage)
  const composedPage = await applySignatureOverlay(paperPage, overlay, currentPage)
  const { blob } = await renderer.renderPage(composedPage, { signal: controller.signal })
  return { blob }
}, undefined, scanning)

const numPages = computedAsync(async () => {
  page.value = 1
  if (!props.pdfRenderer) return 1
  return await props.pdfRenderer.getNumPages()
}, 1)

watch(() => props.signatureOverlay && [
  props.signatureOverlay.image,
  props.signatureOverlay.x,
  props.signatureOverlay.y,
  props.signatureOverlay.width,
  props.signatureOverlay.page
], () => {
  // The scan computedAsync tracks the primitive overlay fields above.
})
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
</style>

<template>
  <n-card>
    <n-space vertical :size="12">
      <n-text strong>{{ isFrench ? 'Signature / tampon' : 'Signature / stamp' }}</n-text>
      <n-text depth="3" style="font-size: 12px">
        {{ isFrench ? 'Ajoute une image PNG/JPG. Le fond clair connecté aux bords sera retiré automatiquement.' : 'Add a PNG/JPG image. Light background connected to the edges will be removed automatically.' }}
      </n-text>
      <input type="file" accept="image/png,image/jpeg,image/webp" @change="onFileChange" />
      <n-button v-if="modelValue.image" size="small" secondary @click="removeImage">
        {{ isFrench ? 'Retirer la signature' : 'Remove signature' }}
      </n-button>
      <template v-if="modelValue.image">
        <n-checkbox v-model:checked="removeWhite" @update:checked="reprocess">
          {{ isFrench ? 'Retirer le fond' : 'Remove background' }}
        </n-checkbox>
        <n-text>{{ isFrench ? 'Position horizontale' : 'Horizontal position' }}: {{ modelValue.x }}%</n-text>
        <n-slider v-model:value="modelValue.x" :min="0" :max="100" />
        <n-text>{{ isFrench ? 'Position verticale' : 'Vertical position' }}: {{ modelValue.y }}%</n-text>
        <n-slider v-model:value="modelValue.y" :min="0" :max="100" />
        <n-text>{{ isFrench ? 'Taille' : 'Size' }}: {{ modelValue.width }}%</n-text>
        <n-slider v-model:value="modelValue.width" :min="5" :max="60" />
        <n-text>{{ isFrench ? 'Appliquer sur' : 'Apply to' }}</n-text>
        <n-select v-model:value="modelValue.page" :options="pageOptions" />
        <n-text depth="3" style="font-size: 12px">
          {{ isFrench ? 'La signature sera intégrée au PDF et recevra les mêmes effets de scan.' : 'The signature will be embedded in the PDF and receive the same scan effects.' }}
        </n-text>
      </template>
    </n-space>
  </n-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NCard, NSpace, NText, NButton, NCheckbox, NSlider, NSelect } from 'naive-ui'
import type { SignatureOverlay } from '@/utils/signature-overlay'
import { defaultSignatureOverlay } from '@/utils/signature-overlay'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ modelValue: SignatureOverlay; numPages?: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: SignatureOverlay): void }>()
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
const removeWhite = ref(true)
const originalFile = ref<File | undefined>()
const pageOptions = computed(() => [
  { label: isFrench.value ? 'Toutes les pages' : 'All pages', value: 0 },
  ...Array.from({ length: props.numPages || 1 }, (_, i) => ({
    label: 'Page ' + (i + 1),
    value: i + 1
  }))
])

function update(patch: Partial<SignatureOverlay>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

/**
 * Remove the light paper/photo background that touches the image edges.
 * Unlike a simple "almost white" threshold, edge-connected flood fill also
 * handles uneven grey scanner backgrounds while preserving dark stamp ink.
 */
async function processImage(file: File) {
  originalFile.value = file
  if (!removeWhite.value) {
    update({ image: file })
    return
  }

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    update({ image: file })
    bitmap.close()
    return
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  const total = width * height
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const isBackgroundCandidate = (pixel: number) => {
    const i = pixel * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    // Bright/light grey paper, including slightly mottled scans. Dark ink is
    // deliberately excluded so letters and stamp outlines stay opaque.
    return brightness >= 132 && chroma <= 82
  }

  const addSeed = (pixel: number) => {
    if (!visited[pixel] && isBackgroundCandidate(pixel)) {
      visited[pixel] = 1
      queue[tail++] = pixel
    }
  }

  // Seed all four edges so only background connected to the outside is removed.
  for (let x = 0; x < width; x++) {
    addSeed(x)
    addSeed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    addSeed(y * width)
    addSeed(y * width + width - 1)
  }

  while (head < tail) {
    const pixel = queue[head++]
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x > 0) addSeed(pixel - 1)
    if (x + 1 < width) addSeed(pixel + 1)
    if (y > 0) addSeed(pixel - width)
    if (y + 1 < height) addSeed(pixel + width)
  }

  // Make the removed paper transparent and soften its boundary to reduce halos.
  for (let pixel = 0; pixel < total; pixel++) {
    const i = pixel * 4
    if (visited[pixel]) {
      data[i + 3] = 0
    } else {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      const chroma = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2])
      // Fade pale anti-aliased pixels just inside the ink edge without
      // washing out the dark stamp lettering.
      if (brightness > 188 && chroma < 65) {
        data[i + 3] = Math.round(data[i + 3] * Math.max(0, (225 - brightness) / 37))
      }
    }
  }

  context.putImageData(imageData, 0, 0)
  canvas.toBlob(blob => update({ image: blob || file }), 'image/png')
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await processImage(file)
}
async function reprocess(value: boolean) {
  removeWhite.value = value
  if (originalFile.value) await processImage(originalFile.value)
}
function removeImage() {
  originalFile.value = undefined
  update({ ...defaultSignatureOverlay, image: undefined })
}
</script>

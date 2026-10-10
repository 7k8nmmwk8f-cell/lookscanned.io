<template>
  <n-card>
    <n-space vertical :size="12">
      <n-text strong>{{ label || (isFrench ? 'Signature / tampon' : 'Signature / stamp') }}</n-text>
      <n-text depth="3" style="font-size: 12px">
        {{ isFrench ? 'Ajoute une image PNG/JPG. Le fond clair connecté aux bords sera retiré automatiquement.' : 'Add a PNG/JPG image. Light background connected to the edges will be removed automatically.' }}
      </n-text>
      <input type="file" accept="image/png,image/jpeg,image/webp" @change="onFileChange" />
      <n-checkbox v-model:checked="stapleEnabled" @update:checked="setStaple">
        {{ isFrench ? 'Ajouter une agrafe en haut à gauche (par-dessus le PDF)' : 'Add a staple at top left (over the PDF)' }}
      </n-checkbox>
      <n-button v-if="modelValue.image" size="small" secondary @click="removeImage">
        {{ isFrench ? 'Retirer le tampon' : 'Remove stamp' }}
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
          {{ isFrench ? 'Les éléments sont superposés dans l’ordre : le tampon 3 passe au-dessus du 2 et du 1.' : 'Layers follow order: stamp 3 appears above stamps 2 and 1.' }}
        </n-text>
      </template>
    </n-space>
  </n-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NCard, NSpace, NText, NButton, NCheckbox, NSlider, NSelect } from 'naive-ui'
import type { SignatureOverlay } from '@/utils/signature-overlay'
import { defaultSignatureOverlay } from '@/utils/signature-overlay'
import { useI18n } from 'vue-i18n'

defineProps<{ modelValue: SignatureOverlay; numPages?: number; label?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: SignatureOverlay): void }>()
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
const removeWhite = ref(true)
const stapleEnabled = ref(false)
watch(() => props.modelValue.staple, value => { stapleEnabled.value = !!value })
const props = defineProps<{ modelValue: SignatureOverlay; numPages?: number; label?: string }>()
const originalFile = ref<File | undefined>()
const pageOptions = computed(() => [
  { label: isFrench.value ? 'Toutes les pages' : 'All pages', value: 0 },
  ...Array.from({ length: props.numPages || 1 }, (_, i) => ({ label: 'Page ' + (i + 1), value: i + 1 }))
])
function update(patch: Partial<SignatureOverlay>) { emit('update:modelValue', { ...props.modelValue, ...patch }) }
function setStaple(value: boolean) { stapleEnabled.value = value; update({ staple: value }) }

async function processImage(file: File) {
  originalFile.value = file
  if (!removeWhite.value) { update({ image: file }); return }
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width; canvas.height = bitmap.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) { update({ image: file }); bitmap.close(); return }
  context.drawImage(bitmap, 0, 0); bitmap.close()
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data, width = canvas.width, height = canvas.height, total = width * height
  const visited = new Uint8Array(total), queue = new Int32Array(total)
  let head = 0, tail = 0
  const isBackgroundCandidate = (pixel: number) => {
    const i = pixel * 4, r = data[i], g = data[i + 1], b = data[i + 2]
    return (r + g + b) / 3 >= 132 && Math.max(r, g, b) - Math.min(r, g, b) <= 82
  }
  const addSeed = (pixel: number) => { if (!visited[pixel] && isBackgroundCandidate(pixel)) { visited[pixel] = 1; queue[tail++] = pixel } }
  for (let x = 0; x < width; x++) { addSeed(x); addSeed((height - 1) * width + x) }
  for (let y = 0; y < height; y++) { addSeed(y * width); addSeed(y * width + width - 1) }
  while (head < tail) {
    const pixel = queue[head++], x = pixel % width, y = Math.floor(pixel / width)
    if (x > 0) addSeed(pixel - 1)
    if (x + 1 < width) addSeed(pixel + 1)
    if (y > 0) addSeed(pixel - width)
    if (y + 1 < height) addSeed(pixel + width)
  }
  for (let pixel = 0; pixel < total; pixel++) {
    const i = pixel * 4
    if (visited[pixel]) data[i + 3] = 0
    else {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      const chroma = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2])
      if (brightness > 188 && chroma < 65) data[i + 3] = Math.round(data[i + 3] * Math.max(0, (225 - brightness) / 37))
    }
  }
  context.putImageData(imageData, 0, 0)
  canvas.toBlob(blob => update({ image: blob || file }), 'image/png')
}
async function onFileChange(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (file) await processImage(file) }
async function reprocess(value: boolean) { removeWhite.value = value; if (originalFile.value) await processImage(originalFile.value) }
function removeImage() { originalFile.value = undefined; update({ ...defaultSignatureOverlay, ...props.modelValue, image: undefined }) }
</script>

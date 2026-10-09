<template>
  <n-card>
    <n-space vertical :size="12">
      <n-text strong>{{ isFrench ? 'Signature / tampon' : 'Signature / stamp' }}</n-text>
      <n-text depth="3" style="font-size: 12px">
        {{ isFrench ? 'Ajoute une image PNG/JPG. Le fond blanc peut être retiré automatiquement.' : 'Add a PNG/JPG image. White background can be removed automatically.' }}
      </n-text>
      <input type="file" accept="image/png,image/jpeg,image/webp" @change="onFileChange" />
      <n-button v-if="modelValue.image" size="small" secondary @click="removeImage">
        {{ isFrench ? 'Retirer la signature' : 'Remove signature' }}
      </n-button>
      <template v-if="modelValue.image">
        <n-checkbox v-model:checked="removeWhite" @update:checked="reprocess">
          {{ isFrench ? 'Retirer le fond blanc' : 'Remove white background' }}
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
  const context = canvas.getContext('2d')
  if (!context) {
    update({ image: file })
    bitmap.close()
    return
  }
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 242 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) < 24) {
      data[i + 3] = 0
    } else if (brightness > 210) {
      data[i + 3] = Math.round(data[i + 3] * (242 - brightness) / 32)
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

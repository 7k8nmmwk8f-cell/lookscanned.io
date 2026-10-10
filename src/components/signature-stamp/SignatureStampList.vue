<template>
  <n-space vertical :size="10">
    <n-collapse :default-expanded-names="['stamp-0']">
    <n-collapse-item v-for="(overlay, index) in visibleOverlays" :key="overlay.id || index" :name="'stamp-' + index" :title="isFrench ? 'Tampon / signature ' + (index + 1) : 'Stamp / signature ' + (index + 1)">
    <SignatureStampCard
      v-for="(overlay, index) in []"
      :model-value="overlay"
      :num-pages="numPages"
      :label="isFrench ? 'Tampon / signature ' + (index + 1) : 'Stamp / signature ' + (index + 1)"
      @update:model-value="updateOverlay(index, $event)"
    />
    </n-collapse-item>
    </n-collapse>
    <n-button v-if="visibleCount < 3" block secondary @click="addOverlay">＋ {{ isFrench ? 'Ajouter un tampon / une signature' : 'Add a stamp / signature' }}</n-button>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSpace, NCollapse, NCollapseItem, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import SignatureStampCard from './SignatureStampCard.vue'
import { defaultSignatureOverlay, type SignatureOverlay } from '@/utils/signature-overlay'

const props = defineProps<{ modelValue: SignatureOverlay[]; numPages?: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: SignatureOverlay[]): void }>()
const { locale } = useI18n()
const visibleCount = computed(() => Math.min(3, Math.max(1, props.modelValue.length)))
const visibleOverlays = computed(() => props.modelValue.slice(0, visibleCount.value))
function addOverlay() {
  if (props.modelValue.length >= 3) return
  const index = props.modelValue.length
  emit('update:modelValue', [...props.modelValue, { ...defaultSignatureOverlay, id: 'stamp-' + (index + 1), x: [68, 32, 50][index], y: [78, 84, 65][index] }])
}
const isFrench = computed(() => locale.value.startsWith('fr'))
function updateOverlay(index: number, overlay: SignatureOverlay) {
  const next = props.modelValue.map((item, i) => i === index ? overlay : item)
  emit('update:modelValue', next)
}
</script>

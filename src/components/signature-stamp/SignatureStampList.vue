<template>
  <n-space vertical :size="14">
    <SignatureStampCard
      v-for="(overlay, index) in modelValue"
      :key="overlay.id || index"
      :model-value="overlay"
      :num-pages="numPages"
      :label="isFrench ? 'Tampon / signature ' + (index + 1) : 'Stamp / signature ' + (index + 1)"
      @update:model-value="updateOverlay(index, $event)"
    />
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import SignatureStampCard from './SignatureStampCard.vue'
import type { SignatureOverlay } from '@/utils/signature-overlay'

const props = defineProps<{ modelValue: SignatureOverlay[]; numPages?: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: SignatureOverlay[]): void }>()
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
function updateOverlay(index: number, overlay: SignatureOverlay) {
  const next = props.modelValue.map((item, i) => i === index ? overlay : item)
  emit('update:modelValue', next)
}
</script>

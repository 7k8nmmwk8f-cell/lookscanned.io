<template>
  <n-card>
    <n-space vertical :size="10">
      <n-text strong>{{ isFrench ? 'Fond papier' : 'Paper background' }}</n-text>
      <n-text depth="3" style="font-size: 12px">
        {{ isFrench ? 'Ajoute une texture derrière le contenu du PDF, avant les effets de scan.' : 'Add a paper texture behind the PDF content, before scan effects.' }}
      </n-text>
      <n-select :value="modelValue" :options="options" @update:value="update" />
    </n-space>
  </n-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { NCard, NSpace, NText, NSelect } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { paperBackgroundOptions, type PaperBackgroundStyle } from '@/utils/paper-background'

const props = defineProps<{ modelValue: PaperBackgroundStyle }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: PaperBackgroundStyle): void }>()
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
const options = computed(() => paperBackgroundOptions.map((option, index) => ({
  ...option,
  label: isFrench.value
    ? ['Aucun fond', 'Papier plié', 'Papier froissé', 'Feuille marquée', 'Photocopie ancienne'][index]
    : ['No background', 'Folded paper', 'Crumpled paper', 'Creased sheet', 'Old photocopy'][index]
})))
function update(value: PaperBackgroundStyle) {
  emit('update:modelValue', value)
}
</script>

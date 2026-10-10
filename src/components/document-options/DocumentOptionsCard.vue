<template>
  <n-card>
    <n-collapse :default-expanded-names="[]">
      <n-collapse-item name="document-options" :title="isFrench ? 'Options à cocher' : 'Document options'">
        <n-space vertical :size="12">
          <n-checkbox :checked="modelValue.staple" @update:checked="update('staple', $event)">
            {{ isFrench ? 'Agrafe en haut à gauche' : 'Staple at top left' }}
          </n-checkbox>
          <n-text depth="3" style="font-size:12px">
            {{ isFrench ? 'Agrafe sur la première page, petits trous sur les pages suivantes.' : 'Staple on the first page, small holes on following pages.' }}
          </n-text>
          <n-checkbox :checked="modelValue.foldedCorner" @update:checked="update('foldedCorner', $event)">
            {{ isFrench ? 'Coin de page corné' : 'Folded page corner' }}
          </n-checkbox>
        </n-space>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NCollapse, NCollapseItem, NSpace, NCheckbox, NText } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DocumentOptions } from '@/utils/signature-overlay'
const props = defineProps<{ modelValue: DocumentOptions }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: DocumentOptions): void }>()
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
function update(key: keyof DocumentOptions, value: boolean) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

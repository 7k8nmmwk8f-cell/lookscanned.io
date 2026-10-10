<template>
  <n-card class="customization-card" :segmented="{ content: true, footer: 'soft' }">
    <n-collapse :default-expanded-names="['Settings']">
      <template #header-extra><n-icon><ChevronDown12Regular /></n-icon></template>
      <template #arrow><n-icon class="customization-icon"><AreaCustom /></n-icon></template>
      <n-collapse-item :title="t('settings.settings')" name="Settings">
        <div class="quick-tools">
          <div class="preset-heading">{{ isFrench ? 'Profils rapides' : 'Quick presets' }}</div>
          <n-select v-model:value="selectedPreset" :options="presetOptions" @update:value="applyPreset" />
          <div class="action-row">
            <n-button secondary @click="resetSettings"><template #icon><n-icon><Reset /></n-icon></template>{{ isFrench ? 'Réinitialiser' : 'Reset settings' }}</n-button>
            <n-button type="primary" @click="randomizeSettings"><template #icon><n-icon><Shuffle /></n-icon></template>{{ isFrench ? 'Aléatoire' : 'Randomize' }}</n-button>
          </div>
        </div>
        <div class="customization-layout">
          <div class="customization-toggles">
            <div class="toggle-panel"><ColorspaceSetting v-model:colorspace="config.colorspace" /></div>
            <div class="toggle-panel"><BorderSetting v-model:border="config.border" /></div>
          </div>
          <div class="slider-panel">
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.rotate') }}</span><n-tag size="small" :bordered="false">{{ config.rotate.toFixed(1) }}°</n-tag></div><RotateSetting v-model:rotate="config.rotate" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.rotateVariance') }}</span><n-tag size="small" :bordered="false">±{{ config.rotate_var.toFixed(1) }}°</n-tag></div><RotateVarianceSetting v-model:rotate_var="config.rotate_var" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.brightness') }}</span><n-tag size="small" :bordered="false">{{ config.brightness.toFixed(2) }}</n-tag></div><BrightnessSetting v-model:brightness="config.brightness" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.yellowish') }}</span><n-tag size="small" :bordered="false">{{ config.yellowish.toFixed(2) }}</n-tag></div><YellowishSetting v-model:yellowish="config.yellowish" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.contrast') }}</span><n-tag size="small" :bordered="false">{{ config.contrast.toFixed(2) }}</n-tag></div><ContrastSetting v-model:contrast="config.contrast" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.blur') }}</span><n-tag size="small" :bordered="false">{{ config.blur.toFixed(2) }}</n-tag></div><BlurSetting v-model:blur="config.blur" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.noise') }}</span><n-tag size="small" :bordered="false">{{ config.noise.toFixed(2) }}</n-tag></div><NoiseSetting v-model:noise="config.noise" /></div>
            <div class="slider-setting"><div class="setting-value"><span>{{ t('settings.scale') }}</span><n-tag size="small" :bordered="false">{{ config.scale.toFixed(1) }}×</n-tag></div><ScaleSetting v-model:scale="config.scale" /></div>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NCard, NCollapse, NCollapseItem, NIcon, NSelect, NButton, NTag } from 'naive-ui'
import { AreaCustom, Reset, Shuffle } from '@vicons/carbon'
import { ChevronDown12Regular } from '@vicons/fluent'
import BorderSetting from './settings/BorderSetting.vue'
import RotateSetting from './settings/RotateSetting.vue'
import RotateVarianceSetting from './settings/RotateVarianceSetting.vue'
import ColorspaceSetting from './settings/ColorspaceSetting.vue'
import BlurSetting from './settings/BlurSetting.vue'
import NoiseSetting from './settings/NoiseSetting.vue'
import ScaleSetting from './settings/ScaleSetting.vue'
import BrightnessSetting from './settings/BrightnessSetting.vue'
import YellowishSetting from './settings/YellowishSetting.vue'
import ContrastSetting from './settings/ContrastSetting.vue'
import type { ScanConfig } from '@/utils/scan-renderer'
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'

const { t, locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
const props = defineProps<{ config: ScanConfig; defaultConfig: ScanConfig }>()
const emit = defineEmits<{ (e: 'update:config', config: ScanConfig): void }>()
const config = useVModel(props, 'config', emit)
const selectedPreset = ref<string | null>(null)
const presetOptions = computed(() => [
  { label: isFrench.value ? 'Scan propre' : 'Clean scan', value: 'clean' },
  { label: isFrench.value ? 'Photocopie' : 'Photocopy', value: 'copy' },
  { label: isFrench.value ? 'Document ancien' : 'Old document', value: 'old' },
  { label: isFrench.value ? 'Scan de mauvaise qualité' : 'Low-quality scan', value: 'rough' }
])
function applyPreset(value: string) {
  const common = { ...props.defaultConfig }
  if (value === 'clean') Object.assign(common, { rotate: 0.1, rotate_var: 0.1, colorspace: 'sRGB', blur: 0.05, noise: 0.02, border: false, brightness: 1.04, yellowish: 0, contrast: 1.05 })
  if (value === 'copy') Object.assign(common, { rotate: 0.5, rotate_var: 0.4, colorspace: 'gray', blur: 0.15, noise: 0.18, border: true, brightness: 1.03, yellowish: 0.03, contrast: 1.3 })
  if (value === 'old') Object.assign(common, { rotate: 1.2, rotate_var: 1.4, colorspace: 'sRGB', blur: 0.25, noise: 0.2, border: true, brightness: 0.96, yellowish: 0.55, contrast: 0.95 })
  if (value === 'rough') Object.assign(common, { rotate: 1.8, rotate_var: 3.2, colorspace: 'gray', blur: 0.65, noise: 0.55, border: true, brightness: 0.88, yellowish: 0.08, contrast: 1.35 })
  config.value = common
}
function resetSettings() {
  config.value = { ...props.defaultConfig }
  selectedPreset.value = null
}
function randomizeSettings() {
  const rand = (min: number, max: number) => min + Math.random() * (max - min)
  config.value = {
    ...config.value,
    rotate: Number(rand(-3, 3).toFixed(1)),
    rotate_var: Number(rand(0.2, 4).toFixed(1)),
    brightness: Number(rand(0.88, 1.12).toFixed(2)),
    yellowish: Number(rand(0, 0.35).toFixed(2)),
    contrast: Number(rand(0.85, 1.3).toFixed(2)),
    blur: Number(rand(0.05, 0.55).toFixed(2)),
    noise: Number(rand(0.03, 0.4).toFixed(2))
  }
  selectedPreset.value = null
}
</script>

<style scoped>
.customization-card { overflow: hidden; border-color: rgba(255, 212, 0, 0.18); }
.customization-layout { display:flex; flex-direction:column; gap:18px; }
.customization-toggles { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }
.toggle-panel { min-width:0; padding:12px 12px 4px; border:1px solid rgba(255,212,0,.16); border-radius:12px; background:rgba(255,212,0,.035); }
.toggle-panel :deep(.n-form-item) { margin-bottom:0; }
.slider-panel { display:flex; flex-direction:column; gap:5px; }
.slider-setting { padding:8px 0 4px; border-bottom:1px solid rgba(255,255,255,.055); }
.slider-setting:last-child { border-bottom:0; }
.slider-setting :deep(.n-form-item) { margin-bottom:0; }
.slider-setting :deep(.n-form-item-label) { padding-bottom:7px; font-weight:500; letter-spacing:.005em; }
.slider-setting :deep(.n-slider-rail__fill) { background-color:#ffd400 !important; }
.slider-setting :deep(.n-slider-handle) { border-color:#ffd400; }
.customization-icon { color:#ffd400; }
.setting-value { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:3px; font-weight:500; }
.setting-value :deep(.n-tag) { color:#ffd400; background:rgba(255,212,0,.1); font-variant-numeric:tabular-nums; }
.quick-tools { display:flex; flex-direction:column; gap:10px; padding:0 0 18px; }
.preset-heading { font-size:13px; font-weight:600; color:#ffd400; letter-spacing:.03em; text-transform:uppercase; }
.action-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (min-width:900px) { .customization-layout { gap:22px; } .slider-panel { gap:8px; } }
</style>

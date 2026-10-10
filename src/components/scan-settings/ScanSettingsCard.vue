<template>
  <n-card class="customization-card" :segmented="{ content: true, footer: 'soft' }">
    <n-collapse :default-expanded-names="['Settings']">
      <template #header-extra><n-icon><ChevronDown12Regular /></n-icon></template>
      <template #arrow><n-icon class="customization-icon"><AreaCustom /></n-icon></template>
      <n-collapse-item :title="t('settings.settings')" name="Settings">
        <div class="customization-layout">
          <div class="customization-toggles">
            <div class="toggle-panel">
              <ColorspaceSetting v-model:colorspace="config.colorspace" />
            </div>
            <div class="toggle-panel">
              <BorderSetting v-model:border="config.border" />
            </div>
          </div>

          <div class="slider-panel">
            <div class="slider-setting"><RotateSetting v-model:rotate="config.rotate" /></div>
            <div class="slider-setting"><RotateVarianceSetting v-model:rotate_var="config.rotate_var" /></div>
            <div class="slider-setting"><BrightnessSetting v-model:brightness="config.brightness" /></div>
            <div class="slider-setting"><YellowishSetting v-model:yellowish="config.yellowish" /></div>
            <div class="slider-setting"><ContrastSetting v-model:contrast="config.contrast" /></div>
            <div class="slider-setting"><BlurSetting v-model:blur="config.blur" /></div>
            <div class="slider-setting"><NoiseSetting v-model:noise="config.noise" /></div>
            <div class="slider-setting"><ScaleSetting v-model:scale="config.scale" /></div>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script lang="ts" setup>
import { NCard, NCollapse, NCollapseItem, NIcon } from 'naive-ui'
import { AreaCustom } from '@vicons/carbon'
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

const { t } = useI18n()
const props = defineProps<{ config: ScanConfig }>()
const emit = defineEmits<{ (e: 'update:config', config: ScanConfig): void }>()
const config = useVModel(props, 'config', emit)
</script>

<style scoped>
.customization-card {
  overflow: hidden;
  border-color: rgba(255, 212, 0, 0.18);
}
.customization-layout {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.customization-toggles {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.toggle-panel {
  min-width: 0;
  padding: 12px 12px 4px;
  border: 1px solid rgba(255, 212, 0, 0.16);
  border-radius: 12px;
  background: rgba(255, 212, 0, 0.035);
}
.toggle-panel :deep(.n-form-item) {
  margin-bottom: 0;
}
.slider-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.slider-setting {
  padding: 5px 0 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
}
.slider-setting:last-child {
  border-bottom: 0;
}
.slider-setting :deep(.n-form-item) {
  margin-bottom: 0;
}
.slider-setting :deep(.n-form-item-label) {
  padding-bottom: 7px;
  font-weight: 500;
  letter-spacing: 0.005em;
}
.slider-setting :deep(.n-slider-rail__fill) {
  background-color: #ffd400 !important;
}
.slider-setting :deep(.n-slider-handle) {
  border-color: #ffd400;
}
.customization-icon {
  color: #ffd400;
}
@media (min-width: 900px) {
  .customization-layout {
    gap: 22px;
  }
  .slider-panel {
    gap: 8px;
  }
}
</style>

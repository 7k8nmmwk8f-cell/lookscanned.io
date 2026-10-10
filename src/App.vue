<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-global-style />
    <n-message-provider>
      <main class="view"><RouterView :key="route.fullPath" /></main>
      <ServieWorkerReloadPrompt />
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import { RouterView, useRoute } from 'vue-router'
import ServieWorkerReloadPrompt from '@/components/Misc/ServiceWorkerReloadPrompt.vue'

const route = useRoute()
const themeOverrides = {
  common: {
    primaryColor: '#655cff',
    primaryColorHover: '#7b73ff',
    primaryColorPressed: '#5148e5',
    primaryColorSuppl: '#817aff',
    borderRadius: '10px'
  }
}
</script>

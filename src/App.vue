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
    primaryColor: '#ffd400',
    primaryColorHover: '#ffe04a',
    primaryColorPressed: '#d9b400',
    primaryColorSuppl: '#ffe45c',
    borderRadius: '10px',
    bodyColor: '#111111',
    cardColor: '#171717',
    modalColor: '#171717'
  }
}
</script>

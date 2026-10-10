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
    primaryColor: '#9b7bff',
    primaryColorHover: '#b8a4ff',
    primaryColorPressed: '#7851db',
    primaryColorSuppl: '#c7b7ff',
    borderRadius: '10px',
    bodyColor: '#101016',
    cardColor: '#191821',
    modalColor: '#191821'
  }
}
</script>

<template>
  <n-space vertical align="center" justify="center" height="100%" class="brand-hero">
    <div class="brand-lockup" aria-label="The Scanner">
      <svg class="brand-icon" viewBox="0 0 64 64" role="img" aria-label="The Scanner logo">
        <defs><linearGradient id="scanner-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7167ff"/><stop offset="1" stop-color="#4139d9"/></linearGradient></defs>
        <rect x="12" y="4" width="37" height="48" rx="7" fill="url(#scanner-gradient)"/>
        <path d="M37 4v13h12" fill="#bdb8ff"/>
        <path d="M20 24h20M20 31h20M20 38h14" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".95"/>
        <rect x="21" y="43" width="34" height="17" rx="4" fill="#e9e8ff" stroke="#5149e6" stroke-width="2"/>
        <path d="M27 49h22M27 54h16" stroke="#5149e6" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <n-h1>The Scanner</n-h1>
        <n-p class="brand-tagline">{{ isFrench ? 'Des PDF comme s’ils avaient été scannés' : 'Make PDFs look like they were scanned' }}</n-p>
      </div>
    </div>
    <n-p style="max-width: 568px; text-align:center">{{ isFrench ? 'Transforme tes PDF avec des textures papier, des effets de scan et plusieurs tampons ou signatures.' : 'Transform PDFs with paper textures, scan effects, and multiple stamps or signatures.' }}</n-p>
    <NavigateToScan />
    <n-grid :x-gap="20" :y-gap="0" :cols="2">
      <n-grid-item><NavigateToGitHub /></n-grid-item>
      <n-grid-item><NavigateToInBrowserApp /></n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import { NH1, NP, NSpace, NGrid, NGridItem } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NavigateToScan from '@/components/buttons/NavigateToScan.vue'
import NavigateToGitHub from '@/components/buttons/NavigateToGitHub.vue'
import NavigateToInBrowserApp from '@/components/buttons/NavigateToInBrowserApp.vue'
const { locale } = useI18n()
const isFrench = computed(() => locale.value.startsWith('fr'))
</script>

<style scoped>
.brand-lockup { display:flex; align-items:center; justify-content:center; gap:16px; }
.brand-icon { width:74px; height:74px; flex-shrink:0; filter:drop-shadow(0 8px 14px rgba(73,65,220,.16)); }
.brand-lockup :deep(h1) { margin:0; letter-spacing:-.045em; }
.brand-tagline { margin:3px 0 0; opacity:.72; }
</style>

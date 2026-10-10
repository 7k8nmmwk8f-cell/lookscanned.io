<template>
  <n-space vertical align="center" justify="center" height="100%" class="brand-hero">
    <div class="brand-lockup" aria-label="The Scanner">
      <svg class="brand-icon" viewBox="0 0 80 80" role="img" aria-label="The Scanner logo">
        <defs>
          <linearGradient id="scanner-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8174ff"/><stop offset="1" stop-color="#493ce0"/></linearGradient>
          <linearGradient id="scan-glow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c5baff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" /><stop offset="1" stop-color="#c5baff" stop-opacity="0"/></linearGradient>
          <filter id="scan-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
        </defs>
        <path d="M18 8h31l13 13v39a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7Z" fill="url(#scanner-gradient)" stroke="#9b91ff" stroke-opacity=".65"/>
        <path d="M49 8v13h13" fill="#d2ccff"/>
        <path d="M20 31h28M20 39h28M20 47h19" stroke="#f7f6ff" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 39h48" stroke="#bdb2ff" stroke-width="8" opacity=".55" filter="url(#scan-shadow)"/>
        <path d="M13 39h48" stroke="url(#scan-glow)" stroke-width="3" stroke-linecap="round"/>
        <g transform="translate(30 49)">
          <rect x="0" y="0" width="39" height="24" rx="6" fill="#e7e3ff" stroke="#5d50ef" stroke-width="2.5"/>
          <path d="M7 8h25M7 15h18" stroke="#5145df" stroke-width="2.5" stroke-linecap="round"/>
        </g>
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
.brand-icon { width:84px; height:84px; flex-shrink:0; filter:drop-shadow(0 8px 14px rgba(73,65,220,.16)); }
.brand-lockup :deep(h1) { margin:0; letter-spacing:-.045em; }
.brand-tagline { margin:3px 0 0; opacity:.72; }
</style>

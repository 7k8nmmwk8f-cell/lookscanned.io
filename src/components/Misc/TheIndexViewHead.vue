<template>
  <n-space vertical align="center" justify="center" height="100%" class="brand-hero">
    <div class="brand-lockup" aria-label="The Scanner">
      <svg class="brand-icon" viewBox="0 0 120 120" role="img" aria-label="The Scanner logo">
        <defs>
          <linearGradient id="glass-sheet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9c8aff" stop-opacity=".72"/><stop offset=".55" stop-color="#684cff" stop-opacity=".38"/><stop offset="1" stop-color="#3f2bc5" stop-opacity=".9"/></linearGradient>
          <linearGradient id="scan-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b69aff" stop-opacity="0"/><stop offset=".48" stop-color="#fff"/><stop offset=".58" stop-color="#eee7ff"/><stop offset="1" stop-color="#a58aff" stop-opacity="0"/></linearGradient>
          <filter id="beam-glow" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="3.5"/></filter>
        </defs>
        <path d="M23 34Q23 25 32 28L68 39Q75 41 75 51V91Q75 99 66 97L29 86Q23 84 23 76Z" fill="#4d36d4" fill-opacity=".72" stroke="#9478ff" stroke-width="2"/>
        <path d="M37 15Q37 7 46 10L83 21Q92 24 92 33V83Q92 93 82 90L47 80Q37 77 37 67Z" fill="url(#glass-sheet)" stroke="#b7a1ff" stroke-width="2.4"/>
        <path d="M74 18L91 34L76 30Q73 29 74 18Z" fill="#e4d9ff" fill-opacity=".9"/>
        <path d="M42 48L81 59M42 58L81 69M42 68L66 75" stroke="#fff" stroke-opacity=".62" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M12 62L104 81" stroke="#a48aff" stroke-opacity=".9" stroke-width="11" filter="url(#beam-glow)"/>
        <path d="M12 62L104 81" stroke="url(#scan-beam)" stroke-width="5" stroke-linecap="round"/>
        <path d="M47 76Q47 70 54 72L99 83Q106 85 106 92V103Q106 110 99 108L53 97Q47 95 47 89Z" fill="#d8ceff" stroke="#6047f5" stroke-width="3"/>
        <path d="M57 83L94 92M57 91L83 97" stroke="#6650ed" stroke-width="3" stroke-linecap="round"/>
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

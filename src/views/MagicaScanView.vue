<template>
  <MainContainer>
    <div style="margin-bottom: 25px"><BackToIndex /></div>
    <n-grid x-gap="25" y-gap="25" :cols="12" item-responsive responsive="screen">
      <n-grid-item span="12 s:5 m:4 l:3">
        <n-space vertical>
          <PDFUpload @update:pdf="pdf = $event" />
          <PDFInfo :pdf="pdf" v-if="pdf" />
          <SignatureStampList v-model="signatureOverlay" :num-pages="numPages" />
          <PaperBackgroundCard v-model="paperBackground" />
          <ScanSettingsCard v-model:config="config" :default-config="defaultConfig" />
          <SaveButtonCard @generate="generate" :progress="progress" :saving="saving" :pdf="scannedPDF" />
        </n-space>
      </n-grid-item>
      <n-grid-item span="12 s:7 m:8 l:9">
        <PreviewCompare :pdfRenderer="pdfRenderer" :scanRenderer="scanRenderer" :scale="config.scale" v-model:signature-overlay="signatureOverlay" :paper-background="paperBackground" />
      </n-grid-item>
    </n-grid>
  </MainContainer>
</template>

<script lang="ts" setup>
import { NGrid, NGridItem, NSpace, useMessage } from 'naive-ui'
import MainContainer from '@/components/MainContainer.vue'
import { type ScanConfig, defaultConfig, MagicaScanner } from '@/utils/scan-renderer/magica-scan'
import ScanSettingsCard from '@/components/scan-settings/ScanSettingsCard.vue'
import PDFUpload from '@/components/pdf-upload/PDFUpload.vue'
import { ref, computed, watch } from 'vue'
import PDFURL from '@/assets/examples/pdfs/test.pdf'
import BackToIndex from '@/components/buttons/BackToIndex.vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { PDF } from '@/utils/pdf-renderer/pdfjs'
import PreviewCompare from '@/components/page-preview/PreviewCompare.vue'
import SaveButtonCard from '@/components/save-button/SaveButtonCard.vue'
import { useSaveScannedPDF } from '@/composables/save-scanned-pdf'
import PDFInfo from '@/components/pdf-upload/PDFInfo.vue'
import SignatureStampList from '@/components/signature-stamp/SignatureStampList.vue'
import { defaultSignatureOverlays, type SignatureOverlay } from '@/utils/signature-overlay'
import PaperBackgroundCard from '@/components/paper-background/PaperBackgroundCard.vue'
import { type PaperBackgroundStyle } from '@/utils/paper-background'
import { ScanCacher } from '@/utils/scan-renderer/scan-cacher'

const { t } = useI18n()
const message = useMessage()
useHead({ title: 'The Scanner - ' + t('base.scanTitle'), meta: [{ name: 'description', content: 'Transforme tes PDF avec des textures papier, des effets de scan et plusieurs tampons ou signatures.' }] })
const pdf = ref<File | undefined>(undefined)
const signatureOverlay = ref<SignatureOverlay[]>(defaultSignatureOverlays())
const paperBackground = ref<PaperBackgroundStyle>('none')
const numPages = ref(1)
const initExamplePDF = async () => {
  const response = await fetch(PDFURL)
  const blob = await response.blob()
  const file = new File([blob], 'example.pdf')
  if (!pdf.value) pdf.value = file
}
initExamplePDF()
const config = ref<ScanConfig>(defaultConfig)
const pdfRenderer = computed(() => pdf.value ? new PDF(pdf.value) : undefined)
watch(pdfRenderer, async (renderer) => { numPages.value = renderer ? await renderer.getNumPages() : 1 }, { immediate: true })
const scanRenderer = ref(new ScanCacher(new MagicaScanner(config.value)))
watch(config, (newConfig) => { scanRenderer.value = new ScanCacher(new MagicaScanner(newConfig)) }, { deep: true })
const scale = computed(() => config.value.scale)
const { save, progress, saving, scannedPDF } = useSaveScannedPDF(pdf, pdfRenderer, scanRenderer, scale, signatureOverlay, paperBackground)
const generate = async () => {
  try { await save(); message.success(t('actions.generateSuccess')) }
  catch (e) { message.error(t('actions.generateError') + (e as Error).message) }
}
</script>

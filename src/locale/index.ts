import { createI18n } from 'vue-i18n'

import { en } from './en'
import { zhCN } from './zh-CN'
import { fr } from './fr'

const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en'
const currentLocale = browserLanguage.startsWith('fr') ? 'fr' : browserLanguage.startsWith('zh') ? 'zh' : 'en'

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

const i18n = createI18n({
  locale: currentLocale,
  fallbackLocale: 'en',
  legacy: false,
  messages: {
    en,
    zh: zhCN,
    fr
  } as { [key: string]: DeepPartial<typeof en> }
})

export default i18n

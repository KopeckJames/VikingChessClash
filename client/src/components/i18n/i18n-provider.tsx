/**
 * Internationalization provider component
 * Wraps the app with i18n context and handles language initialization
 */

import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { getDirection, isRTL } from '@/lib/i18n'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  React.useEffect(() => {
    // Initialize language from localStorage or browser preference
    const initializeLanguage = async () => {
      const savedLanguage = localStorage.getItem('preferred-language')
      const browserLanguage = navigator.language.split('-')[0]
      const supportedLanguages = ['en', 'es', 'ar']

      const initialLanguage =
        savedLanguage || (supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en')

      if (initialLanguage !== i18n.language) {
        await i18n.changeLanguage(initialLanguage)
      }

      // Set document attributes
      const direction = getDirection(initialLanguage)
      document.documentElement.dir = direction
      document.documentElement.lang = initialLanguage

      // Add RTL class if needed
      if (isRTL(initialLanguage)) {
        document.documentElement.classList.add('rtl')
      } else {
        document.documentElement.classList.remove('rtl')
      }
    }

    initializeLanguage()
  }, [])

  // Listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const direction = getDirection(lng)
      document.documentElement.dir = direction
      document.documentElement.lang = lng

      if (isRTL(lng)) {
        document.documentElement.classList.add('rtl')
      } else {
        document.documentElement.classList.remove('rtl')
      }

      localStorage.setItem('preferred-language', lng)
    }

    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

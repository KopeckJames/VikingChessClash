/**
 * Language selector component with RTL support
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Globe, ChevronDown } from 'lucide-react'
import { getSupportedLanguages, getLanguageName, getDirection, isRTL } from '@/lib/i18n'
import { announceToScreenReader } from '@/lib/accessibility'

interface LanguageSelectorProps {
  className?: string
  variant?: 'select' | 'buttons'
}

export function LanguageSelector({ className, variant = 'select' }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation()
  const supportedLanguages = getSupportedLanguages()

  const handleLanguageChange = (languageCode: string) => {
    const previousLanguage = i18n.language

    i18n
      .changeLanguage(languageCode)
      .then(() => {
        // Update document direction
        const direction = getDirection(languageCode)
        document.documentElement.dir = direction
        document.documentElement.lang = languageCode

        // Update CSS classes for RTL support
        if (isRTL(languageCode)) {
          document.documentElement.classList.add('rtl')
        } else {
          document.documentElement.classList.remove('rtl')
        }

        // Announce language change
        const languageName = getLanguageName(languageCode)
        announceToScreenReader(`Language changed to ${languageName}`)

        // Save to localStorage
        localStorage.setItem('preferred-language', languageCode)
      })
      .catch(error => {
        console.error('Failed to change language:', error)
        announceToScreenReader('Failed to change language')
      })
  }

  // Initialize language on mount
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    const browserLanguage = navigator.language.split('-')[0]
    const initialLanguage =
      savedLanguage || (supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en')

    if (initialLanguage !== i18n.language) {
      handleLanguageChange(initialLanguage)
    }
  }, [])

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {supportedLanguages.map(lang => (
          <Button
            key={lang}
            variant={i18n.language === lang ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLanguageChange(lang)}
            aria-pressed={i18n.language === lang}
            aria-label={`Switch to ${getLanguageName(lang)}`}
            className="min-w-[60px]"
          >
            {lang.toUpperCase()}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className={`w-[140px] ${className}`} aria-label="Select language">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map(lang => (
          <SelectItem key={lang} value={lang} className="flex items-center justify-between">
            <span>{getLanguageName(lang)}</span>
            {isRTL(lang) && <span className="text-xs text-muted-foreground ml-2">RTL</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Hook for using translations with accessibility announcements
export function useAccessibleTranslation() {
  const { t, i18n } = useTranslation()

  const announceTranslation = (key: string, options?: any) => {
    const text = t(key, options)
    announceToScreenReader(text)
    return text
  }

  return {
    t,
    i18n,
    announceTranslation,
    isRTL: isRTL(i18n.language),
    direction: getDirection(i18n.language),
  }
}

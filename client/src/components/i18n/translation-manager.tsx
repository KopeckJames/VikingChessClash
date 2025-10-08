/**
 * Translation management system
 * Provides tools for managing translations and adding new languages
 */

import * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Languages,
  Plus,
  Edit,
  Save,
  Download,
  Upload,
  Check,
  X,
  Globe,
  FileText,
} from 'lucide-react'
import { getSupportedLanguages, getLanguageName, isRTL } from '@/lib/i18n'

interface TranslationEntry {
  key: string
  value: string
  namespace?: string
}

interface MissingTranslation {
  key: string
  namespace: string
  fallbackValue: string
}

export function TranslationManager() {
  const { i18n, t } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const supportedLanguages = getSupportedLanguages()

  // Get all translations for current language
  const getTranslations = (language: string): TranslationEntry[] => {
    const store = i18n.getResourceBundle(language, 'translation') || {}
    const entries: TranslationEntry[] = []

    const flatten = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          flatten(obj[key], fullKey)
        } else {
          entries.push({
            key: fullKey,
            value: obj[key],
            namespace: 'translation',
          })
        }
      })
    }

    flatten(store)
    return entries.sort((a, b) => a.key.localeCompare(b.key))
  }

  // Find missing translations
  const getMissingTranslations = (targetLanguage: string): MissingTranslation[] => {
    const baseTranslations = getTranslations('en')
    const targetTranslations = getTranslations(targetLanguage)
    const targetKeys = new Set(targetTranslations.map(t => t.key))

    return baseTranslations
      .filter(t => !targetKeys.has(t.key))
      .map(t => ({
        key: t.key,
        namespace: 'translation',
        fallbackValue: t.value,
      }))
  }

  const translations = getTranslations(selectedLanguage)
  const filteredTranslations = translations.filter(
    t =>
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.value.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const missingTranslations =
    selectedLanguage !== 'en' ? getMissingTranslations(selectedLanguage) : []

  // Handle translation editing
  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key)
    setEditingValue(currentValue)
  }

  const handleSave = () => {
    if (editingKey) {
      // In a real implementation, this would save to a backend
      console.log(`Saving translation: ${editingKey} = ${editingValue}`)
      setEditingKey(null)
      setEditingValue('')
    }
  }

  const handleCancel = () => {
    setEditingKey(null)
    setEditingValue('')
  }

  // Handle adding new translation
  const handleAddTranslation = () => {
    if (newKey && newValue) {
      // In a real implementation, this would save to a backend
      console.log(`Adding translation: ${newKey} = ${newValue}`)
      setNewKey('')
      setNewValue('')
    }
  }

  // Export translations
  const handleExport = () => {
    const data = {
      language: selectedLanguage,
      translations: getTranslations(selectedLanguage),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translations-${selectedLanguage}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import translations
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string)
          console.log('Importing translations:', data)
          // In a real implementation, this would save to a backend
        } catch (error) {
          console.error('Failed to import translations:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Translation Management
        </CardTitle>
        <CardDescription>Manage translations and add support for new languages</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Language:</span>
          </div>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  <div className="flex items-center gap-2">
                    <span>{getLanguageName(lang)}</span>
                    {isRTL(lang) && <Badge variant="secondary">RTL</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label>
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="translations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="translations">
              Translations ({filteredTranslations.length})
            </TabsTrigger>
            <TabsTrigger value="missing">Missing ({missingTranslations.length})</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          {/* Existing Translations */}
          <TabsContent value="translations" className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search translations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTranslations.map(translation => (
                <div key={translation.key} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono text-muted-foreground mb-1">
                        {translation.key}
                      </div>
                      {editingKey === translation.key ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">{translation.value}</div>
                      )}
                    </div>
                    {editingKey !== translation.key && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(translation.key, translation.value)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Missing Translations */}
          <TabsContent value="missing" className="space-y-4">
            {missingTranslations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-8 h-8 mx-auto mb-2" />
                <p>All translations are complete for {getLanguageName(selectedLanguage)}!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {missingTranslations.map(missing => (
                  <div
                    key={missing.key}
                    className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20"
                  >
                    <div className="text-sm font-mono text-muted-foreground mb-1">
                      {missing.key}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Fallback: {missing.fallbackValue}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Enter translation..." className="flex-1" />
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add New Translation */}
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium mb-2 block">Translation Key</label>
                <Input
                  placeholder="e.g., game.actions.newMove"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Translation Value</label>
                <Textarea
                  placeholder="Enter the translated text..."
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button onClick={handleAddTranslation} disabled={!newKey || !newValue}>
                <Plus className="w-4 h-4 mr-2" />
                Add Translation
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{translations.length}</div>
            <div className="text-sm text-muted-foreground">Total Translations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{missingTranslations.length}</div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {translations.length > 0
                ? Math.round(
                    ((translations.length - missingTranslations.length) / translations.length) * 100
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{supportedLanguages.length}</div>
            <div className="text-sm text-muted-foreground">Languages</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Comprehensive accessibility control panel
 * Provides all accessibility settings in one place
 */

import * as React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/theme/theme-provider'
import {
  useVoiceControl,
  VoiceCommandHelp,
  createGameVoiceCommands,
} from '@/hooks/use-voice-control'
import { LanguageSelector, useAccessibleTranslation } from './language-selector'
import {
  Mic,
  MicOff,
  Eye,
  Type,
  Palette,
  Volume2,
  Vibrate,
  Keyboard,
  MousePointer,
  Accessibility,
  Settings,
  Info,
  Globe,
} from 'lucide-react'
import { announceToScreenReader } from '@/lib/accessibility'

interface AccessibilitySettings {
  // Visual
  fontSize: number
  highContrast: boolean
  reducedMotion: boolean

  // Audio
  soundEnabled: boolean
  voiceControlEnabled: boolean
  screenReaderOptimized: boolean

  // Motor
  largeButtons: boolean
  hapticFeedback: boolean
  gestureNavigation: boolean

  // Cognitive
  simplifiedUI: boolean
  autoSave: boolean
  confirmActions: boolean
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
  voiceControlEnabled: false,
  screenReaderOptimized: false,
  largeButtons: false,
  hapticFeedback: true,
  gestureNavigation: true,
  simplifiedUI: false,
  autoSave: true,
  confirmActions: false,
}

export function AccessibilityPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  })

  const [activeTab, setActiveTab] = useState<
    'visual' | 'audio' | 'motor' | 'cognitive' | 'language'
  >('visual')
  const { contrastMode, setContrastMode, motionPreference, setMotionPreference } = useTheme()
  const { t, announceTranslation, isRTL } = useAccessibleTranslation()

  // Voice control setup
  const voiceCommands = createGameVoiceCommands({
    showHelp: () => announceTranslation('accessibility.announcements.voiceActivated'),
    navigate: page => announceToScreenReader(`Navigating to ${page}`),
  })

  const {
    isSupported: voiceSupported,
    isListening,
    toggleListening,
  } = useVoiceControl(voiceCommands, {
    enabled: settings.voiceControlEnabled,
  })

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('accessibility-settings', JSON.stringify(updated))

    // Apply settings to document
    applySettings(updated)
  }

  // Apply settings to the document
  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement

    // Font size
    root.style.setProperty('--accessibility-font-scale', (settings.fontSize / 16).toString())

    // Large buttons
    if (settings.largeButtons) {
      root.classList.add('large-buttons')
    } else {
      root.classList.remove('large-buttons')
    }

    // Simplified UI
    if (settings.simplifiedUI) {
      root.classList.add('simplified-ui')
    } else {
      root.classList.remove('simplified-ui')
    }

    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized')
    } else {
      root.classList.remove('screen-reader-optimized')
    }
  }

  // Apply settings on mount
  React.useEffect(() => {
    applySettings(settings)
  }, [])

  const TabButton = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: typeof activeTab
    icon: React.ComponentType<{ className?: string }>
    label: string
  }) => (
    <Button
      variant={activeTab === tab ? 'default' : 'outline'}
      size="sm"
      onClick={() => setActiveTab(tab)}
      className="flex-1"
      aria-pressed={activeTab === tab}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          {t('accessibility.title')}
        </CardTitle>
        <CardDescription>{t('accessibility.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabButton tab="visual" icon={Eye} label={t('accessibility.visual.title')} />
          <TabButton tab="audio" icon={Volume2} label={t('accessibility.audio.title')} />
          <TabButton tab="motor" icon={MousePointer} label={t('accessibility.motor.title')} />
          <TabButton tab="cognitive" icon={Settings} label={t('accessibility.cognitive.title')} />
          <TabButton tab="language" icon={Globe} label="Language" />
        </div>

        <Separator />

        {/* Language Settings */}
        {activeTab === 'language' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Language & Region</h3>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Interface Language
              </label>
              <LanguageSelector variant="select" />
              <p className="text-xs text-muted-foreground">
                Choose your preferred language. RTL languages are supported.
              </p>
            </div>

            {/* RTL Information */}
            {isRTL && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Right-to-Left Layout Active</p>
                    <p className="text-xs text-muted-foreground">
                      The interface has been optimized for right-to-left reading direction.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visual Settings */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('accessibility.visual.title')}</h3>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Type className="w-4 h-4" />
                Font Size: {settings.fontSize}px
              </label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSettings({ fontSize: value })}
                min={12}
                max={24}
                step={1}
                className="w-full"
                aria-label="Font size"
              />
              <p className="text-xs text-muted-foreground">
                Adjust text size for better readability
              </p>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  High Contrast Mode
                </label>
                <p className="text-xs text-muted-foreground">
                  Increase color contrast for better visibility
                </p>
              </div>
              <Switch
                checked={contrastMode === 'high'}
                onCheckedChange={checked => {
                  setContrastMode(checked ? 'high' : 'normal')
                  updateSettings({ highContrast: checked })
                }}
                aria-label="Toggle high contrast mode"
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Reduced Motion</label>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                checked={motionPreference === 'reduced'}
                onCheckedChange={checked => {
                  setMotionPreference(checked ? 'reduced' : 'normal')
                  updateSettings({ reducedMotion: checked })
                }}
                aria-label="Toggle reduced motion"
              />
            </div>

            {/* Large Buttons */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Large Touch Targets</label>
                <p className="text-xs text-muted-foreground">
                  Increase button and link sizes for easier interaction
                </p>
              </div>
              <Switch
                checked={settings.largeButtons}
                onCheckedChange={checked => updateSettings({ largeButtons: checked })}
                aria-label="Toggle large buttons"
              />
            </div>
          </div>
        )}

        {/* Audio Settings */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Audio Accessibility</h3>

            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Sound Effects
                </label>
                <p className="text-xs text-muted-foreground">Enable audio feedback for actions</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={checked => updateSettings({ soundEnabled: checked })}
                aria-label="Toggle sound effects"
              />
            </div>

            {/* Voice Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    Voice Control
                    {!voiceSupported && <Badge variant="secondary">Not Supported</Badge>}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Control the game using voice commands
                  </p>
                </div>
                <Switch
                  checked={settings.voiceControlEnabled}
                  onCheckedChange={checked => updateSettings({ voiceControlEnabled: checked })}
                  disabled={!voiceSupported}
                  aria-label="Toggle voice control"
                />
              </div>

              {settings.voiceControlEnabled && voiceSupported && (
                <div className="pl-6 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleListening}
                    className="flex items-center gap-2"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                  </Button>
                  <VoiceCommandHelp commands={voiceCommands} />
                </div>
              )}
            </div>

            {/* Screen Reader Optimization */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Screen Reader Optimization</label>
                <p className="text-xs text-muted-foreground">
                  Optimize interface for screen readers
                </p>
              </div>
              <Switch
                checked={settings.screenReaderOptimized}
                onCheckedChange={checked => updateSettings({ screenReaderOptimized: checked })}
                aria-label="Toggle screen reader optimization"
              />
            </div>
          </div>
        )}

        {/* Motor Settings */}
        {activeTab === 'motor' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Motor Accessibility</h3>

            {/* Haptic Feedback */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Vibrate className="w-4 h-4" />
                  Haptic Feedback
                </label>
                <p className="text-xs text-muted-foreground">
                  Vibration feedback for touch interactions
                </p>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={checked => updateSettings({ hapticFeedback: checked })}
                aria-label="Toggle haptic feedback"
              />
            </div>

            {/* Gesture Navigation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Gesture Navigation</label>
                <p className="text-xs text-muted-foreground">Enable swipe and gesture controls</p>
              </div>
              <Switch
                checked={settings.gestureNavigation}
                onCheckedChange={checked => updateSettings({ gestureNavigation: checked })}
                aria-label="Toggle gesture navigation"
              />
            </div>

            {/* Keyboard Navigation Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <Keyboard className="w-4 h-4 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Keyboard Navigation</p>
                  <p className="text-xs text-muted-foreground">
                    Use Tab to navigate, Enter/Space to activate, Arrow keys for game board
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cognitive Settings */}
        {activeTab === 'cognitive' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cognitive Accessibility</h3>

            {/* Simplified UI */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Simplified Interface</label>
                <p className="text-xs text-muted-foreground">
                  Reduce visual complexity and distractions
                </p>
              </div>
              <Switch
                checked={settings.simplifiedUI}
                onCheckedChange={checked => updateSettings({ simplifiedUI: checked })}
                aria-label="Toggle simplified interface"
              />
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Auto Save</label>
                <p className="text-xs text-muted-foreground">Automatically save game progress</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={checked => updateSettings({ autoSave: checked })}
                aria-label="Toggle auto save"
              />
            </div>

            {/* Confirm Actions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Confirm Important Actions</label>
                <p className="text-xs text-muted-foreground">
                  Ask for confirmation before critical actions
                </p>
              </div>
              <Switch
                checked={settings.confirmActions}
                onCheckedChange={checked => updateSettings({ confirmActions: checked })}
                aria-label="Toggle action confirmation"
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Reset Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            Settings are saved automatically
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateSettings(defaultSettings)
              announceToScreenReader('Accessibility settings reset to defaults')
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

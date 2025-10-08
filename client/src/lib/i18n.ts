/**
 * Internationalization configuration
 * Supports multiple languages and RTL layouts
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Language resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        lobby: 'Lobby',
        leaderboard: 'Leaderboard',
        profile: 'Profile',
        settings: 'Settings',
        tournaments: 'Tournaments',
        learning: 'Learning',
      },

      // Game
      game: {
        title: 'Viking Chess',
        subtitle: 'Hnefatafl',
        currentPlayer: 'Current Player',
        attacker: 'Attacker',
        defender: 'Defender',
        king: 'King',
        status: {
          waiting: 'Waiting for opponent',
          active: 'Game in progress',
          completed: 'Game completed',
          abandoned: 'Game abandoned',
        },
        actions: {
          select: 'Select',
          move: 'Move',
          undo: 'Undo',
          resign: 'Resign',
          newGame: 'New Game',
        },
        pieces: {
          king: 'King',
          defender: 'Defender',
          attacker: 'Attacker',
        },
        board: {
          throne: 'Throne square',
          corner: 'Corner escape square',
          edge: 'Edge escape square',
          empty: 'Empty square',
          validMove: 'Valid move destination',
        },
      },

      // Accessibility
      accessibility: {
        title: 'Accessibility Settings',
        description: 'Customize the interface to meet your accessibility needs',
        visual: {
          title: 'Visual Accessibility',
          fontSize: 'Font Size',
          fontSizeDescription: 'Adjust text size for better readability',
          highContrast: 'High Contrast Mode',
          highContrastDescription: 'Increase color contrast for better visibility',
          reducedMotion: 'Reduced Motion',
          reducedMotionDescription: 'Minimize animations and transitions',
          largeButtons: 'Large Touch Targets',
          largeButtonsDescription: 'Increase button and link sizes for easier interaction',
        },
        audio: {
          title: 'Audio Accessibility',
          soundEffects: 'Sound Effects',
          soundEffectsDescription: 'Enable audio feedback for actions',
          voiceControl: 'Voice Control',
          voiceControlDescription: 'Control the game using voice commands',
          screenReader: 'Screen Reader Optimization',
          screenReaderDescription: 'Optimize interface for screen readers',
        },
        motor: {
          title: 'Motor Accessibility',
          hapticFeedback: 'Haptic Feedback',
          hapticFeedbackDescription: 'Vibration feedback for touch interactions',
          gestureNavigation: 'Gesture Navigation',
          gestureNavigationDescription: 'Enable swipe and gesture controls',
          keyboardNavigation: 'Keyboard Navigation',
          keyboardNavigationDescription:
            'Use Tab to navigate, Enter/Space to activate, Arrow keys for game board',
        },
        cognitive: {
          title: 'Cognitive Accessibility',
          simplifiedUI: 'Simplified Interface',
          simplifiedUIDescription: 'Reduce visual complexity and distractions',
          autoSave: 'Auto Save',
          autoSaveDescription: 'Automatically save game progress',
          confirmActions: 'Confirm Important Actions',
          confirmActionsDescription: 'Ask for confirmation before critical actions',
        },
        voiceCommands: {
          title: 'Available Voice Commands',
          help: 'Show available voice commands',
          showMoves: 'Show available moves for selected piece',
          undo: 'Undo last move',
          resign: 'Resign from current game',
          goHome: 'Navigate to home page',
          goLobby: 'Navigate to game lobby',
          goProfile: 'Navigate to user profile',
          showLeaderboard: 'Navigate to leaderboard',
        },
        announcements: {
          voiceActivated: 'Voice control activated. Listening for commands.',
          voiceDeactivated: 'Voice control deactivated.',
          commandNotRecognized: 'Command not recognized. Say "help" for available commands.',
          microphoneAccessDenied: 'Microphone access denied. Please enable microphone permissions.',
          voiceError: 'Voice recognition error occurred.',
          longPressDetected: 'Long press detected',
          doubleTapDetected: 'Double tap detected',
          swipedLeft: 'Swiped left',
          swipedRight: 'Swiped right',
          swipedUp: 'Swiped up',
          swipedDown: 'Swiped down',
          navigatedUp: 'Navigated up',
          navigatedDown: 'Navigated down',
          navigatedLeft: 'Navigated left',
          navigatedRight: 'Navigated right',
          focusRestored: 'Focus restored',
          focusedFirstElement: 'Focused on first interactive element',
          focusedLastElement: 'Focused on last interactive element',
          selectionCleared: 'Selection cleared',
          settingsReset: 'Accessibility settings reset to defaults',
          settingsSaved: 'Settings are saved automatically',
        },
      },

      // Common UI
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        reset: 'Reset',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        yes: 'Yes',
        no: 'No',
        on: 'On',
        off: 'Off',
        enabled: 'Enabled',
        disabled: 'Disabled',
        resetToDefaults: 'Reset to Defaults',
      },

      // Instructions
      instructions: {
        keyboard: 'Arrow keys to navigate, Enter/Space to select, Escape to clear',
        touch: 'Tap to select, double-tap for info, long press for details',
        voice: 'Say "select A1", "show moves", or "help" for commands',
      },
    },
  },

  es: {
    translation: {
      // Navigation
      nav: {
        home: 'Inicio',
        lobby: 'Sala',
        leaderboard: 'Clasificación',
        profile: 'Perfil',
        settings: 'Configuración',
        tournaments: 'Torneos',
        learning: 'Aprendizaje',
      },

      // Game
      game: {
        title: 'Ajedrez Vikingo',
        subtitle: 'Hnefatafl',
        currentPlayer: 'Jugador Actual',
        attacker: 'Atacante',
        defender: 'Defensor',
        king: 'Rey',
        status: {
          waiting: 'Esperando oponente',
          active: 'Juego en progreso',
          completed: 'Juego completado',
          abandoned: 'Juego abandonado',
        },
        actions: {
          select: 'Seleccionar',
          move: 'Mover',
          undo: 'Deshacer',
          resign: 'Rendirse',
          newGame: 'Nuevo Juego',
        },
        pieces: {
          king: 'Rey',
          defender: 'Defensor',
          attacker: 'Atacante',
        },
        board: {
          throne: 'Casilla del trono',
          corner: 'Casilla de escape de esquina',
          edge: 'Casilla de escape de borde',
          empty: 'Casilla vacía',
          validMove: 'Destino de movimiento válido',
        },
      },

      // Accessibility
      accessibility: {
        title: 'Configuración de Accesibilidad',
        description: 'Personaliza la interfaz para satisfacer tus necesidades de accesibilidad',
        visual: {
          title: 'Accesibilidad Visual',
          fontSize: 'Tamaño de Fuente',
          fontSizeDescription: 'Ajusta el tamaño del texto para mejor legibilidad',
          highContrast: 'Modo de Alto Contraste',
          highContrastDescription: 'Aumenta el contraste de color para mejor visibilidad',
          reducedMotion: 'Movimiento Reducido',
          reducedMotionDescription: 'Minimiza animaciones y transiciones',
          largeButtons: 'Objetivos Táctiles Grandes',
          largeButtonsDescription:
            'Aumenta el tamaño de botones y enlaces para interacción más fácil',
        },
        audio: {
          title: 'Accesibilidad Auditiva',
          soundEffects: 'Efectos de Sonido',
          soundEffectsDescription: 'Habilita retroalimentación de audio para acciones',
          voiceControl: 'Control por Voz',
          voiceControlDescription: 'Controla el juego usando comandos de voz',
          screenReader: 'Optimización para Lector de Pantalla',
          screenReaderDescription: 'Optimiza la interfaz para lectores de pantalla',
        },
        motor: {
          title: 'Accesibilidad Motora',
          hapticFeedback: 'Retroalimentación Háptica',
          hapticFeedbackDescription: 'Retroalimentación de vibración para interacciones táctiles',
          gestureNavigation: 'Navegación por Gestos',
          gestureNavigationDescription: 'Habilita controles de deslizamiento y gestos',
          keyboardNavigation: 'Navegación por Teclado',
          keyboardNavigationDescription:
            'Usa Tab para navegar, Enter/Espacio para activar, teclas de flecha para el tablero',
        },
        cognitive: {
          title: 'Accesibilidad Cognitiva',
          simplifiedUI: 'Interfaz Simplificada',
          simplifiedUIDescription: 'Reduce la complejidad visual y las distracciones',
          autoSave: 'Guardado Automático',
          autoSaveDescription: 'Guarda automáticamente el progreso del juego',
          confirmActions: 'Confirmar Acciones Importantes',
          confirmActionsDescription: 'Pide confirmación antes de acciones críticas',
        },
      },

      // Common UI
      common: {
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        ok: 'OK',
        cancel: 'Cancelar',
        save: 'Guardar',
        reset: 'Restablecer',
        close: 'Cerrar',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
        yes: 'Sí',
        no: 'No',
        on: 'Activado',
        off: 'Desactivado',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        resetToDefaults: 'Restablecer a Predeterminados',
      },
    },
  },

  ar: {
    translation: {
      // Navigation (RTL)
      nav: {
        home: 'الرئيسية',
        lobby: 'الردهة',
        leaderboard: 'لوحة المتصدرين',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        tournaments: 'البطولات',
        learning: 'التعلم',
      },

      // Game
      game: {
        title: 'شطرنج الفايكنغ',
        subtitle: 'هنيفاتافل',
        currentPlayer: 'اللاعب الحالي',
        attacker: 'المهاجم',
        defender: 'المدافع',
        king: 'الملك',
        status: {
          waiting: 'في انتظار الخصم',
          active: 'اللعبة قيد التقدم',
          completed: 'اللعبة مكتملة',
          abandoned: 'اللعبة متروكة',
        },
        actions: {
          select: 'اختيار',
          move: 'نقل',
          undo: 'تراجع',
          resign: 'استسلام',
          newGame: 'لعبة جديدة',
        },
        pieces: {
          king: 'ملك',
          defender: 'مدافع',
          attacker: 'مهاجم',
        },
        board: {
          throne: 'مربع العرش',
          corner: 'مربع هروب الزاوية',
          edge: 'مربع هروب الحافة',
          empty: 'مربع فارغ',
          validMove: 'وجهة حركة صالحة',
        },
      },

      // Accessibility
      accessibility: {
        title: 'إعدادات إمكانية الوصول',
        description: 'خصص الواجهة لتلبية احتياجات إمكانية الوصول الخاصة بك',
        visual: {
          title: 'إمكانية الوصول البصرية',
          fontSize: 'حجم الخط',
          fontSizeDescription: 'اضبط حجم النص لقراءة أفضل',
          highContrast: 'وضع التباين العالي',
          highContrastDescription: 'زيادة تباين الألوان لرؤية أفضل',
          reducedMotion: 'حركة مقللة',
          reducedMotionDescription: 'تقليل الرسوم المتحركة والانتقالات',
          largeButtons: 'أهداف لمس كبيرة',
          largeButtonsDescription: 'زيادة حجم الأزرار والروابط للتفاعل الأسهل',
        },
      },

      // Common UI
      common: {
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجح',
        warning: 'تحذير',
        info: 'معلومات',
        ok: 'موافق',
        cancel: 'إلغاء',
        save: 'حفظ',
        reset: 'إعادة تعيين',
        close: 'إغلاق',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        yes: 'نعم',
        no: 'لا',
        on: 'تشغيل',
        off: 'إيقاف',
        enabled: 'مفعل',
        disabled: 'معطل',
        resetToDefaults: 'إعادة تعيين إلى الافتراضي',
      },
    },
  },
}

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa']

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Namespace configuration
  defaultNS: 'translation',

  // Detection options
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },

  // React options
  react: {
    useSuspense: false,
  },
})

// Helper functions
export const isRTL = (language: string): boolean => {
  return rtlLanguages.includes(language)
}

export const getDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr'
}

export const getSupportedLanguages = () => {
  return Object.keys(resources)
}

export const getLanguageName = (code: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Español',
    ar: 'العربية',
  }
  return names[code] || code
}

export default i18n

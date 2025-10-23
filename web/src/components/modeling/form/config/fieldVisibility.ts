/**
 * Konfiguration für die Sichtbarkeit von Feldern basierend auf Komplexitätslevel
 * und Development-Status
 */

export type ComplexityLevel = 'basic' | 'advanced' | 'expert'

export interface FieldVisibilityConfig {
  /** Minimales Komplexitätslevel, ab dem das Feld sichtbar ist */
  minComplexity?: ComplexityLevel
  /** Nur in Development-Modus sichtbar */
  development?: boolean
  /** Callback für bedingte Sichtbarkeit */
  condition?: () => boolean
}

export interface VisibilityContext {
  /** Aktuelles Komplexitätslevel */
  complexity: ComplexityLevel
  /** Development-Modus aktiv */
  isDevelopment: boolean
}

const complexityRank: Record<ComplexityLevel, number> = {
  basic: 0,
  advanced: 1,
  expert: 2
}

/**
 * Prüft ob ein Feld basierend auf der Konfiguration sichtbar sein soll
 */
export function isFieldVisible(config: FieldVisibilityConfig | undefined, context: VisibilityContext): boolean {
  if (!config) return true

  // Development-Check
  if (config.development && !context.isDevelopment) {
    return false
  }

  // Complexity-Check
  if (config.minComplexity) {
    const requiredRank = complexityRank[config.minComplexity]
    const currentRank = complexityRank[context.complexity]
    if (currentRank < requiredRank) {
      return false
    }
  }

  // Custom Condition
  if (config.condition && !config.condition()) {
    return false
  }

  return true
}

/**
 * Erstellt eine Composable-Funktion für Visibility-Checks
 */
export function createVisibilityChecker(context: VisibilityContext) {
  return {
    isVisible: (config?: FieldVisibilityConfig) => isFieldVisible(config, context),
    isAtLeast: (level: ComplexityLevel) => complexityRank[context.complexity] >= complexityRank[level],
    isBasic: context.complexity === 'basic',
    isAdvanced: context.complexity === 'advanced',
    isExpert: context.complexity === 'expert',
    isDevelopment: context.isDevelopment
  }
}

export interface ComplexityLevelMeta {
  value: ComplexityLevel
  label: string
  description: string
  color: string
  icon: string
}

export const complexityLevels: ComplexityLevelMeta[] = [
  {
    value: 'basic',
    label: 'Standard',
    description: 'Nur häufig genutzte Einstellungen anzeigen.',
    color: 'primary',
    icon: 'mdi-tune-variant'
  },
  {
    value: 'advanced',
    label: 'Fortgeschritten',
    description: 'Erweiterte Optionen für Layout, Ports und Marker freischalten.',
    color: 'amber-darken-2',
    icon: 'mdi-rocket-launch-outline'
  },
  {
    value: 'expert',
    label: 'Experte',
    description: 'Alle verfügbaren Parameter, inklusive spezieller Routing- und Typografie-Optionen.',
    color: 'deep-purple-accent-4',
    icon: 'mdi-atom-variant'
  }
]

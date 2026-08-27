/**
 * Konfiguration für die Sichtbarkeit von Feldern basierend auf Komplexitätslevel
 */

export type ComplexityLevel = 'basic' | 'advanced' | 'expert' | 'dev'

export interface FieldVisibilityConfig {
  /** Minimales Komplexitätslevel, ab dem das Feld sichtbar ist */
  minComplexity?: ComplexityLevel
  /** Callback für bedingte Sichtbarkeit */
  condition?: () => boolean
}

export interface VisibilityContext {
  /** Aktuelles Komplexitätslevel */
  complexity: ComplexityLevel
}

const complexityRank: Record<ComplexityLevel, number> = {
  basic: 0,
  advanced: 1,
  expert: 2,
  dev: 3
}

/**
 * Prüft ob ein Feld basierend auf der Konfiguration sichtbar sein soll
 */
export function isFieldVisible(config: FieldVisibilityConfig | undefined, context: VisibilityContext): boolean {
  if (!config) return true

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
    isDev: context.complexity === 'dev'
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
    description: 'Show only frequently used settings.',
    color: 'success',
    icon: 'mdi-tune-variant'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Enable advanced options for layout, ports, and markers.',
    color: 'amber-darken-2',
    icon: 'mdi-rocket-launch-outline'
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Show every available parameter, including specialized routing and typography options.',
    color: 'deep-purple-accent-4',
    icon: 'mdi-atom-variant'
  },
  {
    value: 'dev',
    label: 'Development',
    description: 'Experimental features and options under development.',
    color: 'red',
    icon: 'mdi-flask-outline'
  }
]

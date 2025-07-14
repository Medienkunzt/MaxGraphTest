import { useDiagramLanguageStore } from '@/stores/diagramLanguage'

/**
 * Composable für die Arbeit mit Diagramsprachen
 */
export function useDiagramLanguages() {
  const store = useDiagramLanguageStore()

  return {
    // State
    languages: store.languages,
    currentLanguage: store.currentLanguage,

    // Actions
    createLanguage: store.createLanguage,
    updateLanguage: store.updateLanguage,
    deleteLanguage: store.deleteLanguage,
    setCurrentLanguage: store.setCurrentLanguage
  }
}

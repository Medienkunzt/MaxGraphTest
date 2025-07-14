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
    setCurrentLanguage: store.setCurrentLanguage,
    getLanguageById: store.getLanguageById,

    // Element actions
    addElementToLanguage: store.addElementToLanguage,
    updateElementInLanguage: store.updateElementInLanguage,
    removeElementFromLanguage: store.removeElementFromLanguage,

    // Connection actions
    addConnectionToLanguage: store.addConnectionToLanguage,
    updateConnectionInLanguage: store.updateConnectionInLanguage,
    removeConnectionFromLanguage: store.removeConnectionFromLanguage,

    // Syntax actions
    addSyntaxToLanguage: store.addSyntaxToLanguage,
    updateSyntaxInLanguage: store.updateSyntaxInLanguage,
    removeSyntaxFromLanguage: store.removeSyntaxFromLanguage,

    // Initialization
    initializeWithExampleData: store.initializeWithExampleData
  }
}

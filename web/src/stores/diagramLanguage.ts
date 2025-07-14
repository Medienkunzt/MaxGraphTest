import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramLanguage } from '@/types/DiagramLanguage'

export const useDiagramLanguageStore = defineStore('diagramLanguage', () => {
  // State
  const languages = ref<DiagramLanguage[]>([])
  const currentLanguage = ref<DiagramLanguage | null>(null)

  // Actions
  const createLanguage = (name: string, tags?: string[]): DiagramLanguage => {
    const newLanguage: DiagramLanguage = {
      id: generateId(),
      name,
      tags: tags || [],
      elements: [],
      connections: [],
      syntax: []
    }

    languages.value.push(newLanguage)
    return newLanguage
  }

  const updateLanguage = (id: string, updates: Partial<Pick<DiagramLanguage, 'name' | 'tags'>>) => {
    const index = languages.value.findIndex((lang) => lang.id === id)
    if (index !== -1) {
      languages.value[index] = {
        ...languages.value[index],
        ...updates
      }

      // Aktualisiere currentLanguage falls es das gleiche ist
      if (currentLanguage.value?.id === id) {
        currentLanguage.value = languages.value[index]
      }
    }
  }

  const deleteLanguage = (id: string) => {
    const index = languages.value.findIndex((lang) => lang.id === id)
    if (index !== -1) {
      languages.value.splice(index, 1)

      // Setze currentLanguage zurück falls gelöscht
      if (currentLanguage.value?.id === id) {
        currentLanguage.value = null
      }
    }
  }

  const setCurrentLanguage = (language: DiagramLanguage | null) => {
    currentLanguage.value = language
  }

  // Hilfsfunktion für ID-Generierung
  const generateId = (): string => {
    return 'id_' + Math.random().toString(36).substring(2, 9)
  }

  return {
    // State
    languages,
    currentLanguage,

    // Actions
    createLanguage,
    updateLanguage,
    deleteLanguage,
    setCurrentLanguage
  }
})

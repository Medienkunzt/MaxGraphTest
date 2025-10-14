import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HistoryEntry {
  timestamp: number
  description?: string
}

export const useDiagramStore = defineStore('diagram', () => {
  const history = ref<HistoryEntry[]>([])

  const saveHistory = (entry: Omit<HistoryEntry, 'timestamp'> = {}) => {
    history.value.push({ timestamp: Date.now(), ...entry })
  }

  const clearHistory = () => {
    history.value = []
  }

  return {
    history,
    saveHistory,
    clearHistory
  }
})

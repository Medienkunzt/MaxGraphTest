import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMe } from '@/services/authService'

export const useUserStore = defineStore('user', () => {
  const globalRole = ref<string | null>(null)
  const loaded = ref(false)

  // Fetches the token claims from the backend only once, then serves them from state
  const ensureGlobalRole = async () => {
    if (!loaded.value) {
      const claims = await fetchMe()
      globalRole.value = claims?.globalRole ?? null
      loaded.value = true
    }
    return globalRole.value
  }

  const reset = () => {
    globalRole.value = null
    loaded.value = false
  }

  return { globalRole, loaded, ensureGlobalRole, reset }
})

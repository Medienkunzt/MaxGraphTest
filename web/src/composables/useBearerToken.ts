import { ref } from 'vue'

const STORAGE_KEY = 'token'

const bearerToken = ref(localStorage.getItem(STORAGE_KEY) ?? '')

export const useBearerToken = () => {
  const persistToken = () => {
    localStorage.setItem(STORAGE_KEY, bearerToken.value)
  }

  const clearToken = () => {
    bearerToken.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return { bearerToken, persistToken, clearToken }
}

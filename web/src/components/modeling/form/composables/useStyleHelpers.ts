/**
 * Composable für häufig verwendete Style-Manipulations-Helfer
 */
import { type ComputedRef } from 'vue'

type SanitizeOptions = {
  min?: number
  max?: number
  allowNegative?: boolean
  allowFloat?: boolean
}

export function useStyleHelpers(style: ComputedRef<Record<string, any>>, emit: (event: 'update', ...args: any[]) => void) {
  const triggerUpdate = () => {
    emit('update')
  }

  const sanitizeNumber = (value: string | number | null | undefined, options: SanitizeOptions = {}): number | undefined => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return undefined
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) {
      return undefined
    }
    const allowNegative = options.allowNegative ?? true
    if (!allowNegative && parsed < 0) {
      return options.min ?? 0
    }
    let sanitized = parsed
    if (options.min !== undefined && sanitized < options.min) {
      sanitized = options.min
    }
    if (options.max !== undefined && sanitized > options.max) {
      sanitized = options.max
    }
    if (options.allowFloat === false) {
      sanitized = Math.round(sanitized)
    }
    return sanitized
  }

  const setStyleNumber = (key: string, value: string | number | null | undefined, options?: SanitizeOptions) => {
    const sanitized = sanitizeNumber(value, options)
    if (sanitized === undefined) {
      delete style.value[key]
    } else {
      style.value[key] = sanitized
    }
    triggerUpdate()
  }

  const setStyleAutoOrNumber = (key: string, value: string | number | null | undefined, options?: SanitizeOptions) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      delete style.value[key]
      triggerUpdate()
      return
    }
    if (typeof value === 'string' && value.trim().toLowerCase() === 'auto') {
      style.value[key] = 'auto'
      triggerUpdate()
      return
    }
    setStyleNumber(key, value, options)
  }

  const setOptionalString = (key: string, value: string | null | undefined) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (!normalized) {
      delete style.value[key]
    } else {
      style.value[key] = value
    }
    triggerUpdate()
  }

  const setTriState = (key: string, value: boolean | null | undefined) => {
    if (value === null || value === undefined) {
      style.value[key] = null
    } else {
      style.value[key] = value
    }
    triggerUpdate()
  }

  const clearStyleKeys = (...keys: string[]): boolean => {
    let changed = false
    keys.forEach((key) => {
      if (key in style.value) {
        delete style.value[key]
        changed = true
      }
    })
    return changed
  }

  return {
    sanitizeNumber,
    setStyleNumber,
    setStyleAutoOrNumber,
    setOptionalString,
    setTriState,
    clearStyleKeys,
    triggerUpdate
  }
}

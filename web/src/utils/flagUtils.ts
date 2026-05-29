/**
 * Wertet einen beliebigen Wert als boolesches Flag aus.
 * Behandelt `0`, `'0'`, `'false'` und leere Strings als `false`,
 * `null`/`undefined` ebenfalls. Alles andere gilt als `true`.
 */
export const isTruthyFlag = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  const normalized = value.toString().trim().toLowerCase()
  return normalized !== '' && normalized !== '0' && normalized !== 'false'
}

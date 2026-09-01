export function normalizeReportAliases(aliases = [], pending = '') {
  const result = []
  const seen = new Set()
  for (const value of [...aliases, pending]) {
    const alias = String(value || '').trim()
    const key = alias.toLocaleLowerCase()
    if (!alias || seen.has(key)) continue
    seen.add(key)
    result.push(alias)
  }
  return result
}

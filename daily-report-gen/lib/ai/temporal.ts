export type TemporalQuery = {
  dateFrom: Date | null
  dateTo: Date | null
  rawQuery: string
  temporalTerms: string[]
}

export function parseTemporalQuery(query: string): TemporalQuery {
  const now = new Date()
  const lowerQuery = query.toLowerCase()
  let dateFrom: Date | null = null
  let dateTo: Date | null = null
  const temporalTerms: string[] = []

  // --- Relative patterns ---
  const relativePatterns: [RegExp, (m: RegExpMatchArray) => [Date, Date]][] = [
    [/\b(today)\b/, () => {
      const d = new Date(now); d.setHours(0,0,0,0)
      return [d, now]
    }],
    [/\byesterday\b/, () => {
      const d = new Date(now); d.setDate(d.getDate()-1); d.setHours(0,0,0,0)
      const e = new Date(d); e.setHours(23,59,59,999)
      return [d, e]
    }],
    [/\blast\s+(\d+)\s+days?\b/, (m: RegExpMatchArray) => {
      const d = new Date(now); d.setDate(d.getDate() - parseInt(m[1]))
      return [d, now]
    }],
    [/\bpast\s+(\d+)\s+days?\b/, (m: RegExpMatchArray) => {
      const d = new Date(now); d.setDate(d.getDate() - parseInt(m[1]))
      return [d, now]
    }],
    [/\blast\s+week\b/, () => {
      const d = new Date(now); d.setDate(d.getDate()-7); return [d, now]
    }],
    [/\blast\s+month\b/, () => {
      const d = new Date(now); d.setMonth(d.getMonth()-1); return [d, now]
    }],
    [/\blast\s+(\d+)\s+months?\b/, (m: RegExpMatchArray) => {
      const d = new Date(now); d.setMonth(d.getMonth() - parseInt(m[1]))
      return [d, now]
    }],
    [/\blast\s+quarter\b/, () => {
      const d = new Date(now); d.setMonth(d.getMonth()-3); return [d, now]
    }],
    [/\bpast\s+quarter\b/, () => {
      const d = new Date(now); d.setMonth(d.getMonth()-3); return [d, now]
    }],
    [/\blast\s+year\b/, () => {
      const d = new Date(now); d.setFullYear(d.getFullYear()-1); return [d, now]
    }],
    [/\bthis\s+week\b/, () => {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay())
      d.setHours(0,0,0,0)
      return [d, now]
    }],
    [/\bthis\s+month\b/, () => {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return [d, now]
    }],
    [/\bthis\s+year\b|ytd\b/, () => {
      const d = new Date(now.getFullYear(), 0, 1)
      return [d, now]
    }],
    [/\bsince\s+(\d{4})\b/, (m: RegExpMatchArray) => {
      return [new Date(parseInt(m[1]), 0, 1), now]
    }],
  ]

  for (const [pattern, fn] of relativePatterns) {
    const match = lowerQuery.match(pattern)
    if (match) {
      const result = fn(match)
      ;[dateFrom, dateTo] = result
      temporalTerms.push(match[0])
      break
    }
  }

  // --- Quarter patterns (Q1 2024 etc.) ---
  if (!dateFrom) {
    const quarterMatch = lowerQuery.match(/\bq([1-4])\s*(\d{4})\b/)
    if (quarterMatch) {
      const q = parseInt(quarterMatch[1])
      const yr = parseInt(quarterMatch[2])
      const startMonth = (q - 1) * 3
      dateFrom = new Date(yr, startMonth, 1)
      dateTo = new Date(yr, startMonth + 3, 0)
      temporalTerms.push(quarterMatch[0])
    }
  }

  // --- Full year (2024) ---
  if (!dateFrom) {
    const yearMatch = lowerQuery.match(/\b(20\d{2})\b/)
    if (yearMatch) {
      const yr = parseInt(yearMatch[1])
      dateFrom = new Date(yr, 0, 1)
      dateTo = new Date(yr, 11, 31)
      temporalTerms.push(yearMatch[0])
    }
  }

  // Default: last 90 days
  if (!dateFrom) {
    dateFrom = new Date(now)
    dateFrom.setDate(dateFrom.getDate() - 90)
    dateTo = now
  }

  return { dateFrom, dateTo, rawQuery: query, temporalTerms }
}

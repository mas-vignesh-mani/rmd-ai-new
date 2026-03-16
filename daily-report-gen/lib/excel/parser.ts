import * as XLSX from 'xlsx'

export type ParsedSheet = {
  headers: string[]
  rows: Record<string, unknown>[]
}

export type ParsedExcelData = {
  daily?: ParsedSheet
  monthly?: ParsedSheet
  quarterly?: ParsedSheet
  sheets: Record<string, ParsedSheet>
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedExcelData {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets: Record<string, ParsedSheet> = {}

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

    if (jsonData.length < 2) continue

    const headers = (jsonData[0] as string[]).map(h => String(h ?? '').trim()).filter(Boolean)
    const rows = jsonData.slice(1).map(row => {
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => {
        obj[h] = (row as unknown[])[i] ?? ''
      })
      return obj
    }).filter(row => Object.values(row).some(v => v !== ''))

    sheets[sheetName] = { headers, rows }
  }

  // Auto-detect daily/monthly/quarterly sheets by name
  const result: ParsedExcelData = { sheets }
  for (const [name, sheet] of Object.entries(sheets)) {
    const lower = name.toLowerCase()
    if (lower.includes('daily') || lower.includes('day')) {
      result.daily = sheet
    } else if (lower.includes('monthly') || lower.includes('month')) {
      result.monthly = sheet
    } else if (lower.includes('quarterly') || lower.includes('quarter') || lower.includes('qtr')) {
      result.quarterly = sheet
    }
  }

  // Fallback: assign by sheet order if not detected by name
  const names = Object.keys(sheets)
  if (!result.daily && names[0]) result.daily = sheets[names[0]]
  if (!result.monthly && names[1]) result.monthly = sheets[names[1]]
  if (!result.quarterly && names[2]) result.quarterly = sheets[names[2]]

  return result
}

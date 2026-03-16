'use client'

import { useState, useRef } from 'react'
import { parseExcelBuffer, ParsedExcelData } from '@/lib/excel/parser'

type Props = {
  onClose: () => void
  onData: (data: ParsedExcelData) => void
}

export default function ExcelUploadModal({ onClose, onData }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }
    setError(null)
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    const data = parseExcelBuffer(buffer)
    onData(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Upload Market Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          {fileName ? (
            <p className="text-green-400">{fileName} loaded</p>
          ) : (
            <>
              <p className="text-gray-400">Drop Excel/CSV file here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
            </>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <p className="text-gray-500 text-xs mt-3">
          Supports daily, monthly, and quarterly data sheets. Sheet names containing
          &quot;daily&quot;, &quot;monthly&quot;, or &quot;quarterly&quot; will be auto-detected.
        </p>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            {fileName ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'

type UploadedFile = {
  fileName: string
  filePath: string
  status: 'uploading' | 'processing' | 'saved' | 'evaluated' | 'error'
  message?: string
  summary?: string
  usefulnessScore?: number
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    const entry: UploadedFile = {
      fileName: file.name,
      filePath: '',
      status: 'uploading',
    }
    setFiles(prev => [...prev, entry])

    try {
      // Step 1: get signed upload URL
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })
      if (!uploadRes.ok) throw new Error('Failed to get upload URL')
      const { signedUrl, path } = await uploadRes.json()

      // Step 2: upload to Supabase Storage
      const putRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Storage upload failed')

      // Update status to processing
      setFiles(prev =>
        prev.map(f =>
          f.fileName === file.name && f.status === 'uploading'
            ? { ...f, status: 'processing', filePath: path }
            : f
        )
      )

      // Step 3: process & embed file
      const processRes = await fetch('/api/process-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path, fileName: file.name, contentType: file.type }),
      })
      if (!processRes.ok) throw new Error('Processing failed')
      const result = await processRes.json()

      setFiles(prev =>
        prev.map(f =>
          f.filePath === path
            ? {
                ...f,
                status: result.status,
                message: result.message,
                summary: result.summary,
                usefulnessScore: result.usefulnessScore,
              }
            : f
        )
      )
    } catch (err) {
      setFiles(prev =>
        prev.map(f =>
          f.fileName === file.name && (f.status === 'uploading' || f.status === 'processing')
            ? { ...f, status: 'error', message: err instanceof Error ? err.message : 'Upload failed' }
            : f
        )
      )
    }
  }

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(processFile)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <p className="text-gray-400 text-lg">Drop files here or click to browse</p>
        <p className="text-gray-500 text-sm mt-1">Supports PDF, TXT, MD, CSV</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{f.fileName}</p>
                {f.message && <p className="text-xs text-gray-400 mt-0.5">{f.message}</p>}
                {f.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{f.summary}</p>}
              </div>
              <div className="flex-shrink-0">
                {f.status === 'uploading' && (
                  <span className="text-xs text-blue-400">Uploading...</span>
                )}
                {f.status === 'processing' && (
                  <span className="text-xs text-yellow-400">Processing...</span>
                )}
                {f.status === 'saved' && (
                  <span className="text-xs text-green-400">
                    Saved {f.usefulnessScore != null ? `(${(f.usefulnessScore * 100).toFixed(0)}%)` : ''}
                  </span>
                )}
                {f.status === 'evaluated' && (
                  <span className="text-xs text-gray-400">
                    Skipped {f.usefulnessScore != null ? `(${(f.usefulnessScore * 100).toFixed(0)}%)` : ''}
                  </span>
                )}
                {f.status === 'error' && (
                  <span className="text-xs text-red-400">Error</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

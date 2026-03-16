'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParsedExcelData } from '@/lib/excel/parser'
import ExcelUploadModal from './ExcelUploadModal'
import ReportDisplay from './ReportDisplay'

type Report = {
  report_id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  content: { markdown?: string } | null
}

export default function ReportGenerator() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [excelData, setExcelData] = useState<ParsedExcelData | null>(null)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pollingId, setPollingId] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/report')
    if (res.ok) {
      const data = await res.json()
      setReports(data)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Poll for in-progress report
  useEffect(() => {
    if (!pollingId) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/report?reportId=${pollingId}`)
      if (res.ok) {
        const report = await res.json()
        if (report.status === 'completed' || report.status === 'failed') {
          setPollingId(null)
          setGenerating(false)
          setSelectedReport(report)
          fetchReports()
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [pollingId, fetchReports])

  const handleGenerate = async () => {
    setGenerating(true)
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customPrompt: customPrompt || undefined,
        excelData: excelData ?? undefined,
      }),
    })
    if (res.ok) {
      const { reportId } = await res.json()
      setPollingId(reportId)
    } else {
      setGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Controls + History */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="text-white font-medium">Generate Report</h2>

          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Additional instructions (optional)..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />

          <button
            onClick={() => setShowExcelModal(true)}
            className={`w-full py-2 text-sm rounded-lg border transition ${
              excelData
                ? 'border-green-700 bg-green-900/30 text-green-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {excelData ? 'Market data loaded' : 'Attach Excel / CSV data'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report history */}
        {reports.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-3">Previous Reports</h3>
            <div className="space-y-1">
              {reports.map(r => (
                <button
                  key={r.report_id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedReport?.report_id === r.report_id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{r.title}</span>
                    <span className={`flex-shrink-0 ml-2 text-xs ${
                      r.status === 'completed' ? 'text-green-400' :
                      r.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Report display */}
      <div className="lg:col-span-2">
        {selectedReport ? (
          <ReportDisplay report={selectedReport} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-500">Generate a report to see it here</p>
          </div>
        )}
      </div>

      {showExcelModal && (
        <ExcelUploadModal
          onClose={() => setShowExcelModal(false)}
          onData={data => {
            setExcelData(data)
            setShowExcelModal(false)
          }}
        />
      )}
    </div>
  )
}

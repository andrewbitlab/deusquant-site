'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { Upload, FileSpreadsheet, FileText, CheckCircle, XCircle } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setMessage(null)

    try {
      // Determine file type
      const isBacktest = file.name.endsWith('.xlsx')
      const isForward = file.name.endsWith('.csv')

      if (!isBacktest && !isForward) {
        throw new Error('Invalid file type. Please upload .xlsx (backtest) or .csv (forward test) files.')
      }

      const endpoint = isBacktest ? '/api/upload/backtest' : '/api/upload/forward'

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload file
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setMessage({
        type: 'success',
        text: `Successfully uploaded ${file.name} to ${isBacktest ? 'backtest' : 'forward test'} directory`,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="border-b border-border-light bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo />
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-deus-gray mb-2">
            Upload Strategy Files
          </h1>
          <p className="text-text-secondary">
            Upload MT5 backtest reports (.xlsx) or forward test data (.csv) to the data directory
          </p>
        </div>

        {/* Upload Area */}
        <div className="card mb-8">
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-deus-gray bg-bg-tertiary'
                : 'border-border-default hover:border-deus-gray'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.csv"
              onChange={handleFileInput}
              disabled={uploading}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center">
                <Upload className="h-8 w-8 text-text-muted" />
              </div>

              <div>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer font-medium text-deus-gray hover:underline"
                >
                  Click to upload
                </label>
                <span className="text-text-secondary"> or drag and drop</span>
              </div>

              <p className="text-sm text-text-muted">
                Supported formats: .xlsx (backtest), .csv (forward test)
              </p>

              {uploading && (
                <div className="mt-4">
                  <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-deus-gray animate-pulse" style={{ width: '100%' }} />
                  </div>
                  <p className="text-sm text-text-secondary mt-2">Uploading...</p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-start gap-3 mb-3">
              <FileSpreadsheet className="h-6 w-6 text-deus-gray flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-deus-gray mb-1">
                  Backtest Reports
                </h3>
                <p className="text-sm text-text-secondary">
                  MT5 Excel export files (.xlsx) containing strategy backtest results
                </p>
              </div>
            </div>
            <ul className="space-y-1 text-sm text-text-secondary ml-9">
              <li>• File format: .xlsx</li>
              <li>• Contains: Performance metrics, transactions, equity curve</li>
              <li>• Saved to: data/backtest/</li>
            </ul>
          </div>

          <div className="card">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-6 w-6 text-deus-gray flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-deus-gray mb-1">
                  Forward Tests
                </h3>
                <p className="text-sm text-text-secondary">
                  CSV files with real trading results from live or demo accounts
                </p>
              </div>
            </div>
            <ul className="space-y-1 text-sm text-text-secondary ml-9">
              <li>• File format: .csv</li>
              <li>• Contains: Order history, P&L, timestamps</li>
              <li>• Saved to: data/forward/</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-display font-semibold text-blue-900 mb-2">
            Next Steps
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Upload your backtest and/or forward test files using the form above</li>
            <li>Return to the dashboard and click the "Refresh" button</li>
            <li>View your updated portfolio with the new strategy data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

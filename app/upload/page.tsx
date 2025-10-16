'use client'

import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { FileUploader } from '@/components/upload/FileUploader'
import { FileSpreadsheet, Image, FileText } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()

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
            Upload all files for a new strategy - xlsx goes to data/backtest/, html and images to data/backtest/html/
          </p>
        </div>

        {/* Upload Component */}
        <div className="card mb-8">
          <FileUploader />
        </div>

        {/* Example */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-display font-semibold text-blue-900 mb-3">
            Example: Upload Strategy 77702
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Drop all these files at once:
          </p>
          <div className="bg-white rounded p-3 font-mono text-xs text-blue-900 space-y-1">
            <div>77702.xlsx</div>
            <div>77702.html</div>
            <div>77702.png</div>
            <div>77702-holding.png</div>
            <div>77702-hst.png</div>
            <div>77702-mafe.png</div>
            <div>77702-mfemae.png</div>
          </div>
          <p className="text-sm text-blue-800 mt-3">
            The system will automatically route each file to its correct location and update the dashboard.
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-display font-semibold text-green-900 mb-2">
            After Upload
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
            <li>Files are automatically sorted to data/backtest/ and data/backtest/html/</li>
            <li>Strategy name is saved to data/names.json (if provided)</li>
            <li>Refresh the dashboard to see your new strategy</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

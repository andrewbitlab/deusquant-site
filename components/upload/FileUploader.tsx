'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileSpreadsheet, Image, FileText, Table } from 'lucide-react'

export function FileUploader() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [strategyName, setStrategyName] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    setFiles((prev) => [...prev, ...acceptedFiles])
    setMessage('')
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Please select files to upload')
      return
    }

    // Extract magic number from xlsx file
    const xlsxFile = files.find((f) => f.name.endsWith('.xlsx'))
    if (!xlsxFile) {
      setMessage('Error: No .xlsx file found. Please include backtest file.')
      return
    }

    const magicNumber = xlsxFile.name.replace('.xlsx', '')

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()

      // Add all files
      files.forEach((file) => {
        formData.append('files', file)
      })

      // Add strategy name and magic number
      formData.append('strategyName', strategyName || `Strategy ${magicNumber}`)
      formData.append('magicNumber', magicNumber)

      const response = await fetch('/api/upload/strategy', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Success: Strategy ${magicNumber} uploaded with ${data.filesUploaded} files`)
        setFiles([])
        setStrategyName('')
        // Redirect to dashboard after successful upload
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/html': ['.html'],
      'image/png': ['.png'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  })

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.xlsx')) return <FileSpreadsheet className="h-5 w-5" />
    if (filename.endsWith('.html')) return <FileText className="h-5 w-5" />
    if (filename.endsWith('.png')) return <Image className="h-5 w-5" />
    if (filename.endsWith('.csv')) return <Table className="h-5 w-5" />
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Strategy Name Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Strategy Name (Optional)
        </label>
        <input
          type="text"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          placeholder="e.g., Turtle BTC H8"
          className="w-full px-4 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-deus-gray"
          disabled={uploading}
        />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? 'border-deus-gray bg-bg-secondary'
              : 'border-border-default hover:border-deus-gray hover:bg-bg-tertiary'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-text-muted mb-3" />
        {uploading ? (
          <p className="text-text-secondary">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-deus-gray font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-text-primary font-medium mb-2">
              Drop strategy files here
            </p>
            <p className="text-sm text-text-muted">
              .xlsx (backtest) + .html + .png + .csv (forward tests)
            </p>
          </>
        )}
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-primary">
            Files to upload ({files.length})
          </h3>
          <div className="space-y-1">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-text-muted">{getFileIcon(file.name)}</div>
                  <span className="text-sm text-text-primary">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-text-muted hover:text-text-primary"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 bg-deus-gray text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Strategy'}
        </button>
      )}

      {/* Message */}
      {message && (
        <p className={`text-sm text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

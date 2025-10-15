'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

export function FileUploader() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', acceptedFiles[0])

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Success: ${data.filename} uploaded`)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'text/csv': ['.csv'],
    },
    multiple: false,
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? 'border-deus-gray bg-bg-secondary'
              : 'border-border-default hover:border-deus-gray hover:bg-bg-tertiary'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-text-muted mb-4" />
        {uploading ? (
          <p className="text-text-secondary">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-deus-gray font-medium">Drop file here...</p>
        ) : (
          <>
            <p className="text-text-primary font-medium mb-2">
              Drop MT5 backtest file here
            </p>
            <p className="text-sm text-text-muted">
              or click to select file (.xlsx or .csv)
            </p>
          </>
        )}
      </div>
      {message && (
        <p className="mt-4 text-sm text-center text-text-secondary">{message}</p>
      )}
    </div>
  )
}

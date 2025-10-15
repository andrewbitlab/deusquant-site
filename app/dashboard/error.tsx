'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-display font-bold text-deus-gray mb-4">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-deus-gray text-white rounded-md hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

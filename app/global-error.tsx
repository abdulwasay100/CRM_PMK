'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Application Error</h1>
            <p className="text-muted-foreground mb-4">
              Something went wrong with the application. Please refresh the page.
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

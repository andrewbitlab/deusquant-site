import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Security: only allow PNG files and prevent directory traversal
    if (!filename.endsWith('.png') || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    // Read image file from backtest HTML directory
    const filePath = join(process.cwd(), 'data', 'backtest', 'html', filename)
    const imageBuffer = readFileSync(filePath)

    // Return image with proper content type
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error(`Failed to load image ${params.filename}:`, error)
    return new NextResponse('Image not found', { status: 404 })
  }
}

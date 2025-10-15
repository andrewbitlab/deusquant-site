import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File upload handling will be implemented when integrating with parser
    // For now, return success with file info
    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      type: file.type,
      message: 'Upload endpoint ready - parser integration pending',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

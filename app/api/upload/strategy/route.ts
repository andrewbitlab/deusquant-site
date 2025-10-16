import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const strategyName = formData.get('strategyName') as string
    const magicNumber = formData.get('magicNumber') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!magicNumber) {
      return NextResponse.json({ error: 'Magic number not provided' }, { status: 400 })
    }

    const projectRoot = process.cwd()
    let filesUploaded = 0

    // Ensure directories exist
    const backtestDir = join(projectRoot, 'data', 'backtest')
    const htmlDir = join(projectRoot, 'data', 'backtest', 'html')
    const forwardDir = join(projectRoot, 'data', 'forward')

    if (!existsSync(backtestDir)) {
      await mkdir(backtestDir, { recursive: true })
    }

    if (!existsSync(htmlDir)) {
      await mkdir(htmlDir, { recursive: true })
    }

    if (!existsSync(forwardDir)) {
      await mkdir(forwardDir, { recursive: true })
    }

    // Check if there's a CSV file in the upload - if yes, delete old CSV files
    const hasCsvFile = files.some((f) => f.name.endsWith('.csv'))
    if (hasCsvFile) {
      try {
        const existingFiles = await readdir(forwardDir)
        const existingCsvFiles = existingFiles.filter((f) => f.endsWith('.csv'))

        for (const oldCsv of existingCsvFiles) {
          const oldCsvPath = join(forwardDir, oldCsv)
          await unlink(oldCsvPath)
          console.log(`Deleted old forward test CSV: ${oldCsv}`)
        }
      } catch (error) {
        console.warn('Failed to delete old CSV files:', error)
      }
    }

    // Process each file
    for (const file of files) {
      const filename = file.name
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      let targetPath: string

      // Route files to appropriate directories
      if (filename.endsWith('.xlsx')) {
        // Backtest file goes to data/backtest/
        targetPath = join(backtestDir, filename)
      } else if (filename.endsWith('.html') || filename.endsWith('.png')) {
        // HTML and images go to data/backtest/html/
        targetPath = join(htmlDir, filename)
      } else if (filename.endsWith('.csv')) {
        // CSV forward test goes to data/forward/
        targetPath = join(forwardDir, filename)
      } else {
        // Skip unknown file types
        continue
      }

      await writeFile(targetPath, buffer)
      filesUploaded++
    }

    // Update names.json with strategy name
    if (strategyName && strategyName !== `Strategy ${magicNumber}`) {
      const namesPath = join(projectRoot, 'data', 'names.json')
      let names: Record<string, string> = {}

      // Read existing names
      if (existsSync(namesPath)) {
        const namesContent = await readFile(namesPath, 'utf-8')
        names = JSON.parse(namesContent)
      }

      // Update with new strategy name
      names[magicNumber] = strategyName

      // Write back
      await writeFile(namesPath, JSON.stringify(names, null, 2))
    }

    return NextResponse.json({
      success: true,
      filesUploaded,
      magicNumber,
      strategyName,
      message: `Strategy ${magicNumber} uploaded successfully`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

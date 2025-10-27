#!/usr/bin/env node
import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const imagesDir = join(process.cwd(), 'public/images')
const brandDir = join(process.cwd(), 'public/brand')

async function optimizeImages(dir) {
  const files = await readdir(dir)

  for (const file of files) {
    if (!file.match(/\.(png|jpg|jpeg)$/i)) continue

    const inputPath = join(dir, file)
    const outputPath = join(dir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'))

    try {
      // Convert to WebP
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath)

      console.log(`✓ Converted ${file} to WebP`)
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error.message)
    }
  }
}

console.log('Optimizing images...')
await optimizeImages(imagesDir)
await optimizeImages(brandDir)
console.log('Done!')

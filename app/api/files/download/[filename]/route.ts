import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'

const UPLOAD_DIR = './uploads'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Check if file exists in database
    const fileRecord = await prisma.file.findFirst({
      where: { filename }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const filepath = path.join(UPLOAD_DIR, filename)

    // Check if file exists on disk
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filepath)

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', fileRecord.mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set('Content-Disposition', `inline; filename="${fileRecord.originalName}"`)
    
    // Add cache headers for images
    if (fileRecord.mimeType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=31536000') // 1 year
    }

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'File download failed' }, { status: 500 })
  }
}

// Also handle thumbnail requests
export async function HEAD(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Validate filename
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse(null, { status: 400 })
    }

    // Check if file exists in database
    const fileRecord = await prisma.file.findFirst({
      where: { filename }
    })

    if (!fileRecord) {
      return new NextResponse(null, { status: 404 })
    }

    const filepath = path.join(UPLOAD_DIR, filename)

    // Check if file exists on disk
    if (!existsSync(filepath)) {
      return new NextResponse(null, { status: 404 })
    }

    // Return headers only
    const headers = new Headers()
    headers.set('Content-Type', fileRecord.mimeType)
    headers.set('Content-Length', fileRecord.size.toString())
    
    return new NextResponse(null, { headers })
  } catch (error) {
    console.error('File HEAD error:', error)
    return new NextResponse(null, { status: 500 })
  }
} 
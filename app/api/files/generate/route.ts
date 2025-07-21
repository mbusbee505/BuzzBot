import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/db'

const UPLOAD_DIR = './uploads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, filename, fileType } = body

    if (!content || !filename) {
      return NextResponse.json({ error: 'Content and filename are required' }, { status: 400 })
    }

    // Determine file extension and MIME type based on fileType
    let extension = '.txt'
    let mimeType = 'text/plain'

    switch (fileType) {
      case 'markdown':
        extension = '.md'
        mimeType = 'text/markdown'
        break
      case 'javascript':
        extension = '.js'
        mimeType = 'text/javascript'
        break
      case 'typescript':
        extension = '.ts'
        mimeType = 'text/typescript'
        break
      case 'python':
        extension = '.py'
        mimeType = 'text/x-python'
        break
      case 'json':
        extension = '.json'
        mimeType = 'application/json'
        break
      case 'csv':
        extension = '.csv'
        mimeType = 'text/csv'
        break
      case 'html':
        extension = '.html'
        mimeType = 'text/html'
        break
      case 'css':
        extension = '.css'
        mimeType = 'text/css'
        break
      default:
        extension = '.txt'
        mimeType = 'text/plain'
    }

    // Generate unique filename
    const uniqueId = uuidv4()
    const generatedFilename = `${uniqueId}_${filename}${extension}`
    const filepath = path.join(UPLOAD_DIR, generatedFilename)

    // Write content to file
    await writeFile(filepath, content, 'utf-8')

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: generatedFilename,
        originalName: `${filename}${extension}`,
        mimeType,
        size: Buffer.byteLength(content, 'utf-8'),
        path: filepath,
        url: `/api/files/download/${generatedFilename}`,
        content: content // Store content for searchability
      }
    })

    // Return file information
    return NextResponse.json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      url: fileRecord.url,
      downloadUrl: `/api/files/download/${generatedFilename}`
    })
  } catch (error) {
    console.error('File generation error:', error)
    return NextResponse.json({ error: 'File generation failed' }, { status: 500 })
  }
} 
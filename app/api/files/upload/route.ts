import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { prisma } from '@/lib/db'

const UPLOAD_DIR = './uploads'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name)
      const uniqueId = uuidv4()
      const filename = `${uniqueId}${fileExtension}`
      const filepath = path.join(UPLOAD_DIR, filename)

      // Save file to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Process file based on type
      let extractedContent = null
      let processedFile = null

      try {
        if (file.type.startsWith('image/')) {
          // Process image
          processedFile = await processImage(buffer, filepath)
          extractedContent = `Image: ${file.name} (${file.type})`
        } else if (file.type === 'application/pdf') {
          // Extract text from PDF
          const pdfData = await pdfParse(buffer)
          extractedContent = pdfData.text
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Extract text from DOCX
          const result = await mammoth.extractRawText({ buffer })
          extractedContent = result.value
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
          // Extract text content
          extractedContent = buffer.toString('utf-8')
        }
      } catch (error) {
        console.warn(`Failed to process file ${file.name}:`, error)
      }

      // Save file metadata to database
      const fileRecord = await prisma.file.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: filepath,
          url: `/api/files/download/${filename}`,
          content: extractedContent
        }
      })

      uploadedFiles.push({
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        url: fileRecord.url,
        hasContent: !!extractedContent
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }
}

async function processImage(buffer: Buffer, filepath: string) {
  try {
    // Create thumbnail
    const thumbnailPath = filepath.replace(/(\.[^.]+)$/, '_thumb$1')
    
    await sharp(buffer)
      .resize(300, 300, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    return {
      original: filepath,
      thumbnail: thumbnailPath
    }
  } catch (error) {
    console.error('Image processing error:', error)
    return null
  }
} 
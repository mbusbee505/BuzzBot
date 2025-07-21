import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {

    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            files: {
              include: {
                file: true
              }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transform messages to include file information
    const transformedChats = chats.map(chat => ({
      ...chat,
      messages: chat.messages.map(message => ({
        ...message,
        files: message.files.map(mf => ({
          id: mf.file.id,
          filename: mf.file.filename,
          mimeType: mf.file.mimeType,
          url: mf.file.url
        }))
      }))
    }))

    return NextResponse.json(transformedChats)
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()
    const { model = 'gpt-4', title = 'New Chat' } = body

    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        model,
        title,
        messages: {
          create: []
        }
      },
      include: {
        messages: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) 
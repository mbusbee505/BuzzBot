import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, validateUserOwnership } from '@/lib/auth-middleware'

export const GET = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { chatId: string }, user: any }
) => {
  try {
    const chatId = params.chatId

    // SECURITY: Verify chat ownership - prevents access to other users' data
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id // Only find chats that belong to the authenticated user
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        files: {
          include: {
            file: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Transform messages to include file information
    const transformedMessages = messages.map(message => ({
      ...message,
      files: message.files.map(mf => ({
        id: mf.file.id,
        filename: mf.file.filename,
        mimeType: mf.file.mimeType,
        url: mf.file.url
      }))
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { chatId: string }, user: any }
) => {
  try {
    const chatId = params.chatId
    const body = await request.json()
    const { content, role, model, files } = body

    // SECURITY: Verify chat ownership - prevents creating messages in other users' chats
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id // Only find chats that belong to the authenticated user
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        role,
        model,
        chatId,
        files: files && files.length > 0 ? {
          create: files.map((file: any) => ({
            file: {
              connect: { id: file.id }
            }
          }))
        } : undefined
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    })

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    // Transform message to include file information
    const transformedMessage = {
      ...message,
      files: message.files.map(mf => ({
        id: mf.file.id,
        filename: mf.file.filename,
        mimeType: mf.file.mimeType,
        url: mf.file.url
      }))
    }

    return NextResponse.json(transformedMessage)
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) 
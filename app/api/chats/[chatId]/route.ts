import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth-middleware'

export const PATCH = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { chatId: string }, user: any }
) => {
  try {
    const chatId = params.chatId
    const body = await request.json()
    const { title } = body

    // SECURITY: Verify chat ownership - prevents access to other users' data
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id // Only find chats that belong to the authenticated user
      }
    })

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        title,
        updatedAt: new Date()
      },
      include: {
        messages: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json(updatedChat)
  } catch (error) {
    console.error('Failed to update chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { chatId: string }, user: any }
) => {
  try {
    const chatId = params.chatId

    // SECURITY: Verify chat ownership - prevents access to other users' data
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id // Only find chats that belong to the authenticated user
      }
    })

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    await prisma.chat.delete({
      where: { id: chatId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) 
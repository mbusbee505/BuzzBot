import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name?: string
    image?: string
  }
}

/**
 * Middleware to authenticate API requests and extract user information
 * CRITICAL: This ensures complete user isolation and prevents data leaks
 */
export async function requireAuth(request: NextRequest) {
  try {
    // Extract session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    // Look up session in database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      }
    })

    if (!session || !session.user || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired. Please sign in again.' },
        { status: 401 }
      )
    }

    // Return the authenticated user data
    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
      }
    }
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 401 }
    )
  }
}

/**
 * Wrapper function to create authenticated API route handlers
 * Usage: export const GET = withAuth(async (request, { user }) => { ... })
 */
export function withAuth<T = any>(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedRequest['user'] } & T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      // Auth failed, return error response
      return authResult
    }
    
    // Auth succeeded, call the handler with user data
    return handler(request, { ...context, user: authResult.user })
  }
}

/**
 * Utility to validate that a resource belongs to the authenticated user
 * SECURITY: Prevents access to other users' data
 */
export function validateUserOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    throw new Error('Access denied: Resource does not belong to the authenticated user')
  }
} 
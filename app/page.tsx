import { ChatInterface } from '@/components/chat/chat-interface'
import { AuthGuard } from '@/components/auth/auth-guard'

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen bg-white dark:bg-gray-900 overflow-hidden">
        <ChatInterface />
      </div>
    </AuthGuard>
  )
} 
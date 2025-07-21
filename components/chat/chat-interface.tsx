'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from './sidebar'
import { ChatArea } from './chat-area'
import { useChatStore } from '@/store/chat-store'

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session } = useSession()
  const { currentChatId, chats, loadChats, createNewChat, setCurrentChatId, loadMessages } = useChatStore()

  useEffect(() => {
    // Load chats only when we have an authenticated session
    if (session?.user?.id) {
      loadChats()
    }
  }, [loadChats, session?.user])

  useEffect(() => {
    // If we have chats but no current chat selected, select the most recent one
    if (chats.length > 0 && !currentChatId) {
      setCurrentChatId(chats[0].id)
    }
  }, [chats, currentChatId, setCurrentChatId])

  // Load messages when current chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId)
    }
  }, [currentChatId, loadMessages])

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0 ${sidebarOpen ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
        <div className="w-80 h-full">
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, MessageSquare, Settings, User, Menu, Trash2, Edit3, LogOut } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { ModelSelector } from './model-selector'
import { SettingsModal } from '../settings/settings-modal'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { data: session } = useSession()
  const { 
    chats, 
    currentChatId, 
    setCurrentChatId, 
    createNewChat, 
    deleteChat, 
    updateChatTitle 
  } = useChatStore()
  
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const handleNewChat = async () => {
    if (session?.user?.id) {
              await createNewChat()
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(chatId)
    }
  }

  const handleEditChat = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveEdit = async (chatId: string) => {
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditTitle('')
  }

  if (!isOpen) return null

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/icons/favicon.svg" alt="BuzzBot Logo" width={32} height={32} className="inline-block" />
            <h1 className="text-xl font-semibold">BuzzBot</h1>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-lg"
            title="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Model Selector */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <ModelSelector />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                currentChatId === chat.id
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              }`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
              
              {editingChatId === chat.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(chat.id)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {/* Chat Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => handleEditChat(chat, e)}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Menu */}
      <div className="px-4 py-3 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
          <User size={16} className="text-gray-400" />
          <div className="flex-1">
            <div className="text-sm font-medium">{session?.user?.name || 'User'}</div>
            <div className="text-xs text-gray-500">{session?.user?.email}</div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-1.5 hover:bg-red-600 rounded text-gray-400 hover:text-white"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  )
} 
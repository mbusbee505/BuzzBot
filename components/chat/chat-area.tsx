'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Menu, MoreVertical } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { MessageList } from './message-list'
import { FileUpload } from './file-upload'

// Default user for single-user mode
const DEFAULT_USER = {
  id: 'default-user',
  name: 'User',
  email: 'user@buzzbot.ai'
}

interface ChatAreaProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function ChatArea({ sidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')
  interface UploadedFile {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    hasContent: boolean
  }

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  
  const { 
    getCurrentChat, 
    addMessage, 
    isLoading, 
    isTyping,
    currentModel,
    setIsLoading,
    setIsTyping
  } = useChatStore()

  const currentChat = getCurrentChat()

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  // Show empty state when no chat is selected
  if (!currentChat) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                BuzzBot AI Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready to help with your questions
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Welcome to BuzzBot
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Your AI assistant is ready to help. Start a new conversation to begin chatting, 
              ask questions, upload files, or get assistance with any task.
            </p>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Multiple AI models available (GPT, Claude, o3)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Upload and analyze documents and images</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Generate and download files from responses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((!message.trim() && files.length === 0) || !currentChat || isLoading) {
      return
    }

    const userMessageContent = message.trim()
    
    // Set loading state
    setIsLoading(true)

    const userMessage = {
      content: userMessageContent,
      role: 'user' as const,
      model: currentModel,
      files: files.length > 0 ? files.map(file => ({
        id: file.id,
        filename: file.originalName,
        mimeType: file.mimeType,
        url: file.url
      })) : undefined
    }

    try {
      // Add user message immediately
      await addMessage(currentChat.id, userMessage)
      
      // Clear input
      setMessage('')
      setFiles([])
      
      // Get API keys from localStorage
      const apiKeys = {
        openai: localStorage.getItem('openai_api_key') || '',
        anthropic: localStorage.getItem('anthropic_api_key') || ''
      }

      // Check if API keys are available for the selected model
      if ((currentModel.startsWith('gpt-') || currentModel === 'o3') && !apiKeys.openai) {
        await addMessage(currentChat.id, {
          content: '❌ OpenAI API key not configured. Please add your API key in Settings.',
          role: 'assistant',
          model: currentModel
        })
        return
      }

      if (currentModel.startsWith('claude-') && !apiKeys.anthropic) {
        await addMessage(currentChat.id, {
          content: '❌ Anthropic API key not configured. Please add your API key in Settings.',
          role: 'assistant',
          model: currentModel
        })
        return
      }

      // Set typing indicator
      setIsTyping(true)

      // Send to AI and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChat.id,
          message: userMessageContent,
          model: currentModel,
          files: files.length > 0 ? files.map(f => f.id) : undefined,
          apiKeys
        })
      })

      if (response.ok) {
        const aiResponse = await response.json()
        await addMessage(currentChat.id, {
          content: aiResponse.content,
          role: 'assistant',
          model: currentModel
        })
      } else {
        const errorData = await response.json()
        await addMessage(currentChat.id, {
          content: `❌ Error: ${errorData.error || 'Failed to get AI response'}`,
          role: 'assistant',
          model: currentModel
        })
      }
    } catch (error) {
      console.error('Failed to get AI response:', error)
      await addMessage(currentChat.id, {
        content: '❌ Network error: Failed to connect to AI service. Please check your connection and try again.',
        role: 'assistant',
        model: currentModel
      })
    } finally {
      // Reset loading states
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {currentChat?.title || 'New Chat'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Using {currentModel}
            </p>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onFilesSelected={setFiles}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* File Preview */}
        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {file.originalName}
                </span>
                <button
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm"
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />
            
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Attach files"
            >
              <Paperclip size={18} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={(!message.trim() && files.length === 0) || isLoading}
            className="h-14 w-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-colors flex-shrink-0 shadow-sm flex items-center justify-center"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </form>
        
        {isTyping && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            AI is typing...
          </div>
        )}
      </div>
    </div>
  )
} 
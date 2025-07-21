'use client'

import { useEffect, useRef, useState } from 'react'
import { MarkdownRenderer } from '../ui/markdown-renderer'
import { Copy, User, Bot, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { formatDistanceToNow } from 'date-fns'
import { FileGenerator } from './file-generator'

export function MessageList() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { getCurrentChat, isTyping } = useChatStore()
  const [showFileGenerator, setShowFileGenerator] = useState(false)
  const [selectedContent, setSelectedContent] = useState('')
  
  const currentChat = getCurrentChat()
  const messages = currentChat?.messages || []

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Additional scroll when images load
  useEffect(() => {
    const images = document.querySelectorAll('img')
    const handleImageLoad = () => {
      scrollToBottom()
    }
    
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', handleImageLoad)
      }
    })
    
    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad)
      })
    }
  }, [messages])

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
          <p className="text-sm">Send a message to begin chatting with your AI assistant.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
            </div>
          )}
          
          <div
            className={`max-w-3xl ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-lg p-4'
                : 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4'
            }`}
          >
            {/* Message Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {message.model && (
                    <span className={`text-xs px-2 py-1 rounded-full bg-black/10 dark:bg-white/10 ${
                      message.role === 'user' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.model}
                    </span>
                  )}
                </div>
                <span className={`text-xs opacity-70 ${
                  message.role === 'user' ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className={`p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all ${
                    message.role === 'user' ? 'text-white hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="Copy message"
                >
                  <Copy size={14} />
                </button>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => {
                      setSelectedContent(message.content)
                      setShowFileGenerator(true)
                    }}
                    className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-green-600 dark:text-green-400"
                    title="Download as file"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div
              className={`message-content ${
                message.role === 'user'
                  ? 'text-white'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>

            {/* File Attachments */}
            {message.files && message.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm opacity-70">Attachments:</p>
                <div className="space-y-2">
                  {message.files.map((file, fileIndex) => (
                    <div
                      key={fileIndex}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {file.mimeType.startsWith('image/') ? (
                            <ImageIcon size={20} className="text-blue-500" />
                          ) : (
                            <FileText size={20} className="text-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.filename}
                          </p>
                          <p className="text-xs opacity-70">
                            {file.mimeType} • {(file.size || 0 / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {file.mimeType.startsWith('image/') && (
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-blue-500"
                              title="View image"
                            >
                              <ImageIcon size={16} />
                            </button>
                          )}
                          <a
                            href={file.url}
                            download={file.filename}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-green-500"
                            title="Download file"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      </div>
                      
                      {/* Image Preview */}
                      {file.mimeType.startsWith('image/') && (
                        <div className="mt-3">
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="max-w-full max-h-64 rounded-md object-contain cursor-pointer"
                            onClick={() => window.open(file.url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex gap-4 justify-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor with padding for better UX */}
      <div ref={messagesEndRef} className="h-8" />
      
      {/* File Generator Modal */}
      {showFileGenerator && (
        <FileGenerator
          content={selectedContent}
          defaultFilename="ai-response"
          onClose={() => {
            setShowFileGenerator(false)
            setSelectedContent('')
          }}
        />
      )}
    </div>
  )
} 
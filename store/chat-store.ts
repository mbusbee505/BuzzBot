import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  model?: string
  createdAt: string
  files?: Array<{
    id: string
    filename: string
    mimeType: string
    url?: string
    size?: number
  }>
}

export interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  currentModel: string
  isLoading: boolean
  isTyping: boolean

  // Actions
  setChats: (chats: Chat[]) => void
  setCurrentChatId: (chatId: string | null) => void
  setCurrentModel: (model: string) => void
  setIsLoading: (loading: boolean) => void
  setIsTyping: (typing: boolean) => void
  
  // Chat actions
  loadChats: () => Promise<void>
  createNewChat: () => Promise<Chat | null>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  
  // Message actions
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => Promise<void>
  loadMessages: (chatId: string) => Promise<void>
  
  // Utility
  getCurrentChat: () => Chat | null
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      currentModel: 'o3',
      isLoading: false,
      isTyping: false,

      setChats: (chats) => set({ chats }),
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      setCurrentModel: (model) => set({ currentModel: model }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsTyping: (typing) => set({ isTyping: typing }),

      loadChats: async () => {
        try {
          const response = await fetch('/api/chats')
          if (response.ok) {
            const chats = await response.json()
            set({ chats })
            
            // Set first chat as current if none selected
            if (chats.length > 0 && !get().currentChatId) {
              set({ currentChatId: chats[0].id })
            }
          }
        } catch (error) {
          console.error('Failed to load chats:', error)
        }
      },

      createNewChat: async () => {
        try {
          const response = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              model: get().currentModel 
            })
          })
          
          if (response.ok) {
            const newChat = await response.json()
            set((state) => ({
              chats: [newChat, ...state.chats],
              currentChatId: newChat.id
            }))
            return newChat
          }
        } catch (error) {
          console.error('Failed to create new chat:', error)
        }
        return null
      },

      updateChatTitle: async (chatId: string, title: string) => {
        try {
          const response = await fetch(`/api/chats/${chatId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          })
          
          if (response.ok) {
            set((state) => ({
              chats: state.chats.map(chat =>
                chat.id === chatId ? { ...chat, title } : chat
              )
            }))
          }
        } catch (error) {
          console.error('Failed to update chat title:', error)
        }
      },

      deleteChat: async (chatId: string) => {
        try {
          const response = await fetch(`/api/chats/${chatId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            set((state) => {
              const newChats = state.chats.filter(chat => chat.id !== chatId)
              const newCurrentChatId = state.currentChatId === chatId 
                ? (newChats.length > 0 ? newChats[0].id : null)
                : state.currentChatId
              
              return {
                chats: newChats,
                currentChatId: newCurrentChatId
              }
            })
          }
        } catch (error) {
          console.error('Failed to delete chat:', error)
        }
      },

      addMessage: async (chatId: string, messageData: Omit<Message, 'id' | 'createdAt'>) => {
        try {
          const response = await fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
          })
          
          if (response.ok) {
            const message = await response.json()
            set((state) => ({
              chats: state.chats.map(chat =>
                chat.id === chatId 
                  ? { 
                      ...chat, 
                      messages: [...(chat.messages || []), message],
                      updatedAt: new Date().toISOString()
                    }
                  : chat
              )
            }))
          }
        } catch (error) {
          console.error('Failed to add message:', error)
        }
      },

      loadMessages: async (chatId: string) => {
        try {
          const response = await fetch(`/api/chats/${chatId}/messages`)
          if (response.ok) {
            const messages = await response.json()
            set((state) => ({
              chats: state.chats.map(chat =>
                chat.id === chatId ? { ...chat, messages } : chat
              )
            }))
          }
        } catch (error) {
          console.error('Failed to load messages:', error)
        }
      },

      getCurrentChat: () => {
        const { chats, currentChatId } = get()
        return chats.find(chat => chat.id === currentChatId) || null
      }
    }),
    { name: 'chat-store' }
  )
) 
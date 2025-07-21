'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'

const AVAILABLE_MODELS = [
  { id: 'o3', name: 'OpenAI o3', description: 'Most advanced reasoning model with multimodal capabilities' },
  { id: 'o4-mini', name: 'OpenAI o4-mini', description: 'Lightweight, fast reasoning model with top performance' },
  { id: 'o1', name: 'OpenAI o1', description: 'Advanced reasoning model' },
  { id: 'o1-mini', name: 'OpenAI o1-mini', description: 'Efficient reasoning model' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'Advanced image generation model' },
  { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Anthropic\'s flagship model with enhanced reasoning' },
  { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', description: 'Balanced performance with improved capabilities' },
  { id: 'claude-4-haiku', name: 'Claude 4 Haiku', description: 'Fast and efficient with enhanced understanding' },
]

export function ModelSelector() {
  const { currentModel, setCurrentModel } = useChatStore()
  const [isOpen, setIsOpen] = useState(false)

  const currentModelInfo = AVAILABLE_MODELS.find(model => model.id === currentModel)

  const handleModelSelect = (modelId: string) => {
    setCurrentModel(modelId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Model
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">
            {currentModelInfo?.name || 'Select Model'}
          </div>
          {currentModelInfo?.description && (
            <div className="text-xs text-gray-400 truncate">
              {currentModelInfo.description}
            </div>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {model.description}
                  </div>
                </div>
                {currentModel === model.id && (
                  <Check size={16} className="text-green-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 
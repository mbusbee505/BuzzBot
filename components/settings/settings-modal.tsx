'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ApiKeys {
  openai: string
  anthropic: string
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession()
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: ''
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Load API keys from user-specific localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const savedKeys = {
        openai: localStorage.getItem(`openai_api_key_${session.user.id}`) || '',
        anthropic: localStorage.getItem(`anthropic_api_key_${session.user.id}`) || ''
      }
      setApiKeys(savedKeys)
    }
  }, [session?.user?.id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to user-specific localStorage (security through user isolation)
      if (session?.user?.id) {
        localStorage.setItem(`openai_api_key_${session.user.id}`, apiKeys.openai)
        localStorage.setItem(`anthropic_api_key_${session.user.id}`, apiKeys.anthropic)
        
        // You could also save to a backend API here
        // await fetch('/api/user/settings', { ... })
        
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('User session not found')
      }
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleShowKey = (provider: keyof typeof showKeys) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }))
  }

  const updateApiKey = (provider: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }))
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* API Keys Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              API Keys
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure your API keys to use different AI models. Keys are stored locally in your browser.
            </p>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              OpenAI API Key
              <span className="text-gray-500 text-xs ml-1">(for GPT models and o3)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) => updateApiKey('openai', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openai')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {apiKeys.openai && showKeys.openai && (
              <div className="text-xs text-gray-500 break-all">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border font-mono text-xs break-all overflow-hidden">
                  {apiKeys.openai}
                </div>
              </div>
            )}
          </div>

          {/* Anthropic API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Anthropic API Key
              <span className="text-gray-500 text-xs ml-1">(for Claude models)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => updateApiKey('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('anthropic')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showKeys.anthropic ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {apiKeys.anthropic && showKeys.anthropic && (
              <div className="text-xs text-gray-500 break-all">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border font-mono text-xs break-all overflow-hidden">
                  {apiKeys.anthropic}
                </div>
              </div>
            )}
          </div>

          {/* API Key Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                  How to get API keys:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• OpenAI: Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                  <li>• Anthropic: Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <Check size={16} />
              Settings saved successfully!
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              Failed to save settings. Please try again.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 
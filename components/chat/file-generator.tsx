'use client'

import { useState } from 'react'
import { Download, FileText, X } from 'lucide-react'

interface FileGeneratorProps {
  content: string
  defaultFilename?: string
  onClose: () => void
}

const FILE_TYPES = [
  { id: 'text', name: 'Text File', extension: '.txt' },
  { id: 'markdown', name: 'Markdown', extension: '.md' },
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'json', name: 'JSON', extension: '.json' },
  { id: 'csv', name: 'CSV', extension: '.csv' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
]

export function FileGenerator({ content, defaultFilename = 'generated-file', onClose }: FileGeneratorProps) {
  const [filename, setFilename] = useState(defaultFilename)
  const [fileType, setFileType] = useState('text')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!filename.trim() || !content.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/files/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          filename: filename.trim(),
          fileType
        })
      })

      if (response.ok) {
        const fileData = await response.json()
        
        // Trigger download
        const link = document.createElement('a')
        link.href = fileData.downloadUrl
        link.download = fileData.originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        onClose()
      } else {
        console.error('File generation failed')
      }
    } catch (error) {
      console.error('File generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedFileType = FILE_TYPES.find(type => type.id === fileType)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generate File
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Preview
          </label>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {content.substring(0, 200)}
              {content.length > 200 && '...'}
            </pre>
          </div>
        </div>

        {/* Filename Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filename
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter filename"
            />
            <div className="text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {selectedFileType?.extension}
            </div>
          </div>
        </div>

        {/* File Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File Type
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {FILE_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.extension})
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!filename.trim() || !content.trim() || isGenerating}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Generate & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 
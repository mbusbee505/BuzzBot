'use client'

import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './code-block'
import Image from 'next/image'
import { useState } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ImageModalProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null)

  return (
    <>
      <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')
              const content = String(children).replace(/\n$/, '')
              
              if (!inline && match) {
                return (
                  <CodeBlock language={match[1]} className={className}>
                    {content}
                  </CodeBlock>
                )
              }
              
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            },
            img({ src, alt, ...props }) {
              return (
                <div className="my-4">
                  <img
                    src={src}
                    alt={alt || 'Image'}
                    className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => setModalImage({ src: src || '', alt: alt || 'Image' })}
                    {...props}
                  />
                  {alt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
                      {alt}
                    </p>
                  )}
                </div>
              )
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800 rounded-r">
                  {children}
                </blockquote>
              )
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                    {children}
                  </table>
                </div>
              )
            },
            th({ children }) {
              return (
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-2 text-left font-semibold">
                  {children}
                </th>
              )
            },
            td({ children }) {
              return (
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {children}
                </td>
              )
            },
            ul({ children }) {
              return <ul className="list-disc ml-6 my-2 space-y-1">{children}</ul>
            },
            ol({ children }) {
              return <ol className="list-decimal ml-6 my-2 space-y-1">{children}</ol>
            },
            h1({ children }) {
              return <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0">{children}</h1>
            },
            h2({ children }) {
              return <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0">{children}</h2>
            },
            h3({ children }) {
              return <h3 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h3>
            },
            p({ children }) {
              return <p className="my-3 leading-relaxed first:mt-0 last:mb-0">{children}</p>
            },
            a({ href, children }) {
              return (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {children}
                </a>
              )
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          isOpen={true}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  )
} 
'use client'

import { useState } from 'react'
import { Maximize2, X, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'

interface DapMessageDisplayProps {
  content: string
  showPreview?: boolean
  buttonText?: React.ReactNode
  title?: string
  className?: string
}

function stripMarkdown(markdown: string): string {
  if (!markdown) return ''
  let text = markdown
  
  // Remove images (must be before links)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  
  // Replace links with their text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' [Code] ')
  
  // Remove inline code
  text = text.replace(/`([^`]*)`/g, '$1')
  
  // Remove headers
  text = text.replace(/^#+\s+/gm, '')
  
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '')
  
  // Remove horizontal rules
  text = text.replace(/^---+$/gm, '')
  
  // Remove bold/italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')
  
  // Remove tables (lines starting with |)
  text = text.replace(/^\|.*$/gm, '')
  
  // Compact whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

function isMarkdown(text: string): boolean {
  if (!text) return false
  
  const patterns = [
    /!\[[^\]]*\]\([^)]*\)/, // Images
    /\[([^\]]*)\]\([^)]*\)/, // Links
    /```[\s\S]*?```/, // Code blocks
    /`([^`]*)`/, // Inline code
    /^#+\s+/m, // Headers
    /^>\s+/m, // Blockquotes
    /^---+$/m, // Horizontal rules
    /(\*\*|__)(.*?)\1/, // Bold
    /(\*|_)(.*?)\1/, // Italic
    /^\|.*$/m // Tables
  ]

  return patterns.some(pattern => pattern.test(text))
}

export function DapMessageDisplay({ 
  content, 
  showPreview = true, 
  buttonText, 
  title, 
  className 
}: DapMessageDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  const isMd = isMarkdown(content)
  const isLong = content.length > 100
  const isInteractive = isMd || isLong

  if (showPreview && !isInteractive) {
    return (
      <div className={`rounded-lg border border-transparent bg-gray-900/50 p-3 ${className || ''}`}>
        <div className="text-sm text-gray-300 break-all whitespace-pre-wrap">
          {content}
        </div>
      </div>
    )
  }

  // Generate preview text if showing preview
  const previewText = showPreview ? stripMarkdown(content) : ''
  const displayPreview = showPreview ? (previewText.length > 100 ? previewText.slice(0, 100) + '...' : previewText) : ''

  return (
    <>
      {showPreview ? (
        <div
          className={`group relative cursor-pointer rounded-lg border border-transparent bg-gray-900/50 p-3 hover:bg-gray-800 hover:border-purple-500/30 transition-all duration-200 ${className || ''}`}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <div className="text-sm text-gray-300 break-all line-clamp-3">
            {displayPreview || <span className="text-gray-500 italic">{t('dap.clickToView')}</span>}
          </div>
          
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-400 opacity-70 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
            <span>{buttonText || t('dap.clickToExpand')}</span>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={className}
        >
          {buttonText || (
            <>
              <Eye className="w-3 h-3 mr-1" />
              {t('dap.preview')}
            </>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 bg-gray-950 border-gray-800 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-gray-800 flex flex-row items-center justify-between bg-gray-900/50">
            <DialogTitle className="text-base font-medium text-gray-200">
              {title || t('dap.messageContent')}
            </DialogTitle>
            <DialogClose className="text-gray-400 hover:text-white transition-colors focus:outline-hidden">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="prose prose-invert max-w-none prose-sm sm:prose-base">
              <MarkdownRenderer>{content}</MarkdownRenderer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

interface MarkdownRendererProps {
  children: string
  className?: string
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [targetUrl, setTargetUrl] = useState('')

  const handleLinkClick = (href: string) => {
    setTargetUrl(href)
    setIsOpen(true)
  }

  const handleConfirm = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <>
      <div className={className}>
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold text-white mt-4 mb-2 border-b border-gray-700 pb-1" />,
            h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold text-white mt-3 mb-2" />,
            h3: ({ node, ...props }) => <h3 {...props} className="text-base font-bold text-white mt-3 mb-1" />,
            h4: ({ node, ...props }) => <h4 {...props} className="text-sm font-bold text-white mt-2 mb-1" />,
            h5: ({ node, ...props }) => <h5 {...props} className="text-sm font-bold text-white mt-2 mb-1" />,
            h6: ({ node, ...props }) => <h6 {...props} className="text-xs font-bold text-white mt-2 mb-1" />,
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4 rounded-lg border border-gray-700">
                <table {...props} className="w-full text-left text-sm text-gray-300" />
              </div>
            ),
            thead: ({ node, ...props }) => <thead {...props} className="bg-gray-800 text-gray-200" />,
            tbody: ({ node, ...props }) => <tbody {...props} className="divide-y divide-gray-700 bg-gray-900/50" />,
            tr: ({ node, ...props }) => <tr {...props} className="hover:bg-gray-800/50 transition-colors" />,
            th: ({ node, ...props }) => <th {...props} className="px-4 py-3 font-semibold whitespace-nowrap" />,
            td: ({ node, ...props }) => <td {...props} className="px-4 py-3" />,
            hr: ({ node, ...props }) => <hr {...props} className="my-4 border-gray-700" />,
            strong: ({ node, ...props }) => <strong {...props} className="font-bold text-purple-300" />,
            em: ({ node, ...props }) => <em {...props} className="italic text-gray-400" />,
            del: ({ node, ...props }) => <del {...props} className="line-through text-gray-500" />,
            a: ({ node, href, ...props }) => (
              <a
                {...props}
                href={href}
                className="text-purple-400 hover:underline break-all cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  if (href) handleLinkClick(href)
                }}
              />
            ),
            p: ({ node, ...props }) => <p {...props} className="mb-1 last:mb-0" />,
            ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside mb-1 pl-1" />,
            ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside mb-1 pl-1" />,
            code: ({ node, className, children, ...props }: any) => {
              return (
                <code
                  className={`${className} bg-gray-700/50 rounded px-1 py-0.5 font-mono text-xs`}
                  {...props}
                >
                  {children}
                </code>
              )
            },
            pre: ({ node, ...props }) => (
              <pre
                {...props}
                className="bg-gray-800/50 p-2 rounded-lg overflow-x-auto mb-2 text-xs"
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                {...props}
                className="border-l-2 border-purple-500/50 pl-2 italic my-1"
              />
            ),
          }}
        >
          {children}
        </ReactMarkdown>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 max-w-[90vw] w-full sm:max-w-lg rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('common.externalLink')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {t('common.externalLinkInfo')}
              <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 break-all text-purple-400 font-mono text-xs">
                {targetUrl}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white mt-0">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {t('common.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

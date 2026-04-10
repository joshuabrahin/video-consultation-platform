import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import type { ChatMessage } from '../../types/chat'

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator — three animated dots shown while AI is generating
// ─────────────────────────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-white text-xs font-bold">AI</span>
      </div>

      {/* Dots bubble */}
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-gray-400 block"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Message action button — copy, regenerate, like, dislike
// ─────────────────────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  activeClass?: string
}

function ActionButton({ icon, label, onClick, active, activeClass }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? (activeClass ?? 'text-teal-600 bg-teal-50')
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Message component
// ─────────────────────────────────────────────────────────────────────────────

interface MessageProps {
  message: ChatMessage
  onRegenerate?: (id: string) => void
}

export function Message({ message, onRegenerate }: MessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<'up' | 'down' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 px-4 py-2 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold ${
          isUser ? 'bg-blue-500 text-white' : 'bg-teal-600 text-white'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble + actions */}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          {/* Markdown rendered for AI, plain text for user */}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 underline underline-offset-2 hover:text-teal-800 inline-flex items-center gap-0.5"
                  >
                    {children}
                    <ExternalLink size={10} />
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {message.citations.map((citation, i) => (
              <a
                key={i}
                href={citation}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors"
              >
                <ExternalLink size={9} />
                Source {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* Timestamp + actions row */}
        <div className={`flex items-center gap-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Timestamp */}
          <span className="text-[10px] text-gray-400 px-1">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>

          {/* Action buttons — visible on hover */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {/* Copy — available for both user and AI */}
              <ActionButton
                icon={copied ? <Check size={13} /> : <Copy size={13} />}
                label="Copy message"
                onClick={handleCopy}
                active={copied}
                activeClass="text-green-600 bg-green-50"
              />

              {/* AI-only actions */}
              {!isUser && (
                <>
                  <ActionButton
                    icon={<RefreshCw size={13} />}
                    label="Regenerate response"
                    onClick={() => onRegenerate?.(message.id)}
                  />
                  <ActionButton
                    icon={<ThumbsUp size={13} />}
                    label="Good response"
                    onClick={() => setLiked(liked === 'up' ? null : 'up')}
                    active={liked === 'up'}
                    activeClass="text-teal-600 bg-teal-50"
                  />
                  <ActionButton
                    icon={<ThumbsDown size={13} />}
                    label="Bad response"
                    onClick={() => setLiked(liked === 'down' ? null : 'down')}
                    active={liked === 'down'}
                    activeClass="text-red-500 bg-red-50"
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

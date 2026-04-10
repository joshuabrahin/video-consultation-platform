import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'

interface ChatInputProps {
  onSend: (message: string) => void
}

export function ChatInput({ onSend }: ChatInputProps) {
  const { isLoading } = useChatStore()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea as content grows (max ~5 lines)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [value])

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const canSend = value.trim().length > 0 && !isLoading

  const handleSend = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue('')
    // Reset height after clearing
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = send; Shift+Enter = newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-100 px-3 py-3 bg-white rounded-b-2xl">
      <div
        className={`flex items-end gap-2 bg-gray-50 rounded-xl border transition-all ${
          isLoading
            ? 'border-gray-200 opacity-60'
            : 'border-gray-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20'
        }`}
      >
        {/* Attach file — visible but disabled (future feature) */}
        <button
          disabled
          aria-label="Attach file (coming soon)"
          title="Attach file (coming soon)"
          className="p-2.5 mb-0.5 text-gray-300 cursor-not-allowed flex-shrink-0"
        >
          <Paperclip size={16} />
        </button>

        {/* Auto-resizing textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder={isLoading ? 'AI is responding…' : 'Ask anything about your consultation…'}
          aria-label="Chat message input"
          aria-disabled={isLoading}
          className="flex-1 bg-transparent resize-none py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none min-h-[40px] max-h-[120px] leading-relaxed disabled:cursor-not-allowed"
        />

        {/* Send button */}
        <div className="p-1.5 mb-1 flex-shrink-0">
          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            whileTap={canSend ? { scale: 0.9 } : {}}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              canSend
                ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm shadow-teal-600/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={14} className={canSend ? '' : 'opacity-50'} />
          </motion.button>
        </div>
      </div>

      {/* Helper hint */}
      <p className="text-[10px] text-gray-400 mt-1.5 pl-1">
        Press <kbd className="font-mono bg-gray-100 px-1 rounded">Enter</kbd> to send ·{' '}
        <kbd className="font-mono bg-gray-100 px-1 rounded">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}

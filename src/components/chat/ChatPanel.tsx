import { useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Bot, Stethoscope, WifiOff } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'
import type { ChatMessage } from '../../types/chat'
import { Message, TypingIndicator } from './Message'
import { SuggestionChips } from './SuggestionChips'
import { ChatInput } from './ChatInput'

// ─────────────────────────────────────────────────────────────────────────────
// Welcome message shown before the user sends anything
// ─────────────────────────────────────────────────────────────────────────────

function makeWelcome(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hi! I'm your **AI Medical Assistant**. I can:
- 📋 Summarize your recent video consultation
- 💊 Explain your prescription or medication
- 📅 Help you check or book appointments
- ❓ Answer general health questions

How can I help you today?`,
    contentType: 'text',
    status: 'delivered',
    timestamp: new Date(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  /** Pre-load booking context when opening from a booking/confirmation page */
  bookingId?: string
  doctorName?: string
  meetSummaryLink?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatPanel
// ─────────────────────────────────────────────────────────────────────────────

export function ChatPanel({ bookingId, doctorName, meetSummaryLink }: ChatPanelProps) {
  const {
    messages,
    isOpen,
    isLoading,
    currentContext,
    addMessage,
    toggleChat,
    clearChat,
    setContext,
    setLoading,
  } = useChatStore()

  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Load booking context on mount / when props change ─────────────────────
  useEffect(() => {
    if (bookingId || doctorName || meetSummaryLink) {
      setContext({ bookingId, doctorName, meetSummaryLink })
    }
  }, [bookingId, doctorName, meetSummaryLink, setContext])

  // ── Auto-scroll to bottom on new messages / loading state ────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Cancel in-flight request when panel closes ────────────────────────────
  useEffect(() => {
    if (!isOpen) abortRef.current?.abort()
  }, [isOpen])

  // ── Core send / AI fetch ──────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      // Add user message to store
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        contentType: 'text',
        status: 'sending',
        timestamp: new Date(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addMessage(userMsg as any)
      setLoading(true)

      // Abort any previous in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Last 20 messages for context window
        const history = [...messages, userMsg].slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ messages: history, context: currentContext }),
        })

        if (!res.ok) {
          throw new Error(`Server error ${res.status}: ${res.statusText}`)
        }

        const contentType = res.headers.get('content-type') ?? ''

        if (contentType.includes('text/event-stream')) {
          // ── Streaming (SSE) path ──────────────────────────────────────────
          const streamMsgId = crypto.randomUUID()
          const streamMsg: ChatMessage = {
            id: streamMsgId,
            role: 'assistant',
            content: '',
            contentType: 'text',
            status: 'delivered',
            timestamp: new Date(),
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addMessage(streamMsg as any)

          const reader = res.body!.getReader()
          const decoder = new TextDecoder()
          let accumulated = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })

            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const payload = line.slice(6).trim()
              if (payload === '[DONE]') continue
              try {
                const parsed = JSON.parse(payload)
                accumulated += parsed.delta ?? parsed.content ?? ''
              } catch {
                accumulated += payload
              }
            }

            // Patch the streaming message in the store
            useChatStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === streamMsgId ? { ...m, content: accumulated } : m,
              ),
            }))
          }
        } else {
          // ── Non-streaming JSON path ───────────────────────────────────────
          const data = await res.json()
          const aiContent: string =
            data.message?.content ?? data.content ?? data.reply ?? ''

          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: aiContent,
            contentType: 'text',
            status: 'delivered',
            timestamp: new Date(),
            citations: data.citations,
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addMessage(aiMsg as any)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return

        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.'

        const isNetwork =
          message.includes('fetch') ||
          message.includes('Failed') ||
          message.includes('connect') ||
          message.includes('NetworkError') ||
          message.includes('ConnectionRefused')

        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isNetwork
            ? "I'm having trouble reaching the server right now. Please make sure the backend is running and try again."
            : `Sorry, something went wrong: ${message}`,
          contentType: 'text',
          status: 'error',
          timestamp: new Date(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addMessage(errorMsg as any)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, currentContext],
  )

  // ── Regenerate last AI response ──────────────────────────────────────────
  const handleRegenerate = useCallback(
    (id: string) => {
      const idx = messages.findIndex((m) => m.id === id)
      if (idx <= 0) return
      const prev = messages[idx - 1]
      if (prev?.role === 'user') sendMessage(prev.content)
    },
    [messages, sendMessage],
  )

  // ── Messages to display (prepend welcome when history is empty) ───────────
  const welcome = useMemo(() => makeWelcome(), [])
  const displayMessages = useMemo(
    () =>
      messages.length === 0
        ? ([welcome] as unknown as ReturnType<typeof useChatStore.getState>['messages'])
        : messages,
    [messages, welcome],
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Mobile backdrop ──────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleChat}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            aria-hidden="true"
          />

          {/* ── Slide-in panel ───────────────────────────────────────────── */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0.85 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.85 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-label="AI Medical Assistant"
            aria-modal="true"
            className={[
              'fixed z-50 flex flex-col',
              // Light mode
              'bg-white',
              // Dark mode
              'dark:bg-gray-900',
              'shadow-2xl',
              // Mobile: covers screen from below header
              'inset-x-0 bottom-0 top-16 rounded-t-2xl',
              // Desktop: right sidebar, full viewport height
              'lg:inset-y-0 lg:inset-x-auto lg:right-0 lg:top-0 lg:w-[420px] lg:rounded-none lg:rounded-l-2xl',
            ].join(' ')}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900 rounded-tl-2xl lg:rounded-tl-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    AI Medical Assistant
                  </h2>
                  <p
                    className={`text-[10px] font-medium transition-colors ${
                      isLoading
                        ? 'text-amber-500'
                        : 'text-teal-600 dark:text-teal-400'
                    }`}
                  >
                    {isLoading ? 'Typing…' : 'Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {/* Clear conversation */}
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  disabled={messages.length === 0}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                </button>
                {/* Close panel */}
                <button
                  onClick={toggleChat}
                  title="Close chat"
                  aria-label="Close chat panel"
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Booking context banner ──────────────────────────────────── */}
            <AnimatePresence>
              {currentContext.doctorName && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-300">
                    <Stethoscope size={12} className="flex-shrink-0" />
                    <span>
                      Context: consultation with{' '}
                      <strong>{currentContext.doctorName}</strong>
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Scrollable message list ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
              <div className="py-3 min-h-full flex flex-col">
                {/* Messages */}
                {(displayMessages as unknown as ChatMessage[]).map((msg) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    onRegenerate={handleRegenerate}
                  />
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={bottomRef} className="h-px" />
              </div>
            </div>

            {/* ── Suggestion chips (hidden after first user message) ──────── */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900">
              <SuggestionChips onSend={sendMessage} />
            </div>

            {/* ── Input area ──────────────────────────────────────────────── */}
            <div className="flex-shrink-0">
              <ChatInput onSend={sendMessage} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

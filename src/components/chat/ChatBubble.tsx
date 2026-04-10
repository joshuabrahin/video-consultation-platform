import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'

export function ChatBubble() {
  const { isOpen, toggleChat, messages } = useChatStore()

  // Count unread assistant messages (future: track read state in store)
  const unreadCount = messages.filter((m) => m.role === 'assistant').length

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Tooltip label — visible when chat is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none"
          >
            Ask AI Assistant
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="relative w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-600/40 flex items-center justify-center transition-colors cursor-pointer"
        aria-label={isOpen ? 'Close chat' : 'Open AI assistant'}
      >
        {/* Icon switches between open/close with animation */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge — shown only when chat is closed and there are messages */}
        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring — draws attention when chat is closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20 pointer-events-none" />
        )}
      </motion.button>
    </div>
  )
}

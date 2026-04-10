import { motion } from 'framer-motion'
import {
  FileText,
  CalendarCheck,
  CalendarPlus,
  Pill,
  HelpCircle,
} from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'
import type { ChatMessage } from '../../types/chat'

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion chip definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Chip {
  label: string
  prompt: string       // the actual message sent to the AI
  icon: React.ReactNode
}

const CHIPS: Chip[] = [
  {
    label: 'Summarize my last consultation',
    prompt: 'Summarize my last video consultation',
    icon: <FileText size={13} />,
  },
  {
    label: 'After appointment advice',
    prompt: 'What should I do after my appointment?',
    icon: <HelpCircle size={13} />,
  },
  {
    label: 'Upcoming bookings',
    prompt: 'Show me my upcoming bookings',
    icon: <CalendarCheck size={13} />,
  },
  {
    label: 'Explain my prescription',
    prompt: 'Explain my prescription',
    icon: <Pill size={13} />,
  },
  {
    label: 'Book a follow-up',
    prompt: 'Book a follow-up appointment',
    icon: <CalendarPlus size={13} />,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface SuggestionChipsProps {
  // Called after the user message is added to the store — use this to trigger
  // the actual AI API call with the prompt string
  onSend: (prompt: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SuggestionChips({ onSend }: SuggestionChipsProps) {
  const { addMessage, messages } = useChatStore()

  // Only show when there are 0 or 1 messages in the conversation
  if (messages.length > 1) return null

  const handleChipClick = (chip: Chip) => {
    // Build and add user message to the store immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chip.prompt,
      contentType: 'text',
      status: 'sending',
      timestamp: new Date(),
    }
    addMessage(userMessage)

    // Trigger the API call in the parent chat panel
    onSend(chip.prompt)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="px-4 pb-3"
    >
      {/* Label */}
      <p className="text-xs text-gray-400 font-medium mb-2.5 pl-1">
        Suggested questions
      </p>

      {/* Chips grid */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip, i) => (
          <motion.button
            key={chip.prompt}
            onClick={() => handleChipClick(chip)}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 hover:border-teal-300 transition-colors cursor-pointer"
          >
            <span className="text-teal-500">{chip.icon}</span>
            {chip.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

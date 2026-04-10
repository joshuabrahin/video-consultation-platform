// ─────────────────────────────────────────────────────────────────────────────
// Chat Types — Telemedicine Platform
// Used by the AI chatbot for doctor discovery, booking assistance,
// Google Meet summaries, and post-consultation follow-ups.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sender identity ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'sending' | 'delivered' | 'error'

// ── Rich content types ────────────────────────────────────────────────────────

export type MessageContentType =
  | 'text'
  | 'booking-summary'
  | 'doctor-card'
  | 'meet-link'
  | 'prescription-summary'
  | 'quick-replies'

// ── Doctor reference inside chat ──────────────────────────────────────────────

export interface ChatDoctor {
  id: number
  name: string
  specialty: string
  avatar: string
  calendarId?: string
  availableSlots?: number
}

// ── Booking reference inside chat ─────────────────────────────────────────────

export interface ChatBooking {
  id: number
  doctorName: string
  specialty: string
  date: string          // ISO string
  startTime: string     // e.g. "10:00 AM"
  endTime: string       // e.g. "10:30 AM"
  meetLink: string
  problem: string
  prescription?: string
  status: 'upcoming' | 'completed' | 'cancelled'
}

// ── Quick reply suggestion chips ──────────────────────────────────────────────

export interface QuickReply {
  label: string
  value: string
  icon?: string
}

// ── Individual chat message ───────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  contentType: MessageContentType
  status: MessageStatus
  timestamp: Date

  // Optional rich payload — populated based on contentType
  doctor?: ChatDoctor
  booking?: ChatBooking
  meetLink?: string
  quickReplies?: QuickReply[]
}

// ── Conversation context ──────────────────────────────────────────────────────

export type ConversationIntent =
  | 'idle'
  | 'find-doctor'
  | 'book-appointment'
  | 'view-bookings'
  | 'get-meet-link'
  | 'prescription-query'
  | 'general-health-query'

export interface ConversationContext {
  intent: ConversationIntent
  selectedDoctor?: ChatDoctor
  pendingBooking?: Partial<ChatBooking>
  userId?: number
}

// ── Chat session ──────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  userId?: number
  messages: ChatMessage[]
  context: ConversationContext
  createdAt: Date
  updatedAt: Date
}

// ── API request / response ────────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string
  message: string
  context?: ConversationContext
}

export interface ChatResponse {
  message: ChatMessage
  updatedContext?: ConversationContext
}

// ── UI state ──────────────────────────────────────────────────────────────────

export interface ChatUIState {
  isOpen: boolean
  isTyping: boolean        // assistant is generating a response
  isLoading: boolean       // initial session load
  error: string | null
  unreadCount: number
}

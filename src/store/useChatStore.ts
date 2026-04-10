import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// A single chat message — supports both user and assistant roles.
// citations are optional source references the AI may include (e.g. doctor bio,
// booking record, Google Meet summary link).
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
}

// Context that scopes the AI conversation to a specific booking session.
// Populated when a user opens the chat from a booking confirmation or
// a Google Meet summary page.
export interface ChatContext {
  bookingId?: string
  meetSummaryLink?: string
  doctorName?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Store shape — state + actions
// ─────────────────────────────────────────────────────────────────────────────

interface ChatStore {
  // ── State ──────────────────────────────────────────────────────────────────

  // Full message history for the current chat session
  messages: ChatMessage[]

  // Controls whether the chat panel/modal is visible
  isOpen: boolean

  // True while waiting for the AI assistant to respond
  isLoading: boolean

  // Active booking/meet context — tells the AI what the user is referring to
  currentContext: ChatContext

  // ── Actions ────────────────────────────────────────────────────────────────

  // Append a single message to the conversation (user or assistant)
  addMessage: (message: ChatMessage) => void

  // Replace the entire message array (used when loading history from API)
  setMessages: (messages: ChatMessage[]) => void

  // Open or close the chat panel
  toggleChat: () => void

  // Wipe all messages and reset context (e.g. when starting a new session)
  clearChat: () => void

  // Update the booking/meet context the AI should be aware of
  setContext: (context: Partial<ChatContext>) => void

  // Set the loading state (true = waiting for AI response)
  setLoading: (loading: boolean) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatStore>((set) => ({
  // ── Initial state ───────────────────────────────────────────────────────────

  messages: [],
  isOpen: false,
  isLoading: false,
  currentContext: {},

  // ── Action implementations ──────────────────────────────────────────────────

  // Adds a new message to the end of the conversation thread
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // Replaces all messages — used when restoring a session from the backend
  setMessages: (messages) => set({ messages }),

  // Toggles the chat panel open/closed
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  // Clears all messages and resets context back to empty
  clearChat: () =>
    set({
      messages: [],
      currentContext: {},
      isLoading: false,
    }),

  // Merges partial context updates so existing fields are preserved
  // e.g. setContext({ doctorName: 'Dr. Sarah' }) won't erase bookingId
  setContext: (context) =>
    set((state) => ({
      currentContext: { ...state.currentContext, ...context },
    })),

  // Controls the typing/loading indicator while the AI generates a response
  setLoading: (loading) => set({ isLoading: loading }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
}

export interface ChatContext {
  bookingId?: string
  meetSummaryLink?: string
  doctorName?: string
}

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  currentContext: ChatContext
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  toggleChat: () => void
  clearChat: () => void
  setContext: (context: Partial<ChatContext>) => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isLoading: false,
      currentContext: {},

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setMessages: (messages) => set({ messages }),

      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

      clearChat: () => set({ messages: [], currentContext: {}, isLoading: false }),

      setContext: (context) =>
        set((state) => ({ currentContext: { ...state.currentContext, ...context } })),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        messages: state.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        })),
        currentContext: state.currentContext,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.messages = state.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        }
      },
    },
  ),
)

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessageDto {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatContextDto {
  bookingId?: string
  doctorName?: string
  meetSummaryLink?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Static mock responses (fallback when no real data exists yet)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK = {
  greeting: `Hello! I'm your AI Medical Assistant for **The Right Hand** telemedicine platform. I can help you with:

- 📋 **Consultation summaries** — recap what was discussed with your doctor
- 💊 **Prescription explanations** — understand your medications
- 📅 **Appointments** — check upcoming bookings or schedule a follow-up
- ❓ **General health questions** — evidence-based guidance

How can I help you today?`,

  summaryPending: (doctorName?: string) => `Your consultation${doctorName ? ` with **${doctorName}**` : ''} summary is still being prepared.

The Recall.ai bot is currently processing the meeting recording and transcript. This usually takes **1–3 minutes** after the meeting ends.

**What happens next:**
1. 🎙️ Recall.ai transcribes the full audio
2. 🤖 Our AI reads the transcript and generates a structured summary
3. 💾 The summary is saved to your booking record
4. ✅ It will appear here automatically — just ask again in a moment!

Is there anything else I can help you with while you wait?`,

  summaryNoBooking: `I don't have a specific consultation linked to this chat session yet.

To get your consultation summary:
- Open the chat from your **booking confirmation page**, or
- Go to **My Bookings** and open the chat from there

Would you like help with something else?`,

  prescription: `Here's a breakdown of your current prescription:

---
**💊 Amlodipine 5mg**
- **Purpose:** Treats high blood pressure (hypertension)
- **How to take:** Once daily, at the same time each day
- **Side effects:** Swollen ankles, flushing, slight dizziness
- **Important:** Do not stop suddenly without consulting your doctor

---
**💊 Vitamin D3 2000 IU**
- **Purpose:** Vitamin D deficiency supplement
- **How to take:** Once daily with a fatty meal for absorption
- **Duration:** 3 months, then retest

---
**⚠️ Avoid:** Grapefruit juice (interacts with Amlodipine) and excessive alcohol.`,

  upcoming: `Here are your upcoming appointments:

| # | Doctor | Specialty | Date & Time | Status |
|---|--------|-----------|-------------|--------|
| 1 | Dr. Sarah Mitchell | Cardiology | Tomorrow, 10:00 AM | ✅ Confirmed |
| 2 | Dr. James Okafor | General Practice | Apr 18, 2:30 PM | ✅ Confirmed |

**Your next appointment is tomorrow at 10:00 AM.**

To join the video call, click **"Join Meeting"** in your booking confirmation, or go to **My Bookings** in the app.`,

  bookFollowUp: `I can help you schedule a follow-up! Here are available doctors:

- 👨‍⚕️ **Dr. Sarah Mitchell** — Cardiology | Next slot: *Tomorrow 10:00 AM*
- 👩‍⚕️ **Dr. Priya Sharma** — Internal Medicine | Next slot: *Apr 14, 3:00 PM*
- 👨‍⚕️ **Dr. James Okafor** — General Practice | Next slot: *Apr 13, 11:00 AM*

Head to the **Book Appointment** page to confirm your slot.`,

  meetLink: `Here's how to join your video consultation:

**Your upcoming meeting:**
- 🩺 **Doctor:** Dr. Sarah Mitchell
- 📅 **Date:** Tomorrow at 10:00 AM
- ⏱️ **Duration:** 30 minutes

**How to join:**
1. Click the Google Meet link from your booking confirmation email
2. Or go to **My Bookings → Join Meeting**
3. Allow camera and microphone access
4. Wait in the lobby — your doctor will admit you

**Tips:** Test your camera 5 minutes early, have your medications ready.`,

  afterCare: `After your video consultation:

**Immediately:**
1. ✅ Check email for consultation summary and prescription
2. 📋 Review doctor's notes in your patient portal
3. 💊 Fill any new prescriptions

**Ongoing:**
- Take medications exactly as prescribed
- Log any symptoms if asked
- Attend your follow-up appointment

**Seek urgent care if:**
- Symptoms worsen significantly
- Chest pain, shortness of breath, or severe headache
- Adverse reaction to new medication`,

  fallback: (lastMessage: string) => `Thank you for your message: *"${lastMessage}"*

Here's what I can help with:

- 📋 **"summarize my consultation"** — get your meeting summary
- 💊 **"explain my prescription"** — medication breakdown
- 📅 **"show upcoming bookings"** — your appointment schedule
- 🎥 **"get my meet link"** — how to join your call
- 🏥 **"book a follow-up"** — schedule a new appointment
- 🩹 **"after appointment advice"** — post-consultation care

> ⚠️ *I provide general health information only. Always follow your doctor's specific advice.*`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern matching
// ─────────────────────────────────────────────────────────────────────────────

type ResponseKey =
  | 'greeting'
  | 'summarize'
  | 'prescription'
  | 'upcoming'
  | 'bookFollowUp'
  | 'meetLink'
  | 'afterCare'
  | null

function detectIntent(messages: ChatMessageDto[]): ResponseKey {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  const text = (last?.content ?? '').toLowerCase()

  if (/\b(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i.test(text)) return 'greeting'
  if (/\b(summarize|summary|recap|what.*happen|consultation|meeting|discuss)\b/i.test(text)) return 'summarize'
  if (/\b(prescription|medication|medicine|drug|pill|dose|dosage|tablet|capsule)\b/i.test(text)) return 'prescription'
  if (/\b(book|schedule|follow.?up|new\s*appointment)\b/i.test(text)) return 'bookFollowUp'
  if (/\b(upcoming|next\s*appointment|my\s*bookings|calendar|when\s*is)\b/i.test(text)) return 'upcoming'
  if (/\b(meet|link|join|video\s*call|google\s*meet|how.*(join|start))\b/i.test(text)) return 'meetLink'
  if (/\b(after|post|following|done|finished|complete|advice|next\s*step)\b/i.test(text)) return 'afterCare'

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the correct response text for streaming.
   * For summarize intent: returns real DB summary if available,
   * otherwise falls back to pending/mock message.
   */
  async getResponse(
    messages: ChatMessageDto[],
    context?: ChatContextDto,
  ): Promise<string> {
    const intent = detectIntent(messages)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')

    // ── Summarize: try to return real data first ──────────────────────────
    if (intent === 'summarize') {
      const bookingId = context?.bookingId ? parseInt(context.bookingId, 10) : null

      if (!bookingId || isNaN(bookingId)) {
        return MOCK.summaryNoBooking
      }

      const booking = await this.prisma.db.booking.findUnique({
        where: { id: bookingId },
        include: { doctor: true },
      })

      if (!booking) return MOCK.summaryNoBooking

      // ✅ Real AI summary is ready
      if (booking.summary) {
        return [
          `## Consultation Summary`,
          `*${booking.doctor.name} · ${booking.doctor.specialization}*`,
          `*${booking.date.toLocaleDateString('en-GB', { dateStyle: 'full' })}*`,
          '',
          booking.summary,
        ].join('\n')
      }

      // Meeting ended but summary not yet ready (still processing)
      if (booking.status === 'COMPLETED' && !booking.summary) {
        return `Your consultation summary is being finalized — please try again in a moment.`
      }

      // Meeting hasn't happened yet or bot is recording
      return MOCK.summaryPending(booking.doctor.name)
    }

    // ── All other intents use static mock responses ───────────────────────
    switch (intent) {
      case 'greeting':
        return MOCK.greeting
      case 'prescription':
        return MOCK.prescription
      case 'upcoming':
        return MOCK.upcoming
      case 'bookFollowUp':
        return MOCK.bookFollowUp
      case 'meetLink':
        return MOCK.meetLink
      case 'afterCare':
        return MOCK.afterCare
      default:
        return MOCK.fallback(lastUserMsg?.content ?? 'your question')
    }
  }
}

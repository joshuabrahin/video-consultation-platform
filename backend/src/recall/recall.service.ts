import { Injectable, Logger } from '@nestjs/common'

// ─────────────────────────────────────────────────────────────────────────────
// Recall.ai transcript types
// ─────────────────────────────────────────────────────────────────────────────

export interface RecallWord {
  text: string
  start_timestamp?: { relative?: number; absolute?: string }
  end_timestamp?: { relative?: number; absolute?: string }
}

export interface RecallTranscriptEntry {
  speaker: string
  is_host?: boolean | null
  words: RecallWord[]
  language?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RecallService {
  private readonly logger = new Logger(RecallService.name)
  private readonly apiBase = 'https://api.ap-northeast-1.recall.ai/api/v1'

  /**
   * Sends a Recall.ai bot to join a Google Meet call.
   * Returns the Recall bot ID (stored on the Booking) or null if not configured.
   */
  async scheduleBot(
    meetingUrl: string,
    joinAt: Date,
    bookingId: string,
  ): Promise<string | null> {
    const apiKey = process.env.RECALL_API_KEY
    if (!apiKey) {
      this.logger.warn('RECALL_API_KEY not set — bot scheduling skipped')
      return null
    }

    const webhookUrl = process.env.RECALL_WEBHOOK_URL

    const payload: Record<string, unknown> = {
      meeting_url: meetingUrl,
      bot_name: 'The Right Hand — Medical Scribe',
      join_at: joinAt.toISOString(),
      transcription_options: { provider: 'default' },
      // metadata comes back in every webhook so we can find the booking
      metadata: { booking_id: bookingId },
    }

    if (webhookUrl) {
      payload.webhook_url = `${webhookUrl}/webhook/recall`
    }

    try {
      const res = await fetch(`${this.apiBase}/bot/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        this.logger.error(`Recall bot creation failed (${res.status}): ${text}`)
        return null
      }

      const data = (await res.json()) as { id: string }
      this.logger.log(`Recall bot scheduled: ${data.id} → booking #${bookingId}`)
      return data.id
    } catch (err) {
      this.logger.error('Recall.ai API unreachable', err)
      return null
    }
  }

  /**
   * Fetches the full transcript for a bot after the meeting ends.
   */
  async getTranscript(botId: string): Promise<RecallTranscriptEntry[] | null> {
    const apiKey = process.env.RECALL_API_KEY
    if (!apiKey) return null

    try {
      const res = await fetch(`${this.apiBase}/bot/${botId}/transcript/`, {
        headers: { Authorization: `Token ${apiKey}` },
      })

      if (!res.ok) {
        this.logger.error(`Transcript fetch failed for bot ${botId} (${res.status})`)
        return null
      }

      return (await res.json()) as RecallTranscriptEntry[]
    } catch (err) {
      this.logger.error(`Transcript fetch error for bot ${botId}`, err)
      return null
    }
  }

  /**
   * Converts Recall.ai transcript entries into a readable plain-text string.
   */
  transcriptToText(entries: RecallTranscriptEntry[]): string {
    return entries
      .map((entry) => {
        const text = entry.words.map((w) => w.text).join(' ').trim()
        return `${entry.speaker}: ${text}`
      })
      .filter((line) => line.length > 10) // drop empty/noise lines
      .join('\n')
  }
}

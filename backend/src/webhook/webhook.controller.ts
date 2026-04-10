import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { RecallService } from '../recall/recall.service.js'
import { AiService } from '../ai/ai.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// Recall.ai webhook payload shapes
// Recall sends different shapes depending on API version — handle both.
// ─────────────────────────────────────────────────────────────────────────────

interface RecallWebhookPayload {
  event: string
  data: {
    // v1 shape
    bot_id?: string
    status?: { code?: string; message?: string }
    // v2 shape
    bot?: { id?: string; metadata?: Record<string, unknown> }
    recording?: { id?: string; bot_id?: string }
    // metadata (v1)
    metadata?: Record<string, unknown>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly recall: RecallService,
    private readonly ai: AiService,
  ) {}

  /**
   * POST /webhook/recall
   *
   * Recall.ai calls this endpoint when a meeting bot event fires.
   * We respond 200 immediately, then process async so Recall doesn't timeout.
   */
  @Post('recall')
  @HttpCode(200)
  handleRecallWebhook(@Body() body: RecallWebhookPayload): { received: boolean } {
    // Acknowledge receipt immediately — processing happens asynchronously
    void this.processWebhook(body)
    return { received: true }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Async processing (intentionally not awaited in the handler above)
  // ─────────────────────────────────────────────────────────────────────────

  private async processWebhook(body: RecallWebhookPayload): Promise<void> {
    const { event, data } = body
    this.logger.log(`Recall webhook received: ${event}`)

    // ── Only process "done" events ─────────────────────────────────────────
    const isDone =
      event === 'bot.done' ||
      event === 'recording.done' ||
      (event === 'bot.status_change' && data?.status?.code === 'done')

    if (!isDone) return

    // ── Extract bot ID (differs between API versions) ──────────────────────
    const botId =
      data?.bot_id ??
      data?.bot?.id ??
      data?.recording?.bot_id

    if (!botId) {
      this.logger.warn('Recall webhook missing bot_id — skipping')
      return
    }

    // ── Find the booking linked to this bot ────────────────────────────────
    const booking = await this.prisma.db.booking.findFirst({
      where: { recallBotId: botId },
      include: { doctor: true },
    })

    if (!booking) {
      this.logger.warn(`No booking found for Recall bot ${botId}`)
      return
    }

    if (booking.summary) {
      this.logger.log(`Booking #${booking.id} already has a summary — skipping`)
      return
    }

    // ── Fetch transcript from Recall.ai ────────────────────────────────────
    const entries = await this.recall.getTranscript(botId)

    if (!entries || entries.length === 0) {
      this.logger.warn(`Empty transcript returned for bot ${botId}`)
      await this.prisma.db.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      })
      return
    }

    // ── Convert to plain text ──────────────────────────────────────────────
    const rawTranscript = this.recall.transcriptToText(entries)

    // ── Generate AI summary ────────────────────────────────────────────────
    this.logger.log(`Generating AI summary for booking #${booking.id}…`)
    const summary = await this.ai.summarizeTranscript(rawTranscript, {
      doctorName: booking.doctor.name,
      doctorSpecialization: booking.doctor.specialization,
      patientProblem: booking.problem,
    })

    // ── Persist to database ────────────────────────────────────────────────
    await this.prisma.db.booking.update({
      where: { id: booking.id },
      data: {
        transcript: rawTranscript,
        summary,
        status: 'COMPLETED',
      },
    })

    this.logger.log(`Summary saved for booking #${booking.id}`)
  }
}

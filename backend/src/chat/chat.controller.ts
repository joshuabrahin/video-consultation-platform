import { Controller, Post, Body, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ChatService, type ChatMessageDto, type ChatContextDto } from './chat.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// DTO
// ─────────────────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  messages: ChatMessageDto[]
  context?: ChatContextDto
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Split text into word-sized chunks to simulate streaming */
function tokenize(text: string): string[] {
  // Split on spaces but keep the space attached to the preceding word
  return text.match(/\S+\s*/g) ?? []
}

/** Async sleep */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat
   *
   * Accepts { messages, context } and returns a Server-Sent Events stream.
   * Each event: `data: {"delta":"<chunk>"}\n\n`
   * Final event: `data: [DONE]\n\n`
   */
  @Post()
  async chat(
    @Body() body: ChatRequestBody,
    @Res() res: Response,
  ): Promise<void> {
    const { messages = [], context } = body

    // ── Set SSE headers ────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // disable Nginx buffering
    res.flushHeaders()

    // ── Simulate 800–1400ms initial "thinking" delay ───────────────────────
    const thinkDelay = 800 + Math.random() * 600
    await sleep(thinkDelay)

    // ── Resolve response (real DB summary or mock fallback) ────────────────
    const responseText = await this.chatService.getResponse(messages, context)
    const tokens = tokenize(responseText)

    // ── Stream tokens one at a time ────────────────────────────────────────
    for (const token of tokens) {
      if (res.destroyed) break // client disconnected

      const payload = JSON.stringify({ delta: token })
      res.write(`data: ${payload}\n\n`)

      // Vary delay: punctuation pauses longer to feel more natural
      const isPunctuation = /[.!?,:;]/.test(token)
      const delay = isPunctuation
        ? 40 + Math.random() * 60   // 40–100ms after punctuation
        : 15 + Math.random() * 25   // 15–40ms for normal words
      await sleep(delay)
    }

    // ── End stream ─────────────────────────────────────────────────────────
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

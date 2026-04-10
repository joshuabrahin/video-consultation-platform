import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'

// ─────────────────────────────────────────────────────────────────────────────
// Context passed to the summarizer
// ─────────────────────────────────────────────────────────────────────────────

export interface SummaryContext {
  doctorName?: string
  doctorSpecialization?: string
  patientProblem?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  /**
   * Summarizes a telemedicine transcript using OpenAI.
   * Falls back to a basic algorithmic summary if OPENAI_API_KEY is not set.
   */
  async summarizeTranscript(rawTranscript: string, ctx: SummaryContext): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — using basic summary fallback')
      return this.basicSummary(rawTranscript, ctx)
    }

    try {
      const openai = new OpenAI({ apiKey })

      const contextBlock = [
        ctx.doctorName ? `Doctor: ${ctx.doctorName}` : '',
        ctx.doctorSpecialization ? `Specialty: ${ctx.doctorSpecialization}` : '',
        ctx.patientProblem ? `Patient's reported issue: ${ctx.patientProblem}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: `You are a professional medical scribe for The Right Hand telemedicine platform.
Create clear, structured consultation summaries that patients can easily understand.
Use markdown formatting: headers, bullet points, and bold for key terms.
Always include: Chief Complaint, Clinical Assessment, Treatment Plan, Medications (if any), Follow-up.
Be empathetic, accurate, and concise. Never add information not present in the transcript.`,
          },
          {
            role: 'user',
            content: `Summarize this telemedicine consultation for the patient's records.

${contextBlock}

TRANSCRIPT:
${rawTranscript}

Structure your summary with:
1. **Chief Complaint** — what the patient came in for
2. **Assessment** — doctor's findings
3. **Treatment Plan** — what was prescribed or recommended
4. **Medications** — dosage and instructions (if applicable)
5. **Follow-up** — next steps and when to seek urgent care`,
          },
        ],
      })

      const summary = completion.choices[0]?.message?.content
      if (!summary) throw new Error('Empty OpenAI response')

      this.logger.log('AI summary generated successfully')
      return summary
    } catch (err) {
      this.logger.error('OpenAI summarization failed', err)
      return this.basicSummary(rawTranscript, ctx)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fallback: basic summary without AI
  // ─────────────────────────────────────────────────────────────────────────

  private basicSummary(transcript: string, ctx: SummaryContext): string {
    const wordCount = transcript.split(/\s+/).length
    const estimatedMinutes = Math.round(wordCount / 130) // ~130 words/min speech
    const excerpt = transcript.slice(0, 600).trim()

    return [
      '## Consultation Summary',
      '',
      ctx.doctorName ? `**Doctor:** ${ctx.doctorName}` : '',
      ctx.doctorSpecialization ? `**Specialty:** ${ctx.doctorSpecialization}` : '',
      ctx.patientProblem ? `**Reported issue:** ${ctx.patientProblem}` : '',
      '',
      `**Meeting duration:** ~${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`,
      '',
      '**Transcript excerpt:**',
      '```',
      excerpt + (transcript.length > 600 ? '\n…(truncated)' : ''),
      '```',
      '',
      '> ⚠️ *Full AI summary is unavailable — OPENAI_API_KEY is not configured.*',
      '> *The complete transcript has been saved and will be summarized once the API key is added.*',
    ]
      .filter((line) => line !== null)
      .join('\n')
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface SummaryContext {
  doctorName?: string
  doctorSpecialization?: string
  patientProblem?: string
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  async summarizeTranscript(rawTranscript: string, ctx: SummaryContext): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — using basic summary fallback')
      return this.basicSummary(rawTranscript, ctx)
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const contextBlock = [
        ctx.doctorName           ? `Doctor: ${ctx.doctorName}` : '',
        ctx.doctorSpecialization ? `Specialty: ${ctx.doctorSpecialization}` : '',
        ctx.patientProblem       ? `Patient's reported issue: ${ctx.patientProblem}` : '',
      ].filter(Boolean).join('\n')

      const prompt = `You are a professional medical scribe for The Right Hand telemedicine platform.
Create a clear, structured consultation summary the patient can easily understand.
Use markdown: headers, bullet points, bold for key terms.
Never add information not present in the transcript.

${contextBlock}

TRANSCRIPT:
${rawTranscript}

Structure your summary with:
1. **Chief Complaint** — what the patient came in for
2. **Assessment** — doctor's findings
3. **Treatment Plan** — what was prescribed or recommended
4. **Medications** — dosage and instructions (if applicable)
5. **Follow-up** — next steps and when to seek urgent care`

      const result  = await model.generateContent(prompt)
      const summary = result.response.text()

      if (!summary) throw new Error('Empty Gemini response')
      this.logger.log('AI summary generated successfully via Gemini')
      return summary
    } catch (err) {
      this.logger.error('Gemini summarization failed', err)
      return this.basicSummary(rawTranscript, ctx)
    }
  }

  async chat(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return 'AI assistant is not configured yet.'

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
      })

      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const lastMessage = messages[messages.length - 1].content
      const chatSession = model.startChat({ history })
      const result      = await chatSession.sendMessage(lastMessage)
      return result.response.text()
    } catch (err) {
      this.logger.error('Gemini chat failed', err)
      return 'Sorry, I encountered an error. Please try again.'
    }
  }

  private basicSummary(transcript: string, ctx: SummaryContext): string {
    const wordCount        = transcript.split(/\s+/).length
    const estimatedMinutes = Math.round(wordCount / 130)
    const excerpt          = transcript.slice(0, 600).trim()

    return [
      '## Consultation Summary',
      '',
      ctx.doctorName           ? `**Doctor:** ${ctx.doctorName}` : '',
      ctx.doctorSpecialization ? `**Specialty:** ${ctx.doctorSpecialization}` : '',
      ctx.patientProblem       ? `**Reported issue:** ${ctx.patientProblem}` : '',
      '',
      `**Meeting duration:** ~${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`,
      '',
      '**Transcript excerpt:**',
      '```',
      excerpt + (transcript.length > 600 ? '\n…(truncated)' : ''),
      '```',
    ].filter(Boolean).join('\n')
  }
}

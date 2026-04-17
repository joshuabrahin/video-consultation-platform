import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common'
import { google } from 'googleapis'

export interface CreateMeetingParams {
  start: Date
  doctorName: string
  doctorEmail?: string
  patientName: string
  patientEmail: string
  problem: string
}

export interface MeetingResult {
  meetLink: string
  calendarEventId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback: generate a random Meet-style link when Google Calendar is not
// configured (dev / demo mode). Real links require credentials in .env.
// ─────────────────────────────────────────────────────────────────────────────
function fakeMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name)

  // ─────────────────────────────────────────────────────────────────────────
  // Public method: does two things in one call:
  //   1. freebusy check — throws ConflictException if slot is taken
  //   2. creates the calendar event with a real Google Meet link
  //      Falls back to a generated link when credentials are absent.
  // ─────────────────────────────────────────────────────────────────────────

  async createMeetingEvent(params: CreateMeetingParams): Promise<MeetingResult> {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

    // ── No credentials → skip Calendar entirely, return fallback link ──────
    if (
      !clientEmail ||
      !privateKey ||
      clientEmail.includes('your-service-account') ||
      privateKey.includes('YOUR_PRIVATE_KEY')
    ) {
      this.logger.warn('Google Calendar not configured — using generated Meet link (demo mode)')
      return { meetLink: fakeMeetLink() }
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      // Full calendar scope: needed for both freebusy AND event creation
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    const calendar = google.calendar({ version: 'v3', auth })
    const end = new Date(params.start.getTime() + 30 * 60 * 1000)

    // ── Step 1: freebusy check ─────────────────────────────────────────────
    try {
      const fbRes = await calendar.freebusy.query({
        requestBody: {
          timeMin: params.start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: calendarId }],
        },
      })
      const busy = fbRes.data.calendars?.[calendarId]?.busy ?? []
      if (busy.length > 0) {
        throw new ConflictException('This time slot is already booked on the calendar')
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err
      this.logger.error('freebusy check failed', err)
      throw new InternalServerErrorException('Could not verify slot availability')
    }

    // ── Step 2: create event with Google Meet link ─────────────────────────
    const attendees: { email: string; displayName?: string }[] = [
      { email: params.patientEmail, displayName: params.patientName },
    ]
    if (params.doctorEmail) {
      attendees.push({ email: params.doctorEmail, displayName: params.doctorName })
    }

    try {
      const eventRes = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1, // required to generate Meet link
        sendUpdates: 'all',        // sends email invites to all attendees
        requestBody: {
          summary: `Video Consultation — ${params.patientName} with ${params.doctorName}`,
          description: `Patient concern: ${params.problem}`,
          start: { dateTime: params.start.toISOString() },
          end:   { dateTime: end.toISOString() },
          attendees,
          conferenceData: {
            createRequest: {
              // requestId must be unique per request
              requestId: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 },   // 1-hour email reminder
              { method: 'popup', minutes: 15 },   // 15-min popup reminder
            ],
          },
        },
      })

      const meetLink = eventRes.data.hangoutLink
      const eventId = eventRes.data.id ?? undefined

      if (!meetLink) {
        this.logger.warn('Google Calendar did not return a Meet link — using fallback')
        return { meetLink: fakeMeetLink(), calendarEventId: eventId }
      }

      this.logger.log(`Google Meet created: ${meetLink} (event: ${eventId})`)
      return { meetLink, calendarEventId: eventId }
    } catch (err) {
      this.logger.error('Failed to create Google Calendar event', err)
      this.logger.warn('Falling back to generated Meet link')
      return { meetLink: fakeMeetLink() }
    }
  }
}

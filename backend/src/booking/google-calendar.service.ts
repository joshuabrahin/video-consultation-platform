import { Injectable, ConflictException, Logger } from '@nestjs/common'
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

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name)

  // ── Slot availability from real Google Calendar ──────────────────────────────

  async getAvailability(
    calendarEmail: string,
    date: string,
  ): Promise<{ startTime: string; available: boolean }[]> {
    const slots = buildDaySlots(date)

    const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      return slots.map((s) => ({ startTime: s.startTime, available: true }))
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    let busy: { start?: string | null; end?: string | null }[] = []
    try {
      const fbRes = await calendar.freebusy.query({
        requestBody: {
          timeMin: slots[0].start.toISOString(),
          timeMax: slots[slots.length - 1].end.toISOString(),
          items: [{ id: calendarEmail }],
        },
      })
      busy = fbRes.data.calendars?.[calendarEmail]?.busy ?? []
    } catch {
      this.logger.warn('freebusy availability check failed — returning all slots as free')
      return slots.map((s) => ({ startTime: s.startTime, available: true }))
    }

    return slots.map((s) => {
      const isbusy = busy.some((b) => {
        const bStart = new Date(b.start!).getTime()
        const bEnd   = new Date(b.end!).getTime()
        return bStart < s.end.getTime() && bEnd > s.start.getTime()
      })
      return { startTime: s.startTime, available: !isbusy }
    })
  }

  // ── Busy intervals from the real booking calendar (GOOGLE_CALENDAR_ID) ───────

  async getBusyIntervals(date: string): Promise<{ start: Date; end: Date }[]> {
    const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    const calendarId   = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

    if (!clientId || !clientSecret || !refreshToken) return []

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const slots  = buildDaySlots(date)
    const timeMin = slots[0].start.toISOString()
    const timeMax = slots[slots.length - 1].end.toISOString()

    try {
      const fbRes = await calendar.freebusy.query({
        requestBody: { timeMin, timeMax, items: [{ id: calendarId }] },
      })
      return (fbRes.data.calendars?.[calendarId]?.busy ?? []).map((b) => ({
        start: new Date(b.start!),
        end:   new Date(b.end!),
      }))
    } catch {
      this.logger.warn('getBusyIntervals failed — returning empty')
      return []
    }
  }

  // ── Create meeting event ──────────────────────────────────────────────────────

  async createMeetingEvent(params: CreateMeetingParams): Promise<MeetingResult> {
    const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    const calendarId   = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn('Google OAuth not configured — cannot create Meet link')
      throw new Error('Google Calendar credentials not configured')
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    )

    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const end = new Date(params.start.getTime() + 30 * 60 * 1000)

    // ── freebusy check ────────────────────────────────────────────────────────
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
      this.logger.warn('freebusy check skipped')
    }

    // ── create event with real Google Meet link ───────────────────────────────
    const attendees: { email: string; displayName?: string }[] = [
      { email: params.patientEmail, displayName: params.patientName },
    ]
    if (params.doctorEmail) {
      attendees.push({ email: params.doctorEmail, displayName: params.doctorName })
    }

    const eventRes = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary:     `Video Consultation — ${params.patientName} with ${params.doctorName}`,
        description: `Patient concern: ${params.problem}`,
        start: { dateTime: params.start.toISOString() },
        end:   { dateTime: end.toISOString() },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      },
    })

    const meetLink = eventRes.data.hangoutLink
    const eventId  = eventRes.data.id ?? undefined

    if (!meetLink) {
      this.logger.error('No Meet link returned: ' + JSON.stringify(eventRes.data))
      throw new Error('Google Calendar did not return a Meet link')
    }

    this.logger.log(`Google Meet created: ${meetLink} (event: ${eventId})`)
    return { meetLink, calendarEventId: eventId }
  }
}

// ── Helper: generate 30-min slots 9:00 AM – 5:30 PM for a given date ─────────

function buildDaySlots(date: string): { startTime: string; start: Date; end: Date }[] {
  const [year, month, day] = date.split('-').map(Number)
  const slots: { startTime: string; start: Date; end: Date }[] = []

  for (let m = 9 * 60; m < 17 * 60 + 30; m += 30) {
    const h    = Math.floor(m / 60)
    const min  = m % 60
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12  = h % 12 === 0 ? 12 : h % 12
    const startTime = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`
    slots.push({
      startTime,
      start: new Date(year, month - 1, day, h, min),
      end:   new Date(year, month - 1, day, h, min + 30),
    })
  }

  return slots
}

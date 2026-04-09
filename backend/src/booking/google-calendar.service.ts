import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common'
import { google } from 'googleapis'

// Google Calendar uses OAuth 2.0 authentication — NOT app passwords.
// A Service Account is used for backend access. The Service Account JSON key file
// contains client_email and private_key, which are stored securely in environment
// variables. The server signs OAuth 2.0 tokens using these credentials automatically,
// with no manual login required.

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name)

  async checkAvailability(start: Date): Promise<void> {
    // These match the exact field names from the Google Service Account JSON key file
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const calendarId = process.env.GOOGLE_CALENDAR_ID

    if (!clientEmail || !privateKey || !calendarId) {
      this.logger.warn('Google Calendar check skipped — Service Account credentials not configured')
      return
    }

    // OAuth 2.0 via Service Account — signs tokens using client_email + private_key
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    })

    const calendar = google.calendar({ version: 'v3', auth })

    const timeMin = start.toISOString()
    const timeMax = new Date(start.getTime() + 30 * 60 * 1000).toISOString()

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: calendarId }],
        },
      })

      const busy = response.data.calendars?.[calendarId]?.busy ?? []
      if (busy.length > 0) {
        throw new ConflictException(
          'This time slot is not available on the scheduling calendar',
        )
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err
      this.logger.error('Google Calendar freebusy.query failed', err)
      throw new InternalServerErrorException('Google Calendar availability check failed')
    }
  }
}

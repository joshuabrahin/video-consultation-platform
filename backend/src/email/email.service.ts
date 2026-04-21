import { Injectable, Logger } from '@nestjs/common'
import nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  private createTransport() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GOOGLE_CALENDAR_ID,
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    })
  }

  async sendDoctorBookingNotification(opts: {
    doctorEmail: string
    doctorName: string
    patientName: string
    patientEmail: string
    date: Date
    meetLink: string
    problem: string
  }) {
    const transport = this.createTransport()

    const dateStr = opts.date.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const timeStr = opts.date.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    })

    try {
      await transport.sendMail({
        from: `"The Right Hand Clinic" <${process.env.GOOGLE_CALENDAR_ID}>`,
        to: opts.doctorEmail,
        subject: `New Video Consultation — ${opts.patientName} on ${dateStr}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">New Consultation Booked</h2>
            <p>Dear <strong>${opts.doctorName}</strong>,</p>
            <p>A new video consultation has been scheduled with you.</p>

            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; color: #666;">Patient</td><td style="padding: 8px; font-weight: bold;">${opts.patientName}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding: 8px; color: #666;">Patient Email</td><td style="padding: 8px;">${opts.patientEmail}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; font-weight: bold;">${dateStr}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; font-weight: bold;">${timeStr}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Reason</td><td style="padding: 8px;">${opts.problem}</td></tr>
            </table>

            <a href="${opts.meetLink}" style="display:inline-block; background:#0d9488; color:white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Join Google Meet
            </a>

            <p style="margin-top: 24px; color: #999; font-size: 12px;">
              The Right Hand Virtual Clinic
            </p>
          </div>
        `,
      })
      this.logger.log(`Booking notification sent to ${opts.doctorEmail}`)
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.doctorEmail}`, err)
    }
  }
}

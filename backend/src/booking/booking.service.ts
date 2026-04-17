import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { GoogleCalendarService } from './google-calendar.service.js'
import { RecallService } from '../recall/recall.service.js'
import { VideoConsultationDto } from './dto/create-booking.dto.js'

export { VideoConsultationDto }

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly recall: RecallService,
  ) {}

  async createVideoConsultation(dto: VideoConsultationDto) {
    const startDate = new Date(dto.start)

    // 1. Verify doctor exists
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id: dto.doctor.id },
    })
    if (!doctor) throw new NotFoundException('Doctor not found')

    // 2. Google Calendar: freebusy check + create real event with Meet link
    //    Falls back to a generated link when credentials are not configured.
    const { meetLink, calendarEventId } = await this.googleCalendar.createMeetingEvent({
      start: startDate,
      doctorName: doctor.name,
      doctorEmail: dto.doctor.calendarEmail,
      patientName: dto.patient.name,
      patientEmail: dto.patient.email,
      problem: dto.patient.problem,
    })

    // 3. Transaction: DB-level 30-minute overlap check + atomic insert
    const booking = await this.prisma.db.$transaction(async (tx) => {
      const windowStart = new Date(startDate.getTime() - 29 * 60 * 1000)
      const windowEnd   = new Date(startDate.getTime() + 29 * 60 * 1000)

      const conflict = await tx.booking.findFirst({
        where: {
          doctorId: dto.doctor.id,
          date: { gte: windowStart, lte: windowEnd },
          status: { not: 'CANCELLED' },
        },
      })

      if (conflict) {
        throw new ConflictException(
          'This doctor already has a booking within 30 minutes of the requested slot.',
        )
      }

      return tx.booking.create({
        data: {
          name:         dto.patient.name,
          patientEmail: dto.patient.email,
          problem:      dto.patient.problem,
          prescription: dto.patient.prescription ?? null,
          date:         startDate,
          meetLink,
          doctorId:     dto.doctor.id,
          // userId is optional — no login required
        },
        include: { doctor: true },
      })
    })

    // 4. Re-fetch with doctor relation (Prisma $transaction doesn't infer includes)
    const bookingFull = await this.prisma.db.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { doctor: true },
    })

    // 5. Schedule Recall.ai bot (skipped gracefully when key is absent)
    const botId = await this.recall.scheduleBot(bookingFull.meetLink, startDate, bookingFull.id)
    if (botId) {
      await this.prisma.db.booking.update({
        where: { id: bookingFull.id },
        data: { recallBotId: botId },
      })
    }

    return {
      id:              bookingFull.id,
      meetLink:        bookingFull.meetLink,
      calendarEventId: calendarEventId ?? null,
      date:            bookingFull.date,
      doctor:          bookingFull.doctor,
      patientName:     bookingFull.name,
      patientEmail:    bookingFull.patientEmail,
      status:          bookingFull.status,
    }
  }

  // Fetch all bookings for a patient by their email (no auth required)
  async findByEmail(email: string) {
    return this.prisma.db.booking.findMany({
      where: { patientEmail: email },
      include: { doctor: true },
      orderBy: { date: 'asc' },
    })
  }

  async findWithSummary(bookingId: string) {
    return this.prisma.db.booking.findUnique({
      where: { id: bookingId },
      include: { doctor: true },
    })
  }
}

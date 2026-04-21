import { Injectable, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { GoogleCalendarService } from './google-calendar.service.js'
import { RecallService } from '../recall/recall.service.js'
import { EmailService } from '../email/email.service.js'
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
    private readonly email: EmailService,
  ) {}

  async createVideoConsultation(dto: VideoConsultationDto) {
    const startDate = new Date(dto.start)

    // 1. Verify doctor exists
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id: dto.doctor.id },
    })
    if (!doctor) throw new NotFoundException('Doctor not found')

    // 2. Google Calendar: freebusy check + create real event with Meet link
    let meetLink: string
    let calendarEventId: string | undefined
    try {
      const result = await this.googleCalendar.createMeetingEvent({
        start: startDate,
        doctorName: doctor.name,
        doctorEmail: dto.doctor.calendarEmail,
        patientName: dto.patient.name,
        patientEmail: dto.patient.email,
        problem: dto.patient.problem,
      })
      meetLink        = result.meetLink
      calendarEventId = result.calendarEventId
    } catch (err: any) {
      if (err?.code === 'ENOTFOUND' || err?.cause?.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException(
          'Cannot reach Google Calendar — please check your internet connection and try again.',
        )
      }
      throw err
    }

    // 3. Transaction: exact-slot conflict check + atomic insert
    const booking = await this.prisma.db.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          doctorId: dto.doctor.id,
          date: startDate,
          status: { not: 'CANCELLED' },
        },
      })

      if (conflict) {
        throw new ConflictException('This slot has already been booked.')
      }

      // Mark matching slot as booked
      await tx.slot.updateMany({
        where: { doctorId: dto.doctor.id, startAt: startDate },
        data:  { isBooked: true },
      })

      return tx.booking.create({
        data: {
          name:         dto.patient.name,
          patientEmail: dto.patient.email,
          problem:      dto.patient.problem,
          prescription: dto.patient.prescription ?? null,
          date:         startDate,
          meetLink,
          doctorId:     dto.doctor.id,
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

    // 6. Email the doctor with the Meet link
    await this.email.sendDoctorBookingNotification({
      doctorEmail:  bookingFull.doctor.calendarEmail ?? '',
      doctorName:   bookingFull.doctor.name,
      patientName:  bookingFull.name,
      patientEmail: bookingFull.patientEmail,
      date:         bookingFull.date,
      meetLink:     bookingFull.meetLink,
      problem:      bookingFull.problem,
    })

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

  async cancelBooking(bookingId: string) {
    const booking = await this.prisma.db.booking.findUnique({
      where: { id: bookingId },
    })
    if (!booking) throw new NotFoundException('Booking not found')

    await this.prisma.db.$transaction([
      this.prisma.db.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.db.slot.updateMany({
        where: { doctorId: booking.doctorId, startAt: booking.date },
        data: { isBooked: false },
      }),
    ])

    return { success: true }
  }

  async getBookedSlots(doctorId: string): Promise<string[]> {
    const bookings = await this.prisma.db.booking.findMany({
      where: { doctorId, status: { not: 'CANCELLED' } },
      select: { date: true },
    })
    return bookings.map((b) => b.date.toISOString())
  }
}

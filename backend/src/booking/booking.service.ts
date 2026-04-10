import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { GoogleCalendarService } from './google-calendar.service.js'
import { RecallService } from '../recall/recall.service.js'

export interface VideoConsultationDto {
  doctor: { id: number }
  patient: { name: string; problem: string; prescription?: string }
  start: string
}

function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`
}

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly recall: RecallService,
  ) {}

  async createVideoConsultation(dto: VideoConsultationDto, userId: number) {
    const startDate = new Date(dto.start)

    // 1. Verify doctor exists
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id: dto.doctor.id },
    })
    if (!doctor) throw new NotFoundException('Doctor not found')

    // 2. Google Calendar freebusy check via Service Account
    await this.googleCalendar.checkAvailability(startDate)

    // 3. Transaction: 30-minute window overlap check + atomic insert
    const booking = await this.prisma.db.$transaction(async (tx) => {
      const windowStart = new Date(startDate.getTime() - 29 * 60 * 1000)
      const windowEnd = new Date(startDate.getTime() + 29 * 60 * 1000)

      const conflict = await tx.booking.findFirst({
        where: {
          doctorId: dto.doctor.id,
          date: { gte: windowStart, lte: windowEnd },
        },
      })

      if (conflict) {
        throw new ConflictException(
          'This doctor already has a booking within 30 minutes of the requested slot.',
        )
      }

      const meetLink = generateMeetLink()

      return tx.booking.create({
        data: {
          name: dto.patient.name,
          problem: dto.patient.problem,
          prescription: dto.patient.prescription ?? null,
          date: startDate,
          meetLink,
          userId,
          doctorId: dto.doctor.id,
        },
      })
    })

    // 4. Schedule Recall.ai bot to join the meeting at the start time
    //    This runs outside the transaction — bot failure should not roll back the booking.
    const botId = await this.recall.scheduleBot(booking.meetLink, startDate, booking.id)

    if (botId) {
      await this.prisma.db.booking.update({
        where: { id: booking.id },
        data: { recallBotId: botId },
      })
      return { ...booking, recallBotId: botId }
    }

    return booking
  }

  async findByUser(userId: number) {
    return this.prisma.db.booking.findMany({
      where: { userId },
      include: { doctor: true },
      orderBy: { date: 'desc' },
    })
  }

  /** Returns a single booking with its summary (used by the chat service). */
  async findWithSummary(bookingId: number) {
    return this.prisma.db.booking.findUnique({
      where: { id: bookingId },
      include: { doctor: true },
    })
  }
}

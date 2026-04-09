import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { GoogleCalendarService } from './google-calendar.service.js'

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
  ) {}

  async createVideoConsultation(dto: VideoConsultationDto, userId: number) {
    const startDate = new Date(dto.start)

    // 1. Verify doctor exists
    const doctor = await this.prisma.db.doctor.findUnique({
      where: { id: dto.doctor.id },
    })
    if (!doctor) throw new NotFoundException('Doctor not found')

    // 2. Google Service Account — freebusy.query on platform's primary scheduling calendar
    await this.googleCalendar.checkAvailability(startDate)

    // 3. Transaction: 30-minute window overlap check + atomic insert
    return this.prisma.db.$transaction(async (tx) => {
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
  }

  async findByUser(userId: number) {
    return this.prisma.db.booking.findMany({
      where: { userId },
      include: { doctor: true },
    })
  }
}

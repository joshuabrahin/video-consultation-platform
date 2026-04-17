import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { GoogleCalendarService } from '../booking/google-calendar.service.js'
import { CreateDoctorDto } from './dto/create-doctor.dto.js'

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async create(dto: CreateDoctorDto) {
    return this.prisma.db.doctor.create({ data: dto })
  }

  async findAll() {
    return this.prisma.db.doctor.findMany({
      include: { hospital: true },
      orderBy: { name: 'asc' },
    })
  }

  async findByHospital(hospitalId: string) {
    return this.prisma.db.doctor.findMany({
      where: { hospitalId },
      include: { hospital: true },
      orderBy: { name: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.db.doctor.findUnique({ where: { id } })
  }

  async getSlotsForDate(doctorId: string, date: string) {
    const [year, month, day] = date.split('-').map(Number)
    const dayStart = new Date(year, month - 1, day, 0, 0, 0)
    const dayEnd   = new Date(year, month - 1, day, 23, 59, 59)

    // For today, only show slots that haven't started yet (add 5-min buffer)
    const now        = new Date()
    const isToday    = dayStart.toDateString() === now.toDateString()
    const earliest   = isToday ? new Date(now.getTime() + 5 * 60 * 1000) : dayStart

    const [dbSlots, busyIntervals] = await Promise.all([
      this.prisma.db.slot.findMany({
        where: { doctorId, startAt: { gte: earliest, lte: dayEnd } },
        orderBy: { startAt: 'asc' },
        select: { id: true, startAt: true, endAt: true, isBooked: true },
      }),
      this.googleCalendar.getBusyIntervals(date),
    ])

    return dbSlots.map((slot) => {
      const calendarBusy = busyIntervals.some(
        (b) => b.start.getTime() < slot.endAt.getTime() && b.end.getTime() > slot.startAt.getTime(),
      )
      return { ...slot, isBooked: slot.isBooked || calendarBusy }
    })
  }
}

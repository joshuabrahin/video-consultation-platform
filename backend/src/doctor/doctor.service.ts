import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateDoctorDto } from './dto/create-doctor.dto.js'

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

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

    const now      = new Date()
    const isToday  = dayStart.toDateString() === now.toDateString()
    const earliest = isToday ? new Date(now.getTime() + 5 * 60 * 1000) : dayStart

    const [dbSlots, existingBookings] = await Promise.all([
      this.prisma.db.slot.findMany({
        where: { doctorId, startAt: { gte: earliest, lte: dayEnd } },
        orderBy: { startAt: 'asc' },
        select: { id: true, startAt: true, endAt: true, isBooked: true },
      }),
      this.prisma.db.booking.findMany({
        where: { doctorId, date: { gte: earliest, lte: dayEnd }, status: { not: 'CANCELLED' } },
        select: { date: true },
      }),
    ])

    const bookedTimes = new Set(existingBookings.map((b) => b.date.getTime()))

    return dbSlots.map((slot) => ({
      ...slot,
      isBooked: slot.isBooked || bookedTimes.has(slot.startAt.getTime()),
    }))
  }
}

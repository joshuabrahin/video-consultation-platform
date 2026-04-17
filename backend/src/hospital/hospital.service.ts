import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class HospitalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; location: string }) {
    return this.prisma.db.hospital.create({ data })
  }

  async findAll() {
    return this.prisma.db.hospital.findMany({
      include: {
        doctors: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
  }
}

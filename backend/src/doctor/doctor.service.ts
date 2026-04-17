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
}

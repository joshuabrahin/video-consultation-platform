import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; specialization: string; hospitalId: number }) {
    return this.prisma.db.doctor.create({ data })
  }

  async findByHospital(hospitalId: number) {
    return this.prisma.db.doctor.findMany({ where: { hospitalId } })
  }
}

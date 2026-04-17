import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { DoctorService } from './doctor.service.js'
import { CreateDoctorDto } from './dto/create-doctor.dto.js'

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.create(dto)
  }

  @Get()
  findAll() {
    return this.doctorService.findAll()
  }

  @Get('hospital/:hospitalId')
  findByHospital(@Param('hospitalId') hospitalId: string) {
    return this.doctorService.findByHospital(hospitalId)
  }
}

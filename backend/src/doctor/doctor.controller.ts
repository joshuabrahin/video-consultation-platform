import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common'
import { DoctorService } from './doctor.service.js'

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Body() body: { name: string; specialization: string; hospitalId: number }) {
    return this.doctorService.create(body)
  }

  @Get('hospital/:hospitalId')
  findByHospital(@Param('hospitalId', ParseIntPipe) hospitalId: number) {
    return this.doctorService.findByHospital(hospitalId)
  }
}

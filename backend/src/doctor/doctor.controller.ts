import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common'
import { DoctorService } from './doctor.service.js'
import { CreateDoctorDto } from './dto/create-doctor.dto.js'

@Controller('doctors')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
  ) {}

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

  // Returns slots from DB for a specific date
  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param required (YYYY-MM-DD)')
    }
    return this.doctorService.getSlotsForDate(id, date)
  }

}

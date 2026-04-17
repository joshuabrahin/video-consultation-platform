import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common'
import { DoctorService } from './doctor.service.js'
import { GoogleCalendarService } from '../booking/google-calendar.service.js'
import { CreateDoctorDto } from './dto/create-doctor.dto.js'

@Controller('doctors')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly googleCalendar: GoogleCalendarService,
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

  // Returns slot availability based on doctor's real Google Calendar
  @Get(':id/availability')
  async getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param required (YYYY-MM-DD)')
    }
    const doctor = await this.doctorService.findById(id)
    if (!doctor?.calendarEmail) return []
    return this.googleCalendar.getAvailability(doctor.calendarEmail, date)
  }
}

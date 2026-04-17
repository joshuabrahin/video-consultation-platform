import { Module } from '@nestjs/common'
import { DoctorService } from './doctor.service.js'
import { DoctorController } from './doctor.controller.js'
import { GoogleCalendarService } from '../booking/google-calendar.service.js'

@Module({
  controllers: [DoctorController],
  providers: [DoctorService, GoogleCalendarService],
})
export class DoctorModule {}

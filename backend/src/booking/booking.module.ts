import { Module } from '@nestjs/common'
import { BookingService } from './booking.service.js'
import { BookingController } from './booking.controller.js'
import { GoogleCalendarService } from './google-calendar.service.js'

@Module({
  controllers: [BookingController],
  providers: [BookingService, GoogleCalendarService],
})
export class BookingModule {}

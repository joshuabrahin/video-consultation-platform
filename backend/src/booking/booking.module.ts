import { Module } from '@nestjs/common'
import { BookingService } from './booking.service.js'
import { BookingController } from './booking.controller.js'
import { GoogleCalendarService } from './google-calendar.service.js'
import { RecallModule } from '../recall/recall.module.js'

@Module({
  imports: [RecallModule],
  controllers: [BookingController],
  providers: [BookingService, GoogleCalendarService],
  exports: [BookingService],
})
export class BookingModule {}

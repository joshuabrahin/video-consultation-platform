import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { BookingService } from './booking.service.js'
import type { VideoConsultationDto } from './booking.service.js'

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // No auth required — open booking endpoint
  @Post('video-consultation')
  createVideoConsultation(@Body() body: VideoConsultationDto) {
    return this.bookingService.createVideoConsultation(body)
  }

  // Look up bookings by patient email (used by UpcomingConsultations on home screen)
  @Get('by-email')
  findByEmail(@Query('email') email: string) {
    if (!email) return []
    return this.bookingService.findByEmail(email)
  }
}

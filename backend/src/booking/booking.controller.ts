import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common'
import { BookingService } from './booking.service.js'
import { VideoConsultationDto } from './dto/create-booking.dto.js'

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // No auth required — open booking endpoint
  @Post('video-consultation')
  createVideoConsultation(@Body() dto: VideoConsultationDto) {
    return this.bookingService.createVideoConsultation(dto)
  }

  // Look up bookings by patient email (used by UpcomingConsultations on home screen)
  @Get('by-email')
  findByEmail(@Query('email') email: string) {
    if (!email) return []
    return this.bookingService.findByEmail(email)
  }

  // Returns ISO datetime strings of booked slots for a doctor (for slot availability display)
  @Get('booked-slots/:doctorId')
  getBookedSlots(@Param('doctorId') doctorId: string) {
    return this.bookingService.getBookedSlots(doctorId)
  }
}

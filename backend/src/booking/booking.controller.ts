import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common'
import type { Request } from 'express'
import { BookingService } from './booking.service.js'
import type { VideoConsultationDto } from './booking.service.js'
import { JwtAuthGuard } from '../auth/jwt.guard.js'

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('video-consultation')
  createVideoConsultation(@Body() body: VideoConsultationDto, @Req() req: Request) {
    const userId = (req as any).user.sub as number
    return this.bookingService.createVideoConsultation(body, userId)
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.bookingService.findByUser(userId)
  }
}

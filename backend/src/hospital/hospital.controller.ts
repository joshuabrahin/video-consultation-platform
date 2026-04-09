import { Controller, Get, Post, Body } from '@nestjs/common'
import { HospitalService } from './hospital.service.js'

@Controller('hospitals')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  create(@Body() body: { name: string; location: string }) {
    return this.hospitalService.create(body)
  }

  @Get()
  findAll() {
    return this.hospitalService.findAll()
  }
}

import { Module } from '@nestjs/common'
import { HospitalService } from './hospital.service.js'
import { HospitalController } from './hospital.controller.js'

@Module({
  controllers: [HospitalController],
  providers: [HospitalService],
})
export class HospitalModule {}

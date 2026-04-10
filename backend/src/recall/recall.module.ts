import { Module } from '@nestjs/common'
import { RecallService } from './recall.service.js'

@Module({
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}

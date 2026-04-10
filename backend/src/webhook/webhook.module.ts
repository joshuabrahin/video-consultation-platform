import { Module } from '@nestjs/common'
import { WebhookController } from './webhook.controller.js'
import { RecallModule } from '../recall/recall.module.js'
import { AiModule } from '../ai/ai.module.js'

@Module({
  imports: [RecallModule, AiModule],
  controllers: [WebhookController],
})
export class WebhookModule {}

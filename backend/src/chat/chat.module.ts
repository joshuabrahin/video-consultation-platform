import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller.js'
import { ChatService } from './chat.service.js'
import { AiService } from '../ai/ai.service.js'

@Module({
  controllers: [ChatController],
  providers: [ChatService, AiService],
})
export class ChatModule {}

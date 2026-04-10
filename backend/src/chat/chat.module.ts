import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller.js'
import { ChatService } from './chat.service.js'

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  // PrismaModule is global — no need to import it explicitly
})
export class ChatModule {}

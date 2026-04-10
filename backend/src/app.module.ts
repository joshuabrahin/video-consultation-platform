import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { HospitalModule } from './hospital/hospital.module.js'
import { DoctorModule } from './doctor/doctor.module.js'
import { BookingModule } from './booking/booking.module.js'
import { AuthModule } from './auth/auth.module.js'
import { ChatModule } from './chat/chat.module.js'
import { WebhookModule } from './webhook/webhook.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HospitalModule,
    DoctorModule,
    BookingModule,
    AuthModule,
    ChatModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

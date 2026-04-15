import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Validate all incoming request bodies against DTO class decorators.
  // whitelist: strips properties not declared in the DTO (prevents extra-field injection).
  // forbidNonWhitelisted: returns 400 instead of silently stripping unknown fields.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // auto-convert plain objects to class instances
    }),
  )

  // Enable CORS for the frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  logger.log(`Server running on http://localhost:${port}`)
}

bootstrap()

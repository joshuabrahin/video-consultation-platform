import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

// Prisma v7 uses driver adapters for runtime DB connections.
// The DATABASE_URL is read from env and passed to PrismaPg adapter.
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  readonly db: PrismaClient

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const adapter = new PrismaPg({ connectionString })
    this.db = new PrismaClient({ adapter })
  }

  async onModuleInit() {
    await this.db.$connect()
    this.logger.log('Database connected')
  }

  async onModuleDestroy() {
    await this.db.$disconnect()
    this.logger.log('Database disconnected')
  }
}

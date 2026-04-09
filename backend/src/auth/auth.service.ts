import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    const existing = await this.prisma.db.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new ConflictException('Email already in use')
    }

    const hashed = await bcrypt.hash(data.password, 10)
    const user = await this.prisma.db.user.create({
      data: { name: data.name, email: data.email, password: hashed },
    })

    return { message: 'User registered successfully', userId: user.id }
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.db.user.findUnique({ where: { email: data.email } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = { sub: user.id, email: user.email }
    const token = await this.jwtService.signAsync(payload)

    return { access_token: token }
  }
}

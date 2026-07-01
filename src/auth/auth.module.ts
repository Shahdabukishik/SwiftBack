// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './services/sms.service';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { StringValue } from 'ms';

@Module({
  imports: [PrismaModule,


    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
      }),
    }),],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SmsService, ResetPasswordGuard],
})
export class AuthModule { }

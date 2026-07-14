import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './services/sms.service';
import { OtpPurpose, OtpStatus } from '@prisma/client';
import { PointsEngineService } from '../points-engine/points-engine.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EditAccountDto } from './dto/edit-account.dto';
import { JwtPurposePayload } from './guards/jwt-purpose.guard';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async sendOtp(dto: SendOtpDto, reqUser: any = null, ipAddress: string | null = null) {
  
    const { phone, purpose } = dto;
    const user = await this.prisma.user.findUnique({ where: { phone } });

    // 1. Validation
    switch (purpose) {
      case OtpPurpose.REGISTER:
        if (user && user.isVerified) {
          throw new ConflictException('Phone number already registered and verified');
        }
        break;

      case OtpPurpose.RESET_PASSWORD:
        if (!user) {
          throw new NotFoundException('User not found');
        }
        break;

      case OtpPurpose.CHANGE_PHONE:
        if (!reqUser || !reqUser.userId) {
          throw new UnauthorizedException('Authentication required to change phone');
        }
        if (user) {
          throw new ConflictException('Phone number already in use');
        }
        break;
    }

    // 2. Rate Limit Check (Dual Evaluation)
    const latestPhoneOtp = await this.prisma.otp.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: 'desc' },
    });

    const latestIpOtp = ipAddress ? await this.prisma.otp.findFirst({
      where: { ipAddress, purpose },
      orderBy: { createdAt: 'desc' },
    }) : null;

    // Explicit block check
    if (latestPhoneOtp?.blockedUntil && latestPhoneOtp.blockedUntil > new Date()) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (latestIpOtp?.blockedUntil && latestIpOtp.blockedUntil > new Date()) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Calculate next state for Phone
    let phoneLevel = latestPhoneOtp?.rateLimitLevel || 1;
    let phoneCount = (latestPhoneOtp?.requestCount || 0) + 1;
    let phoneBlockedUntil: Date | null = null;
    let phoneShouldBlock = false;

    if (phoneLevel === 1 && phoneCount > 2) {
      phoneShouldBlock = true; phoneLevel = 2; phoneBlockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    } else if (phoneLevel === 2 && phoneCount > 1) {
      phoneShouldBlock = true; phoneLevel = 3; phoneBlockedUntil = new Date(Date.now() + 60 * 60 * 1000);
    } else if (phoneLevel === 3 && phoneCount > 1) {
      phoneShouldBlock = true; phoneBlockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Calculate next state for IP
    let ipLevel = latestIpOtp?.rateLimitLevel || 1;
    let ipCount = (latestIpOtp?.requestCount || 0) + 1;
    let ipBlockedUntil: Date | null = null;
    let ipShouldBlock = false;

    if (ipLevel === 1 && ipCount > 2) {
      ipShouldBlock = true; ipLevel = 2; ipBlockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    } else if (ipLevel === 2 && ipCount > 1) {
      ipShouldBlock = true; ipLevel = 3; ipBlockedUntil = new Date(Date.now() + 60 * 60 * 1000);
    } else if (ipLevel === 3 && ipCount > 1) {
      ipShouldBlock = true; ipBlockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Handle Blocking Event
    if (phoneShouldBlock || ipShouldBlock) {
      // Overwrite the existing records with the blocked state so subsequent requests see it
      if (phoneShouldBlock && latestPhoneOtp) {
        await this.prisma.otp.update({
          where: { id: latestPhoneOtp.id },
          data: { rateLimitLevel: phoneLevel, blockedUntil: phoneBlockedUntil, requestCount: 0 },
        });
      }
      
      // Update IP record if it's separate from the phone record
      if (ipShouldBlock && latestIpOtp && latestIpOtp.id !== latestPhoneOtp?.id) {
        await this.prisma.otp.update({
          where: { id: latestIpOtp.id },
          data: { rateLimitLevel: ipLevel, blockedUntil: ipBlockedUntil, requestCount: 0 },
        });
      }

      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // If neither blocked, merge their state for the new shared record
    const nextRateLimitLevel = Math.max(phoneLevel, ipLevel);
    let nextRequestCount = 1;

    if (phoneLevel === ipLevel) {
      nextRequestCount = Math.max(phoneCount, ipCount);
    } else if (phoneLevel > ipLevel) {
      nextRequestCount = phoneCount;
    } else {
      nextRequestCount = ipCount;
    }

    // 3. Generate OTP
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 4. Save OTP
    await this.prisma.otp.deleteMany({
      where: {
        phone,
        purpose,
      },
    });

    await this.prisma.otp.create({
      data: {
        phone,
        ipAddress,
        code: hashedOtp,
        purpose,
        status: OtpStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        rateLimitLevel: nextRateLimitLevel,
        requestCount: nextRequestCount,
        blockedUntil: null,
        attempts: 0,
      },
    });

    // 5. Send SMS
    // await this.smsService.sendOtp(phone, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(dto: VerifyOtpDto, reqUser: any = null) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        phone: dto.phone,
        purpose: dto.purpose,
        status: OtpStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (otp.expiresAt < new Date()) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { status: OtpStatus.EXPIRED },
      });
      throw new BadRequestException('OTP expired');
    }

    const isOtpValid = await bcrypt.compare(dto.otp, otp.code);

    if (!isOtpValid) {
      const newAttempts = otp.attempts + 1;
      
      if (newAttempts >= 5) {
        await this.prisma.otp.update({
          where: { id: otp.id },
          data: { attempts: newAttempts, status: OtpStatus.EXPIRED },
        });
        throw new BadRequestException('Maximum verification attempts reached. Please request a new OTP.');
      } else {
        await this.prisma.otp.update({
          where: { id: otp.id },
          data: { attempts: newAttempts },
        });
        throw new BadRequestException('Invalid OTP');
      }
    }

    // --- OTP is Validated Successfully below this line ---

    if (dto.purpose === OtpPurpose.REGISTER) {
      const user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (!user) {
        throw new NotFoundException('User not found. Please register first.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      await this.prisma.otp.delete({
        where: { id: otp.id }
      });

      return { message: 'Account verified successfully.' };
    }

    // Preserve existing flow for Reset/Change phone marking it as VERIFIED
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { status: OtpStatus.VERIFIED },
    });

    const secret = this.configService.get<string>('JWT_SECRET')!;

    if (dto.purpose === OtpPurpose.RESET_PASSWORD) {
      const user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (!user) throw new NotFoundException('User not found');

      const resetToken = await this.jwtService.signAsync(
        { sub: user.id, purpose: 'reset-password' },
        { secret, expiresIn: '15m' },
      );
      return { resetToken };
    }

    if (dto.purpose === OtpPurpose.CHANGE_PHONE) {
      if (!reqUser || !reqUser.userId) {
        throw new UnauthorizedException('Authentication required to verify change-phone OTP');
      }
      
      const changePhoneToken = await this.jwtService.signAsync(
        { sub: reqUser.userId, phone: dto.phone, purpose: 'change-phone' },
        { secret, expiresIn: '15m' },
      );
      return { changePhoneToken };
    }
  }

  async register(dto: RegisterDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (user) {
      throw new ConflictException('Phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        dateOfBirth: new Date(dto.dateOfBirth),
        password: hashedPassword,
        isVerified: false,
      },
    });

    await this.pointsEngineService.awardSignupBonus({
      userId: createdUser.id,
      createdBy: createdUser.id,
    });

    return {
      message: 'User registered successfully. Please verify your phone number.',
    };
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account is not verified.');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET')!,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME') as StringValue,
    });

    return {
      access_token: accessToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto, payload: JwtPurposePayload) {
    if (!payload.sub) {
      throw new ForbiddenException('Invalid token payload structure');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    await this.prisma.otp.deleteMany({
      where: {
        phone: user.phone,
        purpose: OtpPurpose.RESET_PASSWORD,
        status: OtpStatus.VERIFIED,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  async changePhone(userId: string, payload: JwtPurposePayload) {
    if (!payload.phone) {
      throw new ForbiddenException('Verified phone number is missing from token');
    }

    const newPhone = payload.phone;

    const existingUser = await this.prisma.user.findUnique({
      where: { phone: newPhone },
    });

    if (existingUser) {
      throw new ConflictException('New phone number is already in use');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: newPhone },
    });

    await this.prisma.otp.deleteMany({
      where: { phone: newPhone, purpose: OtpPurpose.CHANGE_PHONE, status: OtpStatus.VERIFIED },
    });

    return {
      message: 'Phone number changed successfully',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }

  async editAccount(userId: string, dto: EditAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return {
      message: 'Account updated successfully',
      user: updatedUser,
    };
  }

  private generateOtp(): string {
    return '0000';
  }
}
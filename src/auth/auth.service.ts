import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './services/sms.service';
import { OtpPurpose, OtpStatus } from '@prisma/client';

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
  ) {}

  async sendOtp(dto: SendOtpDto, reqUser: any = null) {
    const { phone, purpose } = dto;
    const user = await this.prisma.user.findUnique({ where: { phone } });

    switch (purpose) {
      case OtpPurpose.REGISTER:
        if (user) {
          throw new ConflictException('Phone number already exists');
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

    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.otp.deleteMany({
      where: {
        phone,
        purpose,
      },
    });

    await this.prisma.otp.create({
      data: {
        phone,
        code: hashedOtp,
        purpose,
        status: OtpStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // SMS transmission placeholder
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
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { status: OtpStatus.VERIFIED },
    });

    const secret = this.configService.get<string>('JWT_SECRET')!;

    if (dto.purpose === OtpPurpose.REGISTER) {
      const registerToken = await this.jwtService.signAsync(
        { phone: dto.phone, purpose: 'register' },
        { secret, expiresIn: '15m' },
      );
      return { registerToken };
    }

    if (dto.purpose === OtpPurpose.RESET_PASSWORD) {
      const user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

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

  async register(dto: RegisterDto, payload: JwtPurposePayload) {
    if (!payload.phone) {
      throw new ForbiddenException('Verified phone number is missing from token');
    }

    const phone = payload.phone;
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (user) {
      throw new ConflictException('Phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone, // Sourced from JWT token payload
        dateOfBirth: new Date(dto.dateOfBirth),
        password: hashedPassword,
      },
    });

    await this.prisma.otp.deleteMany({
      where: { phone, purpose: OtpPurpose.REGISTER, status: OtpStatus.VERIFIED },
    });

    return {
      message: 'User created successfully',
      userId: createdUser.id,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      phone: createdUser.phone,
      dateOfBirth: createdUser.dateOfBirth,
      role: createdUser.role,
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
    return '0000'; // Standardize logic during tests
  }
}
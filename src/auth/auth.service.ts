import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SmsService } from './services/sms.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto ';


@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) { }





  async register(dto: RegisterDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: dto.phone,
      },
    });

    if (user) {
      throw new ConflictException(
        'Phone already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      10,
    );

    const createdUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        dateOfBirth: new Date(dto.dateOfBirth),
        password: hashedPassword,
      },
    });

    console.log('DATABASE_URL =', process.env.DATABASE_URL);
    return {
      message: 'User created successfully',
      userId: createdUser.id,

    };

  }



  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto;
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('JWT_SERVICE:', this.jwtService);

    const user = await this.prisma.user.findUnique({
      where: {
        phone,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid phone or password',
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid phone or password',
      );
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
    };

    console.log(process.env.JWT_SECRET);
    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      access_token: accessToken,
    };
  }


  private generateOtp(): number {
    return Math.floor(1000 + Math.random() * 9000);
  }


  async forgotPassword(
    userId: string,
    dto: ForgotPasswordDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          phone: dto.phone,
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const otp = this.generateOtp();

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otpCode: otp,
        otpExpiresAt: new Date(
          Date.now() + 5 * 60 * 1000,
        ),
      },
    });

    await this.smsService.sendOtp(
      user.phone,
      otp,
    );

    return {
      message: 'OTP sent successfully',
    };
  }



  async verifyOtp(
    userId: string,
    dto: VerifyOtpDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new BadRequestException('OTP expired');
    }

    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        purpose: 'reset-password',
      },
      {
        expiresIn: '10m',
      },
    );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return {
      resetToken,
    };
  }


  async resetPassword(dto: ResetPasswordDto) {
    const payload = await this.jwtService.verifyAsync(
      dto.resetToken,
    );

    if (payload.purpose !== 'reset-password') {
      throw new UnauthorizedException();
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: {
        id: payload.sub,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }


  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

    if (!isPasswordValid) {
      throw new BadRequestException(
        'Current password is incorrect',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.newPassword,
        10,
      );

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      
      message:
        'Password changed successfully',
    };
  }
}
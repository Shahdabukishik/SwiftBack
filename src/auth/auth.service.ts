import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { SmsService } from './services/sms.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';

type ResetPasswordJwtPayload = {
  sub: string;
};


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
      firstName: createdUser.firstName,
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
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
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


  private generateOtp(): string {
    // return Math.floor(1000 + Math.random() * 9000);
    return '0000'; // For testing purposes, return a fixed OTP
  }


  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: dto.phone,
      },
    });

    if (!user) {
      return {
        message: 'If the account exists, an OTP has been sent.',
      };
    }

    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otpCode: hashedOtp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await this.smsService.sendOtp(user.phone, otp);

    return {
      message: 'If the account exists, an OTP has been sent.',
    };
  }



  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: dto.phone,
      },
    });

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpiresAt
    ) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }
    const isOtpValid = await bcrypt.compare(
      dto.otp,
      user.otpCode!,
    );

    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
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


  async resetPassword(
    dto: ResetPasswordDto,
    payload: ResetPasswordJwtPayload,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
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
        otpCode: null,
        otpExpiresAt: null,
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

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
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

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
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

    return {
      message: 'Account deleted successfully',
    };
  }

}

import {
  Body,
  Controller,
  Post,
  Version,
  Param,
  Patch,
  UseGuards,
  Req,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { JwtPurposeGuard } from './guards/jwt-purpose.guard';
import { JwtPurpose } from './decorator/jwt-purpose.decorator';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EditAccountDto } from './dto/edit-account.dto';
import { SendOtpDto } from './dto/send-otp.dto';

@ApiTags('Users')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Version('1')
  @Post('send-otp')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: any) {
    let ipAddress: string | null = null;
    
    // Extract IP from x-forwarded-for header or fallback to request IP
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      if (Array.isArray(xForwardedFor)) {
        ipAddress = xForwardedFor[0];
      } else {
        ipAddress = xForwardedFor.split(',')[0].trim();
      }
    }
    
    if (!ipAddress) {
      ipAddress = req.ip || null;
    }

    return this.authService.sendOtp(dto, req.user, ipAddress);
  }

  @Version('1')
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Version('1')
  @Post('verify-otp')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any) {
    return this.authService.verifyOtp(dto, req.user);
  }

  @Version('1')
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Version('1')
  @Post(':userId/reset-password')
  @ApiBearerAuth()
  @UseGuards(JwtPurposeGuard)
  @JwtPurpose('reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: any,
  ) {
    if (req.user.sub !== userId) {
      throw new ForbiddenException('Reset token does not match the requested user.');
    }
    return this.authService.resetPassword(dto, req.user);
  }

  @Version('1')
  @Patch(':userId/change-phone')
  @ApiBearerAuth()
  @UseGuards(JwtPurposeGuard)
  @JwtPurpose('change-phone')
  changePhone(@Param('userId') userId: string, @Req() req: any) {
    if (req.user.sub !== userId) {
      throw new ForbiddenException('Token does not match the requested user.');
    }
    return this.authService.changePhone(userId, req.user);
  }

  @Version('1')
  @Patch(':userId/change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ) {
    if (req.user.userId !== userId) {
      throw new ForbiddenException('You are not allowed to change another user password.');
    }
    return this.authService.changePassword(userId, dto);
  }

  @Version('1')
  @Patch(':userId/edit-user-name')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async editAccount(
    @Param('userId') userId: string,
    @Body() dto: EditAccountDto,
    @Req() req: any,
  ) {
    if (req.user.userId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this account');
    }
    return this.authService.editAccount(userId, dto);
  }

  @Version('1')
  @Delete(':userId/delete-account')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Param('userId') userId: string, @Req() req: any) {
    if (req.user.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this account');
    }
    return this.authService.deleteAccount(userId);
  }
}
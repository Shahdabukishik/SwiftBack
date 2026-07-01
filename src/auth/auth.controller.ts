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
} from '@nestjs/common';

import { ForbiddenException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';



@ApiTags('Users')
@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Version('1')
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Phone exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }


  @Version('1')
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(loginDto);
  }


  @Version('1')
  @Post('forgot-password')
  forgotPassword(
    @Body()
    dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }


  @Version('1')
  @Post('verify-otp')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(dto);
  }

  @Version('1')
  @Post(':userId/reset-password')
  @ApiBearerAuth()
  @UseGuards(ResetPasswordGuard)
  resetPassword(
    @Param('userId') userId: string,
    @Req() req,
    @Body()
    dto: ResetPasswordDto,
  ) {
    if (req.user.sub !== userId) {
      throw new ForbiddenException(
        'Reset token does not match the requested user.',
      );
    }

    return this.authService.resetPassword(
      dto,
      req.user,
    );
  }



  @ApiBearerAuth()
  @Version('1')
  @Patch(':userId/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Param('userId') userId: string,
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ) {
    console.log(req.user);
    if (req.user.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to change another user password.',
      );
    }
    return this.authService.changePassword(
      req.user.userId,
      dto,
    );
  }

  @ApiBearerAuth()
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Delete(':userId/delete-account')
  async deleteAccount(
    @Param('userId') id: string,
  ) {
    const userId = id;

    
    if (userId !== id) {
      throw new ForbiddenException(
        'You are not allowed to delete this account',
      );
    }

    return this.authService.deleteAccount(userId);
  }

}



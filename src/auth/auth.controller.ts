import {
  Body,
  Controller,
  Post,
  Version,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';

import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {ChangePasswordDto} from './dto/change-password.dto ';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
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
  @Post(':userId/forgot-password')
  forgotPassword(
    @Param('userId') userId: string,
    @Body()
    dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(userId, dto);
  }


  @Version('1')
  @Post(':userId/verify-otp')
  verifyOtp(
    @Param('userId') userId: string,
    @Body()
    dto: VerifyOtpDto,

  ) {
    return this.authService.verifyOtp(userId, dto);
  }

  @Version('1')
  @Post(':userId/reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Body()
    dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }



  @Version('1')
  @Patch(':userId/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Param('userId') userId: string,
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto,
    );
  }

}
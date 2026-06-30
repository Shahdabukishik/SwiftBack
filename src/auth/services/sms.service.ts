// src/auth/services/sms.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  async sendOtp(phone: string, otp: string) {
    console.log(`OTP ${otp} sent to ${phone}`);

    // Twilio 
    return true;
  }
}

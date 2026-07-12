import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JWT_PURPOSE_KEY } from '../decorator/jwt-purpose.decorator';
import { ConfigService } from '@nestjs/config';

export type JwtPurposePayload = {
  sub?: string;
  phone?: string;
  purpose: string;
  iat?: number;
  exp?: number;
};

type JwtPurposeRequest = Request & {
  user?: JwtPurposePayload;
};

@Injectable()
export class JwtPurposeGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPurpose = this.reflector.get<string>(
      JWT_PURPOSE_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<JwtPurposeRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPurposePayload>(
        token,
        { secret: this.configService.get<string>('JWT_SECRET') }
      );

      if (requiredPurpose && payload.purpose !== requiredPurpose) {
        throw new UnauthorizedException(`Invalid token purpose. Expected: ${requiredPurpose}`);
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : undefined;
  }
}
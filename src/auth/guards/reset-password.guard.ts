import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type ResetPasswordJwtPayload = {
  sub: string;
  purpose: string;
  iat?: number;
  exp?: number;
};

type ResetPasswordRequest = Omit<Request, 'user'> & {
  user?: ResetPasswordJwtPayload;
};

@Injectable()
export class ResetPasswordGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ResetPasswordRequest>();

    const resetToken = this.extractBearerToken(request);

    if (!resetToken) {
      throw new UnauthorizedException(
        'Reset token is required',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<ResetPasswordJwtPayload>(
          resetToken,
        );

      if (
        typeof payload.sub !== 'string' ||
        payload.purpose !== 'reset-password'
      ) {
        throw new UnauthorizedException(
          'Invalid reset token',
        );
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired reset token',
      );
    }
  }

  private extractBearerToken(
    request: Request,
  ): string | undefined {
    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' && token
      ? token
      : undefined;
  }
}
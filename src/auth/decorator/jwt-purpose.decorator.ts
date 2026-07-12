import { SetMetadata } from '@nestjs/common';

export const JWT_PURPOSE_KEY = 'jwt-purpose';

export const JwtPurpose = (
  purpose: string,
) => SetMetadata(
  JWT_PURPOSE_KEY,
  purpose,
);

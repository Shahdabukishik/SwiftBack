import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePointsSettingsDto {
  @ApiPropertyOptional({
    description: 'The number of days for the evaluation period',
    minimum: 1,
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  evaluationPeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Bonus points awarded upon user signup',
    minimum: 0,
    example: 150.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  signupBonusPoints?: number;

  @ApiPropertyOptional({
    description: 'Bonus points awarded on user birthday',
    minimum: 0,
    example: 75.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  birthdayBonusPoints?: number;
}
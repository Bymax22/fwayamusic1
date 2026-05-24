import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KYCStatus } from '@prisma/client';

export class ReviewKYCDto {
  @IsEnum(KYCStatus)
  status: KYCStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

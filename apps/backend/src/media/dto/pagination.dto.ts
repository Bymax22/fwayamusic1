import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { MediaType } from '@prisma/client';
import { IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsString()
  genre?: string;
}
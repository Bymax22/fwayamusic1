// create-media.dto.ts
import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { MediaType } from '@fwaya-music/types/enums';

export class CreateMediaDto {
  @IsUrl()
  url!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsBoolean()
  isPremium!: boolean;

  @IsBoolean()
  isExplicit!: boolean;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  // Remove userId field entirely
}
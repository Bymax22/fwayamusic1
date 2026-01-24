// create-media.dto.ts
import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { MediaType } from '@fwaya-music/types/enums';

export class CreateMediaDto {
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

  @IsOptional()
  @IsString()
  accessType?: string; // 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW'

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isExplicit?: boolean;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  allowReselling?: boolean;

  @IsOptional()
  @IsNumber()
  artistCommissionRate?: number;

  @IsOptional()
  @IsString()
  tags?: string; // JSON stringified array

  // artCoverUrl will be set from file upload
}
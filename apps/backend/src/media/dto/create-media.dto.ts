// create-media.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
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
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  type!: MediaType;

  @IsOptional()
  @IsString()
  accessType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsBoolean()
  isExplicit?: boolean;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsBoolean()
  allowReselling?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  artistCommissionRate?: number;

  @IsOptional()
  @IsString()
  tags?: string;
}
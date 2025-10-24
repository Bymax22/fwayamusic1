import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator'
import { MediaType } from '@fwaya-music/types/enums';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  genre?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean

  @IsOptional()
  @IsBoolean()
  isExplicit?: boolean

  @IsOptional()
  @IsNumber()
  duration?: number

  @IsOptional()
  @IsString()
  artCoverUrl?: string

  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @IsOptional()
  @IsString()
  format?: string

  // Audio features
  @IsOptional()
  @IsNumber()
  bpm?: number

  @IsOptional()
  @IsString()
  key?: string

  @IsOptional()
  @IsNumber()
  energy?: number

  @IsOptional()
  @IsNumber()
  danceability?: number

  @IsOptional()
  @IsNumber()
  valence?: number

  @IsOptional()
  @IsNumber()
  acousticness?: number
}
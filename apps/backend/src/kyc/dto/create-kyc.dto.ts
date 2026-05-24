import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateKYCDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsNotEmpty()
  @IsString()
  frontImageUrl: string;

  @IsOptional()
  @IsString()
  backImageUrl?: string;

  @IsOptional()
  @IsString()
  selfieImageUrl?: string;

  @IsOptional()
  metadata?: any;
}

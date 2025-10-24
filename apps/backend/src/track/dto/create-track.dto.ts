import { IsString, IsUrl } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  title!: string;

  @IsUrl()
  url!: string;

  @IsString()
  uploadedBy!: string;
}
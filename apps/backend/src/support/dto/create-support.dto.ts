export class CreateSupportDto {
  name?: string;
  email!: string;
  message!: string;
  source?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

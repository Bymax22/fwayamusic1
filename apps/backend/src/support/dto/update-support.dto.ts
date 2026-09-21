export class UpdateSupportDto {
  status?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  assignedToId?: number | null;
}

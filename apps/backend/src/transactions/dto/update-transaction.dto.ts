export class UpdateTransactionDto {
  status?: string; // TransactionStatus enum values: PENDING | COMPLETED | FAILED | ...
  providerReference?: string | null;
  metadata?: Record<string, any> | null;
}
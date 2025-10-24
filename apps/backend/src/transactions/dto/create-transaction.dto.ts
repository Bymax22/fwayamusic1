export class CreateTransactionDto {
  amount!: number;
  currency?: string; // use Currency enum values (e.g. "ZMW", "USD")
  mediaId?: number | null;
  paymentMethod?: string; // use PaymentMethod enum values
  paymentProvider?: string; // use PaymentProvider enum values
  resellerLinkCode?: string | null;
  deviceInfo?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}
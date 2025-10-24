export class CreateResellerLinkDto {
  mediaId!: number;
  customCommissionRate?: number;
  expiresAt?: Date;
}

export class ResellerStatsDto {
  totalCommission!: number;
  paidCommission!: number;
  pendingCommission!: number;
  totalSales!: number;
  conversionRate!: number;
}
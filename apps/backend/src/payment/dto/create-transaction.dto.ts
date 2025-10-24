export class CreateTransactionDto {
  mediaId!: number;
  amount!: number;
  currency!: string;
  paymentMethod!: string;
  paymentProvider!: string;
  resellerLinkCode?: string;
  deviceInfo!: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    os: string;
    fingerprint: string;
  };
}

export class ProcessPaymentDto {
  transactionId!: number;
  providerData!: any;
}

export class CurrencyConversionDto {
  amount!: number;
  fromCurrency!: string;
  toCurrency!: string;
}
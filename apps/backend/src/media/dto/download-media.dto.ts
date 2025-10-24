export class DownloadMediaDto {
  deviceId!: string;
  deviceName!: string;
  deviceType!: string;
  os!: string;
  fingerprint!: string;
}

export class GenerateLicenseDto {
  transactionId!: number;
  deviceId!: string;
}
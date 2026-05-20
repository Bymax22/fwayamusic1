// Shared Prisma enums for backend/frontend usage
export enum MediaType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST',
  LIVE_STREAM = 'LIVE_STREAM',
}

export enum PlaylistType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  SMART = 'SMART',
  RADIO = 'RADIO',
}

export enum UserRole {
  USER = 'USER',
  ARTIST = 'ARTIST',
  RESELLER = 'RESELLER',
  PRODUCER = 'PRODUCER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum MediaAccessType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PAY_PER_VIEW = 'PAY_PER_VIEW',
}

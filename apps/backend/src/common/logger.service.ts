import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class AppLogger implements LoggerService {
  private logger;

  constructor() {
    this.logger = createLogger({
      transports: [
        new transports.Console(),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d'
        })
      ]
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, { trace: trace || '' });
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
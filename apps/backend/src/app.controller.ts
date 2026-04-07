import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health(): Promise<{ status: string; timestamp: string; database?: string }> {
    const response: { status: string; timestamp: string; database?: string } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    try {
      // Try a simple database query to check connection
      await this.appService.checkDatabaseConnection();
      response.database = 'connected';
    } catch (error) {
      response.database = 'disconnected';
      response.status = 'degraded';
    }

    return response;
  }
}

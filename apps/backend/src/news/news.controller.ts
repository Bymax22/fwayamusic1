import { Controller, Get, Param } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('v1/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getAllNews() {
    return this.newsService.getAllNews();
  }

  @Get(':id')
  async getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }
}
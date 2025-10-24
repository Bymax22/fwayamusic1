import { Controller, Post, Body, Get, Param, Query, Patch, Headers } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('v1/transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Post()
  async create(
    @Body() createDto: CreateTransactionDto,
    @Headers('user-id') userIdHeader?: string,
  ) {
    const parsedUserId = parseInt(userIdHeader as string);
    const userId = isNaN(parsedUserId) ? 1 : parsedUserId;
    return this.service.create(createDto, userId);
  }

  @Get()
  async list(@Query('skip') skip?: string, @Query('take') take?: string) {
    const s = parseInt(skip as any) || 0;
    const t = parseInt(take as any) || 50;
    return this.service.findAll(s, t);
  }

  @Get('user/:id')
  async listByUser(@Param('id') id: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    const userId = parseInt(id);
    const s = parseInt(skip as any) || 0;
    const t = parseInt(take as any) || 50;
    return this.service.findByUser(userId, s, t);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.service.update(parseInt(id), dto);
  }
}
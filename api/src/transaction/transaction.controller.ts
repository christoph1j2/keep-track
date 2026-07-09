import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateBatchDto } from './dto/create-batch.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SkipThrottle()
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Vytvořit novou transakci' })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.create(req.user.id, createTransactionDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Vytvořit více transakcí najednou' })
  createBatch(
    @Body() createBatchDto: CreateBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.createBatch(
      req.user.id,
      createBatchDto.transactions,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Získat všechny transakce uživatele' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.transactionService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získat konkrétní transakci' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.transactionService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Upravit transakci' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.update(
      req.user.id,
      id,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazat transakci' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.transactionService.remove(req.user.id, id);
  }
}

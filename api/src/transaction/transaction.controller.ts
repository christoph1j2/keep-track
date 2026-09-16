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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transactionService.create(req.user.id, createTransactionDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple transactions at once' })
  @ApiResponse({
    status: 201,
    description: 'Transactions created successfully.',
  })
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
  @ApiOperation({ summary: 'Get all transactions for user' })
  @ApiResponse({ status: 200, description: 'List of all transactions.' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.transactionService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.transactionService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
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
  @ApiOperation({ summary: 'Delete a specific transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.transactionService.remove(req.user.id, id);
  }
}

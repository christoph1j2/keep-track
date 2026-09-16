import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';

@ApiTags('Exchange Rates')
@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  @ApiOperation({ summary: 'Get latest exchange rates' })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates retrieved successfully.',
  })
  getRates(@Query('base') base?: string) {
    return this.exchangeRateService.getLatestRates(base || 'CZK');
  }
}

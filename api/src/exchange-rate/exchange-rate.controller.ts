import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  getRates(@Query('base') base?: string) {
    return this.exchangeRateService.getLatestRates(base || 'CZK');
  }
}

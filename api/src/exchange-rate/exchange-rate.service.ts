import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  [key: string]: unknown;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  async getLatestRates(
    baseCurrency: string = 'CZK',
  ): Promise<Record<string, number>> {
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}`,
      );

      if (!res.ok) throw new Error('Failed to fetch from external API.');

      const data = (await res.json()) as ExchangeRatesResponse;
      return data.rates;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching exchange rates: ${message}`);
      throw new HttpException(
        'Exchange rates unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getHistoricalRates(
    date: string,
    baseCurrency: string = 'CZK',
  ): Promise<Record<string, number>> {
    try {
      const res = await fetch(
        `https://api.frankfurter.app/${date}?from=${baseCurrency}`,
      );

      if (!res.ok) throw new Error('Failed to fetch from external API.');

      const data = (await res.json()) as ExchangeRatesResponse;
      return data.rates || {};
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching historical rates for ${date}: ${message}`);
      return {}; // Returning empty object gracefully for AI import logic
    }
  }
}

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  [key: string]: unknown;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  private async fetchWithTimeout(
    url: string,
    timeoutMs: number = 5000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getLatestRates(
    baseCurrency: string = 'CZK',
  ): Promise<Record<string, number>> {
    try {
      const res = await this.fetchWithTimeout(
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
      const res = await this.fetchWithTimeout(
        `https://api.frankfurter.app/${date}?from=${baseCurrency}`,
      );

      if (!res.ok) throw new Error('Failed to fetch from external API.');

      const data = (await res.json()) as ExchangeRatesResponse;
      return data.rates || {};
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching historical rates for ${date}: ${message}`,
      );
      throw new HttpException(
        'Exchange rates unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

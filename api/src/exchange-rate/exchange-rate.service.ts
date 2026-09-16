import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  [key: string]: unknown;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  /**
   * Fetches data from a given URL with a specified timeout.
   * 
   * @param url - The URL to fetch data from.
   * @param timeoutMs - The maximum time in milliseconds to wait for a response before aborting the request. Defaults to 5000 ms.
   * @returns - A promise that resolves to the Response object from the fetch call. If the request times out or fails, an error is thrown.
   */
  private async fetchWithTimeout(
    url: string,
    timeoutMs: number = 5000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Perform the fetch request with the provided URL and the abort signal for timeout handling
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches the latest exchange rates for a specified base currency from an external API. If the request fails or the API is unavailable, an error is logged and an HTTP exception is thrown.
   * 
   * @param baseCurrency - The base currency for which to fetch the latest exchange rates. Defaults to 'CZK' if not provided. 
   * @returns - A promise that resolves to a record mapping currency codes to their corresponding exchange rates relative to the base currency. If the API request fails, an HTTP exception with status SERVICE_UNAVAILABLE is thrown.
   */
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

  /**
   * Fetches historical exchange rates for a specified date and base currency from an external API. If the request fails or the API is unavailable, an error is logged and an HTTP exception is thrown.
   * 
   * @param date - The date for which to fetch historical exchange rates.
   * @param baseCurrency - The base currency for which to fetch the historical exchange rates. Defaults to 'CZK' if not provided.
   * @returns - A promise that resolves to a record mapping currency codes to their corresponding exchange rates relative to the base currency for the specified date. If the API request fails, an HTTP exception with status SERVICE_UNAVAILABLE is thrown.
   */
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

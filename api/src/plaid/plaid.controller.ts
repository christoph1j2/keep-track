import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // doplň podle své struktury

@Controller('plaid')
@UseGuards(JwtAuthGuard)
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  // Endpoint pro získání tokenu (odpálí se hned při otevření bankovního nastavení)
  @Post('create-link-token')
  @HttpCode(HttpStatus.OK)
  async createLinkToken(@Req() req) {
    const token = await this.plaidService.createLinkToken(req.user.id);
    return { linkToken: token };
  }

  // Endpoint pro dokončení flow a uložení přístupu
  @Post('exchange-token')
  @HttpCode(HttpStatus.OK)
  async exchangeToken(
    @Req() req,
    @Body('publicToken') publicToken: string,
    @Body('institutionName') institutionName: string,
  ) {
    return this.plaidService.exchangePublicToken(req.user.id, publicToken, institutionName);
  }
}
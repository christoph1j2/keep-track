import { Injectable } from "@nestjs/common";
import { PlaidApi, Configuration, PlaidEnvironments, CountryCode, Products } from "plaid";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlaidService {
    private plaidClient: PlaidApi;

    constructor(private prisma: PrismaService) {
        // init oficialniho plaid sdk
        const environment = process.env.PLAID_ENV || 'sandbox';
        const configuration = new Configuration({
            basePath: PlaidEnvironments[environment],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                    'PLAID-SECRET': process.env.PLAID_SECRET,
                },
            },
        });

        this.plaidClient = new PlaidApi(configuration);
    }

    // 1. Generovani docasneho Link Tokenu pro FE
    async createLinkToken(userId: string): Promise<string> {
        try {
            const response = await this.plaidClient.linkTokenCreate({
                user: { client_user_id: userId },
                client_name: 'KeepTrack',
                products: [Products.Transactions], // pristup k transakcim
                country_codes: ['CZ' as CountryCode, CountryCode.Pl, 'SK' as CountryCode, CountryCode.Ie], // CZ, PL, SK
                language: 'en',
            });

            return response.data.link_token;
        } catch (error) {
            console.error('Error creating link token:', error);
            throw new Error('Failed to create link token');
        }
    }

    // 2. vymena verejneho tokenu za trvaly pristup
    async exchangePublicToken(userId: string, publicToken: string, institutionName: string) {
        try {
            const response = await this.plaidClient.itemPublicTokenExchange({
                public_token: publicToken,
            });

            const accessToken = response.data.access_token;
            const itemId = response.data.item_id;

            // ulozime trvaly token do db
            const bankAccount = await this.prisma.bankAccountConnection.create({
                data: {
                    userId,
                    accessToken,
                    plaidItemId: itemId,
                    institutionName,
                    status: 'ACTIVE',
                },
            });

            return { success: true, connectionId: bankAccount.id };
        } catch (error) {
            console.error('Error exchanging public token:', error);
            return { success: false, error: 'Failed to exchange public token' };
        }
    }
}
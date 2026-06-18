import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // nodejs postgres pool
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });

    // obalime pool do prisma adapteru
    const adapter = new PrismaPg(pool);
    super({ adapter});
  }
  async onModuleInit() {
    await this.$connect();
  }
}

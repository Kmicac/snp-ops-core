import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type PrismaClientLifecycle = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await (this as unknown as PrismaClientLifecycle).$connect();
  }

  async onModuleDestroy() {
    await (this as unknown as PrismaClientLifecycle).$disconnect();
  }
}

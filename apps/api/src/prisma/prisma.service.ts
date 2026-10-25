import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected successfully");
    } catch (err: any) {
      this.logger.warn(
        `Database connection failed during init: ${err.message}. Proceeding offline.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

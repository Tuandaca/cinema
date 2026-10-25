import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { BookingGateway } from "./booking.gateway";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, AuthModule, RedisModule],
  controllers: [BookingController],
  providers: [BookingService, BookingGateway, WsJwtGuard],
  exports: [BookingService],
})
export class BookingModule {}

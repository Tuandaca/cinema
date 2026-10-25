import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaModule } from "../prisma/prisma.module";
import { MoviesModule } from "../movies/movies.module";
import { AuthModule } from "../auth/auth.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, MoviesModule, AuthModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

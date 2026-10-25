import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TraktProvider } from "./providers/trakt.provider";
import { OmdbProvider } from "./providers/omdb.provider";
import { MoviesService } from "./movies.service";
import { MovieSyncService } from "./movie-sync.service";
import { MoviesController } from "./movies.controller";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [HttpModule, RedisModule],
  controllers: [MoviesController],
  providers: [TraktProvider, OmdbProvider, MoviesService, MovieSyncService],
  exports: [MoviesService, MovieSyncService],
})
export class MoviesModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TraktProvider } from './providers/trakt.provider';
import { OmdbProvider } from './providers/omdb.provider';
import { MoviesService } from './movies.service';
import { MovieSyncService } from './movie-sync.service';
import { MoviesController } from './movies.controller';

@Module({
  imports: [HttpModule],
  controllers: [MoviesController],
  providers: [TraktProvider, OmdbProvider, MoviesService, MovieSyncService],
  exports: [MoviesService, MovieSyncService],
})
export class MoviesModule {}

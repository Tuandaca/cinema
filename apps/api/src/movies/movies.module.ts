import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TraktProvider } from './providers/trakt.provider';
import { OmdbProvider } from './providers/omdb.provider';

@Module({
  imports: [HttpModule],
  providers: [TraktProvider, OmdbProvider],
  exports: [TraktProvider, OmdbProvider],
})
export class MoviesModule {}

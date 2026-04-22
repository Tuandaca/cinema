import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MovieBase, MovieDetails } from '../interfaces/movie-provider.interface';

@Injectable()
export class OmdbProvider {
  private readonly logger = new Logger(OmdbProvider.name);
  private readonly baseUrl = 'http://www.omdbapi.com/';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get apiKey() {
    return this.configService.get<string>('OMDB_API_KEY');
  }

  async enrichMovie(movie: MovieDetails): Promise<MovieDetails> {
    const imdbId = movie.ids?.imdb;
    if (!imdbId) return movie;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            apikey: this.apiKey,
            i: imdbId,
          },
        }),
      );

      if (data.Response === 'True') {
        return {
          ...movie,
          poster: data.Poster !== 'N/A' ? data.Poster : movie.poster,
          omdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
        };
      }
      return movie;
    } catch (error) {
      this.logger.error(`Failed to enrich movie from OMDb (${imdbId}): ${error.message}`);
      return movie;
    }
  }
}

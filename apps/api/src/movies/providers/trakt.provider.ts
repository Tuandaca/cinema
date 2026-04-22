import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IMovieProvider, MovieBase, MovieDetails } from '../interfaces/movie-provider.interface';

@Injectable()
export class TraktProvider implements IMovieProvider {
  private readonly logger = new Logger(TraktProvider.name);
  private readonly baseUrl = 'https://api.trakt.tv';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': this.configService.get<string>('TRAKT_CLIENT_ID'),
    };
  }

  async searchMovies(query: string): Promise<MovieBase[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search/movie`, {
          params: { query },
          headers: this.headers,
        }),
      );
      return data.map((item: any) => item.movie);
    } catch (error) {
      this.logger.error(`Failed to search movies on Trakt: ${error.message}`);
      return [];
    }
  }

  async getTrendingMovies(limit: number = 20): Promise<MovieBase[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/movies/trending`, {
          params: { limit, extended: 'full' },
          headers: this.headers,
        }),
      );
      return data.map((item: any) => item.movie);
    } catch (error) {
      this.logger.error(`Failed to fetch trending movies from Trakt: ${error.message}`);
      return [];
    }
  }

  async getMovieDetails(traktId: string): Promise<MovieDetails> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/movies/${traktId}`, {
          params: { extended: 'full' },
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch movie details from Trakt (${traktId}): ${error.message}`);
      throw error;
    }
  }
}

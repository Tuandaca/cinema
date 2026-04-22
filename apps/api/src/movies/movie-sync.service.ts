import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TraktProvider } from './providers/trakt.provider';
import { OmdbProvider } from './providers/omdb.provider';
import { MovieDetails } from './interfaces/movie-provider.interface';

@Injectable()
export class MovieSyncService {
  private readonly logger = new Logger(MovieSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly traktProvider: TraktProvider,
    private readonly omdbProvider: OmdbProvider,
  ) {}

  async syncTrendingMovies(limit: number = 20) {
    this.logger.log(`Starting sync for top ${limit} trending movies...`);
    
    try {
      const trendingMovies = await this.traktProvider.getTrendingMovies(limit);
      this.logger.log(`Found ${trendingMovies.length} movies on Trakt.`);

      let syncedCount = 0;

      for (const movieBase of trendingMovies) {
        try {
          // 1. Fetch full details from Trakt
          const details = await this.traktProvider.getMovieDetails(movieBase.ids.trakt.toString());
          
          // 2. Enrich with OMDb
          const enrichedDetails = await this.omdbProvider.enrichMovie(details);

          // 3. Sync to Database
          await this.upsertMovie(enrichedDetails);
          syncedCount++;
          
          this.logger.log(`Synced: ${enrichedDetails.title}`);
        } catch (error) {
          this.logger.error(`Failed to sync movie ${movieBase.title}: ${error.message}`);
        }
      }

      this.logger.log(`Sync completed. Successfully synced ${syncedCount}/${trendingMovies.length} movies.`);
      return { total: trendingMovies.length, synced: syncedCount };
    } catch (error) {
      this.logger.error(`Global sync error: ${error.message}`);
      throw error;
    }
  }

  private async upsertMovie(details: MovieDetails) {
    const { title, overview, trailer, poster, rating, runtime, released, certification, language, genres, ids } = details;

    // Handle genres: Connect or Create
    const genreConnections = genres ? await Promise.all(
      genres.map(async (genreName) => {
        const genre = await this.prisma.genre.upsert({
          where: { name: genreName },
          update: {},
          create: { name: genreName },
        });
        return { id: genre.id };
      })
    ) : [];

    return this.prisma.movie.upsert({
      where: { traktId: ids.trakt },
      update: {
        title,
        description: overview,
        trailerUrl: trailer,
        posterUrl: poster,
        rating: rating || details.omdbRating ? parseFloat(details.omdbRating) : undefined,
        runtime,
        released: released ? new Date(released) : undefined,
        certification,
        language,
        imdbId: ids.imdb,
        tmdbId: ids.tmdb,
        genres: {
          set: genreConnections,
        },
      },
      create: {
        traktId: ids.trakt,
        imdbId: ids.imdb,
        tmdbId: ids.tmdb,
        title,
        description: overview,
        trailerUrl: trailer,
        posterUrl: poster,
        rating: rating || (details.omdbRating ? parseFloat(details.omdbRating) : undefined),
        runtime,
        released: released ? new Date(released) : undefined,
        certification,
        language,
        genres: {
          connect: genreConnections,
        },
      },
    });
  }
}

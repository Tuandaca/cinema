import { PrismaClient, Role, MovieStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Admin User
  const adminEmail = 'admin@coicine.com';
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Seed Theater Rooms
  const room1 = await prisma.theaterRoom.upsert({
    where: { id: 'room-1' },
    update: {},
    create: {
      id: 'room-1',
      name: 'Premium Cinema 01',
      capacity: 24,
    },
  });

  const room2 = await prisma.theaterRoom.upsert({
    where: { id: 'room-2' },
    update: {},
    create: {
      id: 'room-2',
      name: 'IMAX Experience',
      capacity: 32,
    },
  });
  console.log('✅ Theater rooms created.');

  // 3. Seed Seats for Room 1 (Simple grid)
  const rows = ['A', 'B', 'C'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const row of rows) {
    for (const num of cols) {
      await prisma.seat.upsert({
        where: { id: `seat-r1-${row}${num}` },
        update: {},
        create: {
          id: `seat-r1-${row}${num}`,
          roomId: room1.id,
          row: row,
          number: num,
          type: row === 'C' ? 'VIP' : 'NORMAL',
        },
      });
    }
  }
  console.log('✅ Seats for Room 1 created.');

  // 4. Seed Initial Movies from Trakt (Quick sync 5 movies)
  console.log('🎬 Fetching initial movies from Trakt...');
  const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (TRAKT_CLIENT_ID && OMDB_API_KEY) {
    try {
      const traktResponse = await axios.get('https://api.trakt.tv/movies/trending', {
        params: { limit: 5, extended: 'full' },
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': TRAKT_CLIENT_ID,
        },
      });

      for (const item of traktResponse.data) {
        const movie = item.movie;
        
        // Quick OMDb enrichment for poster
        let poster = null;
        try {
          const omdbRes = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.ids.imdb}`);
          if (omdbRes.data.Response === 'True') {
            poster = omdbRes.data.Poster !== 'N/A' ? omdbRes.data.Poster : null;
          }
        } catch (e) {}

        await prisma.movie.upsert({
          where: { traktId: movie.ids.trakt },
          update: {},
          create: {
            traktId: movie.ids.trakt,
            imdbId: movie.ids.imdb,
            title: movie.title,
            description: movie.overview,
            posterUrl: poster,
            trailerUrl: movie.trailer,
            rating: movie.rating,
            runtime: movie.runtime,
            released: movie.released ? new Date(movie.released) : null,
            status: MovieStatus.NOW_SHOWING,
            genres: {
              connectOrCreate: movie.genres.map((g: string) => ({
                where: { name: g },
                create: { name: g },
              })),
            },
          },
        });
        console.log(`🍿 Seeded movie: ${movie.title}`);
      }
    } catch (error) {
      console.error('❌ Failed to seed movies from API:', error.message);
    }
  } else {
    console.warn('⚠️ Skipping movie seed: API keys missing in .env');
  }

  // 5. Seed F&B Combos
  const combos = [
    {
      id: 'combo-1',
      name: 'Single Combo',
      description: '1 Popcorn (L) + 1 Drink (L)',
      price: 15.0,
    },
    {
      id: 'combo-2',
      name: 'Couple Combo',
      description: '1 Popcorn (L) + 2 Drinks (L)',
      price: 22.0,
    },
    {
      id: 'combo-3',
      name: 'Family Combo',
      description: '2 Popcorns (L) + 4 Drinks (L) + 2 Snack',
      price: 45.0,
    },
  ];

  console.log('🍔 Seeding F&B Combos...');
  for (const combo of combos) {
    await prisma.combo.upsert({
      where: { id: combo.id },
      update: {},
      create: combo,
    });
  }
  console.log('✅ F&B Combos created.');

  console.log('✨ Seeding completed successfully.');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

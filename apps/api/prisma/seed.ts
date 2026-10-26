import { PrismaClient, Role, MovieStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { seedFutureShowtimes } from '../src/scripts/seed-future-showtimes';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
    update: {
      name: 'Premium Cinema 01 / Standard Hall',
      capacity: 45,
    },
    create: {
      id: 'room-1',
      name: 'Premium Cinema 01 / Standard Hall',
      capacity: 45,
    },
  });

  const room2 = await prisma.theaterRoom.upsert({
    where: { id: 'room-2' },
    update: {
      name: 'Hall 01 - IMAX Experience',
      capacity: 72,
    },
    create: {
      id: 'room-2',
      name: 'Hall 01 - IMAX Experience',
      capacity: 72,
    },
  });

  const room3 = await prisma.theaterRoom.upsert({
    where: { id: 'room-3' },
    update: {
      name: 'Cinema 03 - Gold Class VIP',
      capacity: 24,
    },
    create: {
      id: 'room-3',
      name: 'Cinema 03 - Gold Class VIP',
      capacity: 24,
    },
  });
  console.log('✅ Theater rooms created/updated.');

  // 3. Seed Seats for Room 1 (45 seats: Rows A-E x 9 cols; A-C NORMAL, D-E VIP)
  // Strictly preserves existing booked seats: seat-r1-A3..A5, seat-r1-B3..B5
  for (const row of ['A', 'B', 'C', 'D', 'E']) {
    for (let num = 1; num <= 9; num++) {
      const type = ['D', 'E'].includes(row) ? 'VIP' : 'NORMAL';
      await prisma.seat.upsert({
        where: {
          roomId_row_number: {
            roomId: room1.id,
            row,
            number: num,
          },
        },
        update: { type },
        create: {
          id: `seat-r1-${row}${num}`,
          roomId: room1.id,
          row,
          number: num,
          type,
        },
      });
    }
  }
  console.log('✅ Seats for Room 1 (Standard Hall: 45 seats) created/updated.');

  // 3b. Seed Seats for Room 2 (72 seats: Rows A-H x 9 cols; A-B NORMAL, C-F VIP, G-H NORMAL)
  // Strictly preserves existing booked seats: seat-room-2-A3..A5
  for (const row of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    for (let num = 1; num <= 9; num++) {
      const type = ['C', 'D', 'E', 'F'].includes(row) ? 'VIP' : 'NORMAL';
      await prisma.seat.upsert({
        where: {
          roomId_row_number: {
            roomId: room2.id,
            row,
            number: num,
          },
        },
        update: { type },
        create: {
          id: `seat-room-2-${row}${num}`,
          roomId: room2.id,
          row,
          number: num,
          type,
        },
      });
    }
  }
  console.log('✅ Seats for Room 2 (IMAX Experience: 72 seats) created/updated.');

  // 3c. Seed Seats for Room 3 (24 SWEETBOX seats: Rows A-C x 8 cols; 100% SWEETBOX couples)
  // Clean up room-3 duplicate seats completely (room-3 has 0 bookings)
  await prisma.seat.deleteMany({ where: { roomId: room3.id } });
  for (const row of ['A', 'B', 'C']) {
    for (let col = 1; col <= 8; col++) {
      await prisma.seat.upsert({
        where: {
          roomId_row_number: {
            roomId: room3.id,
            row,
            number: col,
          },
        },
        update: { type: 'SWEETBOX' },
        create: {
          id: `seat-room-3-${row}${col}`,
          roomId: room3.id,
          row,
          number: col,
          type: 'SWEETBOX',
        },
      });
    }
  }
  console.log('✅ Seats for Room 3 (Gold Class SWEETBOX: 24 seats) created.');

  // 4. Seed Initial Movies
  console.log('🎬 Seeding movies...');
  const seededMovies = [];
  
  const defaultMovies = [
    {
      id: 'movie-avengers-endgame',
      title: 'Avengers: Endgame',
      description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
      posterUrl: 'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      rating: 8.4,
      runtime: 181,
      released: new Date('2019-04-26'),
      status: MovieStatus.NOW_SHOWING,
      genres: ['Action', 'Sci-Fi', 'Adventure'],
    },
    {
      id: 'movie-inception',
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      posterUrl: 'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      rating: 8.8,
      runtime: 148,
      released: new Date('2010-07-16'),
      status: MovieStatus.NOW_SHOWING,
      genres: ['Sci-Fi', 'Action', 'Thriller'],
    },
    {
      id: 'movie-interstellar',
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      posterUrl: 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZAZE3Tc',
      rating: 8.6,
      runtime: 169,
      released: new Date('2014-11-07'),
      status: MovieStatus.NOW_SHOWING,
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
    }
  ];

  const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
  const OMDB_API_KEY = process.env.OMDB_API_KEY;
  let useFallback = true;

  if (TRAKT_CLIENT_ID && OMDB_API_KEY) {
    try {
      console.log('🎬 Fetching initial movies from Trakt...');
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
        
        let poster = null;
        try {
          const omdbRes = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.ids.imdb}`);
          if (omdbRes.data.Response === 'True') {
            poster = omdbRes.data.Poster !== 'N/A' ? omdbRes.data.Poster : null;
          }
        } catch (e) {}

        const dbMovie = await prisma.movie.upsert({
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
        seededMovies.push(dbMovie);
        console.log(`🍿 Seeded movie from Trakt: ${movie.title}`);
      }
      useFallback = false;
    } catch (error) {
      console.error('❌ Failed to seed movies from Trakt API, using local fallback:', error.message);
    }
  }

  if (useFallback) {
    console.log('🎬 Seeding fallback local movies...');
    for (const m of defaultMovies) {
      const dbMovie = await prisma.movie.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          title: m.title,
          description: m.description,
          posterUrl: m.posterUrl,
          trailerUrl: m.trailerUrl,
          rating: m.rating,
          runtime: m.runtime,
          released: m.released,
          status: m.status,
          genres: {
            connectOrCreate: m.genres.map((g: string) => ({
              where: { name: g },
              create: { name: g },
            })),
          },
        },
      });
      seededMovies.push(dbMovie);
      console.log(`🍿 Seeded fallback movie: ${dbMovie.title}`);
    }
  }

  // 4.5. Seed Showtimes: Ensure ~5 showtimes/day balanced schedule across 3 rooms
  console.log('⏰ Running seedFutureShowtimes() to establish balanced ~5 showtimes/day schedule...');
  await seedFutureShowtimes();

  // 5. Seed F&B Combos
  const combos = [
    {
      id: 'combo-1',
      name: 'Single Combo',
      description: '1 Popcorn (L) + 1 Drink (L)',
      price: 65000,
    },
    {
      id: 'combo-2',
      name: 'Couple Combo',
      description: '1 Popcorn (L) + 2 Drinks (L)',
      price: 95000,
    },
    {
      id: 'combo-3',
      name: 'Family Combo',
      description: '2 Popcorns (L) + 4 Drinks (L) + 2 Snack',
      price: 145000,
    },
  ];

  console.log('🍔 Seeding F&B Combos...');
  for (const combo of combos) {
    await prisma.combo.upsert({
      where: { id: combo.id },
      update: {
        price: combo.price,
      },
      create: combo,
    });
  }
  console.log('✅ F&B Combos created.');

  // 6. Synchronize verified posters for all movies in database
  console.log('🖼️ Synchronizing verified 200 OK poster URLs for movies...');
  const VERIFIED_POSTERS: Record<string, string> = {
    'movie-avengers-endgame': 'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    'movie-inception': 'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    'movie-interstellar': 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    '3166a2a1-34fa-49a3-84c6-7bccbbc3b07d': 'https://image.tmdb.org/t/p/original/qE0FswzjACs2kvAycYVS2zcmgec.jpg', // Balls Up
    'faa5fe96-1e32-4cb0-ab5e-8fb207a4aebd': 'https://image.tmdb.org/t/p/original/kyeqWdyUXW608qlYkRqosgbbJyK.jpg', // Avatar: Fire and Ash
    '31c062d6-54be-44b7-9e67-52ff2a67113e': 'https://image.tmdb.org/t/p/original/8912AsVuS7Sj915apArUFbv6F9L.jpg', // The Devil Wears Prada
  };

  for (const [movieId, posterUrl] of Object.entries(VERIFIED_POSTERS)) {
    await prisma.movie.updateMany({
      where: { id: movieId },
      data: { posterUrl },
    });
  }
  // Also ensure Balls Up by title has verified poster
  await prisma.movie.updateMany({
    where: { title: 'Balls Up' },
    data: { posterUrl: 'https://image.tmdb.org/t/p/original/qE0FswzjACs2kvAycYVS2zcmgec.jpg' },
  });
  console.log('✅ Verified poster URLs synchronized.');

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

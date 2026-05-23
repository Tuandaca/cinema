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

  // 4. Seed Initial Movies
  console.log('🎬 Seeding movies...');
  const seededMovies = [];
  
  const defaultMovies = [
    {
      id: 'movie-avengers-endgame',
      title: 'Avengers: Endgame',
      description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
      posterUrl: 'https://image.tmdb.org/t/p/original/or06seB2JWytw08jgjz6ldmNet1.jpg',
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
      posterUrl: 'https://image.tmdb.org/t/p/original/o0Ol4kg4VIs48ccBs0xeIYcYy5c.jpg',
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
      posterUrl: 'https://image.tmdb.org/t/p/original/gEU2QvH353eRPmN28j260v2Ghp1.jpg',
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

  // 4.5. Seed Showtimes for seeded movies dynamically (3 days, dynamic times)
  console.log('⏰ Seeding Showtimes dynamically for the next 3 days...');
  const rooms = [room1, room2];
  const now = new Date();
  
  // Clean old future showtimes to prevent DB clutter during development
  await prisma.showtime.deleteMany({
    where: {
      startTime: { gte: now }
    }
  });

  let showtimeCount = 0;
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date();
    date.setDate(now.getDate() + dayOffset);
    
    // Suất chiếu lúc: 10:00, 14:00, 18:00, 22:00
    const hours = [10, 14, 18, 22];
    
    for (let i = 0; i < seededMovies.length; i++) {
      const movie = seededMovies[i];
      const room = rooms[i % rooms.length];
      const hour = hours[i % hours.length];
      
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + (movie.runtime || 120));
      
      await prisma.showtime.create({
        data: {
          movieId: movie.id,
          roomId: room.id,
          startTime,
          endTime,
          priceBase: 12.0,
        }
      });
      showtimeCount++;
    }
  }
  console.log(`✅ Seeded ${showtimeCount} dynamic showtimes.`);

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

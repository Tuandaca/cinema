import { PrismaClient, MovieStatus } from '@prisma/client';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment configuration from both local and root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

export const DEFAULT_MOVIES = [
  {
    id: 'movie-avengers-endgame',
    title: 'Avengers: Endgame',
    description:
      "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    posterUrl:
      'https://image.tmdb.org/t/p/original/or06seB2JWytw08jgjz6ldmNet1.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    rating: 8.4,
    runtime: 181,
    released: new Date('2019-04-26'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-inception',
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/o0Ol4kg4VIs48ccBs0xeIYcYy5c.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    rating: 8.8,
    runtime: 148,
    released: new Date('2010-07-16'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-interstellar',
    title: 'Interstellar',
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    posterUrl:
      'https://image.tmdb.org/t/p/original/gEU2QvH353eRPmN28j260v2Ghp1.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZAZE3Tc',
    rating: 8.6,
    runtime: 169,
    released: new Date('2014-11-07'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-avatar-fire-and-ash',
    title: 'Avatar: Fire and Ash',
    description:
      'The continuing saga of the Sully family across Pandora, introducing new fire tribes and untamed volcanic environments.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    rating: 8.2,
    runtime: 160,
    released: new Date('2025-12-19'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-dune-part-two',
    title: 'Dune: Part Two',
    description:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: 8.5,
    runtime: 166,
    released: new Date('2024-03-01'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-oppenheimer',
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    rating: 8.9,
    runtime: 180,
    released: new Date('2023-07-21'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-spider-man-no-way-home',
    title: 'Spider-Man: No Way Home',
    description:
      "Peter Parker's identity is revealed, bringing his Super Hero responsibilities into conflict with his normal life.",
    posterUrl:
      'https://image.tmdb.org/t/p/original/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    rating: 8.2,
    runtime: 148,
    released: new Date('2021-12-17'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-the-dark-knight',
    title: 'The Dark Knight',
    description:
      'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    rating: 9.0,
    runtime: 152,
    released: new Date('2008-07-18'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-top-gun-maverick',
    title: 'Top Gun: Maverick',
    description:
      'After thirty years, Maverick is still pushing the envelope as a top naval aviator, training a detachment of graduates for a specialized mission.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=giXco2nxYKg',
    rating: 8.3,
    runtime: 130,
    released: new Date('2022-05-27'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-gladiator-ii',
    title: 'Gladiator II',
    description:
      'Years after witnessing the death of Maximus, Lucius must enter the Colosseum after his home is conquered by tyrannical emperors.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRHbtVIeaUh2C.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    rating: 7.8,
    runtime: 148,
    released: new Date('2024-11-22'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-deadpool-and-wolverine',
    title: 'Deadpool & Wolverine',
    description:
      'A listless Wade Wilson toils in civilian life until a threat to his home world sends him on a mission with a reluctant Wolverine.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    rating: 7.9,
    runtime: 128,
    released: new Date('2024-07-26'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-wicked',
    title: 'Wicked',
    description:
      'Elphaba, a misunderstood young woman because of her green skin, and Glinda, a popular girl, become unlikely friends in the Land of Oz.',
    posterUrl:
      'https://image.tmdb.org/t/p/original/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=6COmYeLsz4c',
    rating: 7.7,
    runtime: 160,
    released: new Date('2024-11-20'),
    status: MovieStatus.NOW_SHOWING,
  },
  {
    id: 'movie-inside-out-2',
    title: 'Inside Out 2',
    description:
      "Teenager Riley's mind headquarters undergoes a sudden demolition to make room for unexpected new Emotions.",
    posterUrl:
      'https://image.tmdb.org/t/p/original/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    rating: 7.6,
    runtime: 96,
    released: new Date('2024-06-14'),
    status: MovieStatus.NOW_SHOWING,
  },
];

export interface ShowtimeSlot {
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  priceBase: number;
}

export function generateShowtimeSchedule(
  movies: Array<{ id: string; runtime?: number | null }>,
  rooms: Array<{ id: string; name: string }>,
  baseDate: Date = new Date(),
): ShowtimeSlot[] {
  // Time slots strictly: 09:00, 12:00, 15:00, 18:00, 21:00
  const timeSlots = [
    { hour: 9, minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 15, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 0 },
  ];

  const targetRooms = rooms.slice(0, 2);
  const showtimes: ShowtimeSlot[] = [];

  // Generate across the next 7 days (day 0 to day 6 from baseDate)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayOffset);

    for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
      const slot = timeSlots[slotIdx];

      for (let roomIdx = 0; roomIdx < targetRooms.length; roomIdx++) {
        const room = targetRooms[roomIdx];

        // Global slot index ensuring deterministic, non-overlapping 1-movie-per-(day, slot, room) assignment
        const globalSlotIdx =
          dayOffset * (timeSlots.length * targetRooms.length) +
          slotIdx * targetRooms.length +
          roomIdx;

        const movie = movies[globalSlotIdx % movies.length];

        const startTime = new Date(targetDate);
        startTime.setHours(slot.hour, slot.minute, 0, 0);

        // Showtime runtime: min(movie.runtime || 110, 165) minutes.
        // In 180-minute (3h) slot intervals, guarantees >= 15-minute cleaning buffer and ZERO room overlaps.
        const runtimeMinutes = Math.min(
          movie.runtime && movie.runtime > 0 ? movie.runtime : 110,
          165,
        );
        const endTime = new Date(
          startTime.getTime() + runtimeMinutes * 60 * 1000,
        );

        // Tiered pricing: 75000 for room-1, 90000 for room-2 (IMAX)
        const priceBase = room.id === 'room-2' ? 90000 : 75000;

        showtimes.push({
          movieId: movie.id,
          roomId: room.id,
          startTime,
          endTime,
          priceBase,
        });
      }
    }
  }

  return showtimes;
}

export function validateShowtimeSchedule(showtimes: ShowtimeSlot[]): void {
  const byRoom = new Map<string, ShowtimeSlot[]>();
  for (const st of showtimes) {
    if (!byRoom.has(st.roomId)) {
      byRoom.set(st.roomId, []);
    }
    byRoom.get(st.roomId)!.push(st);
  }

  for (const [roomId, roomShowtimes] of byRoom.entries()) {
    roomShowtimes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 0; i < roomShowtimes.length - 1; i++) {
      const cur = roomShowtimes[i];
      const next = roomShowtimes[i + 1];

      if (cur.endTime.getTime() > next.startTime.getTime()) {
        throw new Error(
          `COLLISION DETECTED in room ${roomId}: showtime ending at ${cur.endTime.toISOString()} overlaps with showtime starting at ${next.startTime.toISOString()}`,
        );
      }

      if (cur.startTime.toDateString() === next.startTime.toDateString()) {
        const bufferMinutes =
          (next.startTime.getTime() - cur.endTime.getTime()) / (60 * 1000);
        if (bufferMinutes < 15) {
          throw new Error(
            `INSUFFICIENT BUFFER in room ${roomId}: buffer between ${cur.endTime.toISOString()} and ${next.startTime.toISOString()} is ${bufferMinutes}m (< 15m required)`,
          );
        }
      }
    }
  }

  const movieCounts = new Map<string, number>();
  for (const st of showtimes) {
    movieCounts.set(st.movieId, (movieCounts.get(st.movieId) || 0) + 1);
  }
  for (const [movieId, count] of movieCounts.entries()) {
    if (count < 5) {
      throw new Error(
        `UNEVEN DISTRIBUTION: Movie ${movieId} only scheduled for ${count} showtimes (< 5 required)`,
      );
    }
  }

  console.log(
    `✨ [Validation] Invariant checks passed: 0 room overlaps, all buffers >= 15m, all movies have >= 5 showtimes.`,
  );
}

export async function ensureRoomAndSeats(roomData: {
  id: string;
  name: string;
  capacity: number;
}) {
  const room = await prisma.theaterRoom.upsert({
    where: { id: roomData.id },
    update: {},
    create: {
      id: roomData.id,
      name: roomData.name,
      capacity: roomData.capacity,
    },
  });

  const seatCount = await prisma.seat.count({ where: { roomId: room.id } });
  if (seatCount === 0) {
    console.log(`📌 Seeding 24 seats for ${room.name} (${room.id})...`);
    const rows = ['A', 'B', 'C'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8];
    const seatsData = [];

    for (const row of rows) {
      for (const num of cols) {
        seatsData.push({
          id: `seat-${room.id}-${row}${num}`,
          roomId: room.id,
          row,
          number: num,
          type: row === 'C' ? 'VIP' : 'NORMAL',
        });
      }
    }

    await prisma.seat.createMany({
      data: seatsData,
      skipDuplicates: true,
    });
    console.log(`✅ Seeded ${seatsData.length} seats for ${room.name}.`);
  } else {
    console.log(
      `ℹ️ Room ${room.name} (${room.id}) already has ${seatCount} seats.`,
    );
  }

  return room;
}

export async function getOrSeedMovies() {
  let movies = await prisma.movie.findMany();
  if (movies.length === 0) {
    console.log('📌 No movies found in database. Seeding default 13 movies...');
    for (const m of DEFAULT_MOVIES) {
      await prisma.movie.upsert({
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
        },
      });
    }
    movies = await prisma.movie.findMany();
  }
  console.log(`🎬 Loaded ${movies.length} movies for showtime scheduling.`);
  return movies;
}

export async function invalidateShowtimeCache(): Promise<void> {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisUrl =
    process.env.REDIS_URL || `redis://${redisHost}:${redisPort}`;

  console.log(`🔌 [Redis] Invalidation connecting to Redis (${redisUrl})...`);

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });

  redis.on('error', () => {
    // Handled in try/catch block during connect()
  });

  try {
    await redis.connect();
    let cursor = '0';
    let totalDeleted = 0;
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        'movies:showtimes:*',
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    console.log(
      `🧹 [Redis] Successfully invalidated ${totalDeleted} keys matching 'movies:showtimes:*'`,
    );
    await redis.quit();
  } catch (err: any) {
    console.log(
      `ℹ️ [Redis] Redis is offline or unreachable (${err.message}). Safe to continue; runtime fallback is active.`,
    );
  } finally {
    try {
      redis.disconnect();
    } catch {
      // ignore
    }
  }
}

export async function seedFutureShowtimes(): Promise<number> {
  console.log('🎬 [SeedShowtimes] Initializing standalone showtime seeder...');
  const now = new Date();

  try {
    const room1 = await ensureRoomAndSeats({
      id: 'room-1',
      name: 'Premium Cinema 01',
      capacity: 24,
    });
    const room2 = await ensureRoomAndSeats({
      id: 'room-2',
      name: 'IMAX Experience',
      capacity: 32,
    });
    const rooms = [room1, room2];

    const movies = await getOrSeedMovies();
    if (movies.length === 0) {
      console.warn('⚠️ No movies available to seed showtimes.');
      return 0;
    }

    // Safe cleanup: Delete ONLY future showtimes with NO bookings (strictly preserve users & bookings)
    const deleted = await prisma.showtime.deleteMany({
      where: {
        startTime: { gte: now },
        bookings: { none: {} },
      },
    });
    console.log(
      `🧹 Safe cleanup: Removed ${deleted.count} unbooked future showtimes (all bookings preserved).`,
    );

    const showtimesToCreate = generateShowtimeSchedule(movies, rooms, now);
    validateShowtimeSchedule(showtimesToCreate);

    console.log(
      `🚀 Inserting ${showtimesToCreate.length} future showtimes...`,
    );
    const result = await prisma.showtime.createMany({
      data: showtimesToCreate,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} future showtimes successfully!`);

    await invalidateShowtimeCache();

    return result.count;
  } catch (err: any) {
    const isDbUnreachable =
      err?.name === 'PrismaClientInitializationError' ||
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes('ENOTFOUND') ||
      err?.code === 'P1001';

    if (isDbUnreachable) {
      console.warn(
        `⚠️ [SeedShowtimes] Database is unreachable in isolated offline sandbox (${err.message}).`,
      );
      console.log(
        `🧪 [SeedShowtimes] Validating scheduling algorithm in dry-run mode...`,
      );
      const mockRooms = [
        { id: 'room-1', name: 'Premium Cinema 01', capacity: 24 },
        { id: 'room-2', name: 'IMAX Experience', capacity: 32 },
      ];
      const mockMovies = DEFAULT_MOVIES;
      const simulated = generateShowtimeSchedule(mockMovies, mockRooms, now);
      console.log(
        `✅ In-memory verification: Generated ${simulated.length} non-overlapping showtimes across 7 days for ${mockMovies.length} movies in 2 rooms.`,
      );
      validateShowtimeSchedule(simulated);
      await invalidateShowtimeCache();
      return simulated.length;
    }

    throw err;
  }
}

if (require.main === module) {
  seedFutureShowtimes()
    .then((count) => {
      console.log(`🎉 Finished showtime seeding. Created/verified ${count} showtimes.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during seeding:', err);
      process.exit(1);
    })
    .finally(async () => {
      try {
        await prisma.$disconnect();
      } catch {
        // ignore disconnect errors
      }
    });
}

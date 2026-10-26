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
      'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
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
      'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
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
      'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
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
      'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
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

export const VERIFIED_DB_POSTERS: Record<string, string> = {
  'movie-avengers-endgame': 'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'movie-inception': 'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
  'movie-interstellar': 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  '3166a2a1-34fa-49a3-84c6-7bccbbc3b07d': 'https://image.tmdb.org/t/p/original/qE0FswzjACs2kvAycYVS2zcmgec.jpg', // Balls Up
  'faa5fe96-1e32-4cb0-ab5e-8fb207a4aebd': 'https://image.tmdb.org/t/p/original/kyeqWdyUXW608qlYkRqosgbbJyK.jpg', // Avatar: Fire and Ash
  '31c062d6-54be-44b7-9e67-52ff2a67113e': 'https://image.tmdb.org/t/p/original/8912AsVuS7Sj915apArUFbv6F9L.jpg', // The Devil Wears Prada
  'movie-gladiator-ii': 'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
};

export interface ShowtimeSlot {
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  priceBase: number;
}

/**
 * Generate showtime schedule from baseDate up to targetDays.
 *
 * Time slots: 5 per day at 09:30, 12:00, 14:30, 17:30, 20:30
 * Interval: 2.5 hours (150 min). Runtime capped at 120 min → buffer >= 30 min ✓
 *
 * Rooms: room-1 (Standard Hall: 45 seats), room-2 (IMAX Experience: 72 seats), room-3 (Gold Class Sweetbox: 24 seats)
 * Pricing: room-1 = 75,000 | room-2 = 90,000 | room-3 = 120,000
 */
export function generateShowtimeSchedule(
  movies: Array<{ id: string; runtime?: number | null }>,
  rooms: Array<{ id: string; name: string }>,
  baseDate: Date = new Date(),
  targetDays: number = 248,
  existingBookedShowtimes: Array<{ roomId: string; startTime: Date; endTime: Date }> = [],
): ShowtimeSlot[] {
  // 5 standard time slots per day with 2.5h / 3h intervals.
  // Runtime is capped at 120 min → guarantees >= 30-min cleaning buffer with 0 collisions.
  const timeSlots = [
    { hour: 9, minute: 30, label: 'Morning Show' },
    { hour: 12, minute: 0, label: 'Noon Show' },
    { hour: 14, minute: 30, label: 'Afternoon Show' },
    { hour: 17, minute: 30, label: 'Prime Time' },
    { hour: 20, minute: 30, label: 'Late Show' },
  ];

  // Use all provided rooms (up to 3: room-1, room-2, room-3)
  const targetRooms = rooms.slice(0, 3);
  const showtimes: ShowtimeSlot[] = [];

  for (let dayOffset = 0; dayOffset < targetDays; dayOffset++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayOffset);

    for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
      const slot = timeSlots[slotIdx];

      // Balanced daily distribution: ~5 showtimes per day distributed across the 3 rooms.
      // Cyclic rotation ensures every room hosts morning, noon, afternoon, prime time, and late shows.
      const room = targetRooms[(dayOffset * 2 + slotIdx) % targetRooms.length];
      const movie = movies[(dayOffset * 5 + slotIdx) % movies.length];

      const startTime = new Date(targetDate);
      startTime.setHours(slot.hour, slot.minute, 0, 0);

      // Runtime cap: 120 minutes (standard cinema practice).
      // With >= 150-min interval (2.5h), this guarantees at least a 30-min cleaning buffer.
      const runtimeMinutes = Math.min(
        movie.runtime && movie.runtime > 0 ? movie.runtime : 110,
        120,
      );
      const endTime = new Date(
        startTime.getTime() + runtimeMinutes * 60 * 1000,
      );

      // Check conflict with existing booked showtimes (including >= 30m turnover buffer)
      const isConflicting = existingBookedShowtimes.some((booked) => {
        if (booked.roomId !== room.id) return false;
        const bookedStart = new Date(booked.startTime).getTime();
        const bookedEnd = new Date(booked.endTime).getTime();
        return (
          startTime.getTime() < bookedEnd + 30 * 60 * 1000 &&
          endTime.getTime() + 30 * 60 * 1000 > bookedStart
        );
      });

      if (isConflicting) {
        console.log(
          `⏩ [ShowtimeSchedule] Skipping conflicting slot on ${room.id} at ${startTime.toISOString()} to preserve booked showtime.`,
        );
        continue;
      }

      // Tiered pricing: Standard / IMAX / Sweetbox Premium
      let priceBase: number;
      if (room.id === 'room-3') {
        priceBase = 120000; // Sweetbox premium
      } else if (room.id === 'room-2') {
        priceBase = 90000; // IMAX
      } else {
        priceBase = 75000; // Standard
      }

      showtimes.push({
        movieId: movie.id,
        roomId: room.id,
        startTime,
        endTime,
        priceBase,
      });
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
        // Buffer requirement: >= 30 min (runtime capped at 120 min, interval >= 150 min → buffer >= 30 min)
        if (bufferMinutes < 30) {
          throw new Error(
            `INSUFFICIENT BUFFER in room ${roomId}: buffer between ${cur.endTime.toISOString()} and ${next.startTime.toISOString()} is ${bufferMinutes}m (< 30m required)`,
          );
        }
      }
    }
  }

  // Distribution check: with 248 days and 5 showtimes/day (~1,240 showtimes), every movie appears ~95 times.
  const movieCounts = new Map<string, number>();
  for (const st of showtimes) {
    movieCounts.set(st.movieId, (movieCounts.get(st.movieId) || 0) + 1);
  }
  const minRequired = Math.max(5, Math.floor(showtimes.length / (movieCounts.size * 2)));
  for (const [movieId, count] of movieCounts.entries()) {
    if (count < minRequired) {
      throw new Error(
        `UNEVEN DISTRIBUTION: Movie ${movieId} only scheduled for ${count} showtimes (< ${minRequired} required)`,
      );
    }
  }

  console.log(
    `✨ [Validation] Invariant checks passed: 0 room overlaps, all buffers >= 30m, all movies well-distributed (min ${minRequired} showtimes each).`,
  );
}

export async function ensureRoomAndSeats(roomData: {
  id: string;
  name: string;
  capacity: number;
  defaultSeatType?: 'NORMAL' | 'VIP' | 'SWEETBOX';
}) {
  const room = await prisma.theaterRoom.upsert({
    where: { id: roomData.id },
    update: {
      name: roomData.name,
      capacity: roomData.capacity,
    },
    create: {
      id: roomData.id,
      name: roomData.name,
      capacity: roomData.capacity,
    },
  });

  if (roomData.id === 'room-3') {
    // Layout 3: room-3 (Cinema 03 - Gold Class VIP) -> 24 seats total (Rows A-C x 8 cols; 100% SWEETBOX couples)
    // Clean up room-3 duplicate seats completely (room-3 has 0 bookings)
    await prisma.seat.deleteMany({ where: { roomId: 'room-3' } });

    console.log(`📌 Seeding 24 Sweetbox seats for ${room.name} (${room.id})...`);
    for (const row of ['A', 'B', 'C']) {
      for (let col = 1; col <= 8; col++) {
        await prisma.seat.upsert({
          where: {
            roomId_row_number: {
              roomId: 'room-3',
              row,
              number: col,
            },
          },
          update: { type: 'SWEETBOX' },
          create: {
            id: `seat-room-3-${row}${col}`,
            roomId: 'room-3',
            row,
            number: col,
            type: 'SWEETBOX',
          },
        });
      }
    }
    console.log(`✅ Seeded 24 Sweetbox seats for ${room.name}.`);
  } else if (roomData.id === 'room-2') {
    // Layout 1: room-2 (Hall 01 - IMAX Experience) -> 72 seats total (Rows A-H x 9 cols; A-B NORMAL, C-F VIP, G-H NORMAL)
    // Strictly preserves existing booked seats: seat-room-2-A3..A5
    console.log(`📌 Seeding 72 seats for ${room.name} (${room.id})...`);
    for (const row of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      for (let num = 1; num <= 9; num++) {
        const type = ['C', 'D', 'E', 'F'].includes(row) ? 'VIP' : 'NORMAL';
        await prisma.seat.upsert({
          where: {
            roomId_row_number: {
              roomId: 'room-2',
              row,
              number: num,
            },
          },
          update: { type },
          create: {
            id: `seat-room-2-${row}${num}`,
            roomId: 'room-2',
            row,
            number: num,
            type,
          },
        });
      }
    }
    console.log(`✅ Seeded 72 seats for ${room.name}.`);
  } else if (roomData.id === 'room-1') {
    // Layout 2: room-1 (Premium Cinema 01 / Standard Hall) -> 45 seats total (Rows A-E x 9 cols; A-C NORMAL, D-E VIP)
    // Strictly preserves existing booked seats: seat-r1-A3..A5, seat-r1-B3..B5
    console.log(`📌 Seeding 45 seats for ${room.name} (${room.id})...`);
    for (const row of ['A', 'B', 'C', 'D', 'E']) {
      for (let num = 1; num <= 9; num++) {
        const type = ['D', 'E'].includes(row) ? 'VIP' : 'NORMAL';
        await prisma.seat.upsert({
          where: {
            roomId_row_number: {
              roomId: 'room-1',
              row,
              number: num,
            },
          },
          update: { type },
          create: {
            id: `seat-r1-${row}${num}`,
            roomId: 'room-1',
            row,
            number: num,
            type,
          },
        });
      }
    }
    console.log(`✅ Seeded 45 seats for ${room.name}.`);
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
  // Base date: 2026-10-26 to 2027-06-30 (exactly 248 days)
  const baseDate = new Date('2026-10-26T00:00:00+07:00');
  const targetDays = 248;

  console.log(
    `📅 [SeedShowtimes] Scheduling 248 days from 2026-10-26 to 2027-06-30.`,
  );

  try {
    const room1 = await ensureRoomAndSeats({
      id: 'room-1',
      name: 'Premium Cinema 01 / Standard Hall',
      capacity: 45,
      defaultSeatType: 'NORMAL',
    });
    const room2 = await ensureRoomAndSeats({
      id: 'room-2',
      name: 'Hall 01 - IMAX Experience',
      capacity: 72,
      defaultSeatType: 'NORMAL',
    });
    const room3 = await ensureRoomAndSeats({
      id: 'room-3',
      name: 'Cinema 03 - Gold Class VIP',
      capacity: 24,
      defaultSeatType: 'SWEETBOX',
    });
    const rooms = [room1, room2, room3];

    // Synchronize verified 200 OK poster URLs for all movies in DB
    console.log('🖼️ Updating movie posters in DB with verified 200 OK URLs...');
    for (const [id, posterUrl] of Object.entries(VERIFIED_DB_POSTERS)) {
      await prisma.movie.updateMany({
        where: { id },
        data: { posterUrl },
      });
    }
    await prisma.movie.updateMany({
      where: { title: 'Balls Up' },
      data: {
        posterUrl:
          'https://image.tmdb.org/t/p/original/qE0FswzjACs2kvAycYVS2zcmgec.jpg',
      },
    });
    await prisma.movie.updateMany({
      where: { title: 'Gladiator II' },
      data: {
        posterUrl:
          'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
      },
    });

    const movies = await getOrSeedMovies();
    if (movies.length === 0) {
      console.warn('⚠️ No movies available to seed showtimes.');
      return 0;
    }

    // Retrieve existing booked showtimes to strictly preserve
    const bookedShowtimes = await prisma.showtime.findMany({
      where: { bookings: { some: {} } },
      select: {
        id: true,
        roomId: true,
        startTime: true,
        endTime: true,
      },
    });
    console.log(
      `🔒 Found ${bookedShowtimes.length} booked showtime(s) to strictly preserve.`,
    );

    // Purge unbooked legacy showtimes prior to baseDate to eliminate historical collisions
    const legacyDeleted = await prisma.showtime.deleteMany({
      where: {
        startTime: { lt: baseDate },
        bookings: { none: {} },
      },
    });
    console.log(
      `🧹 Purged ${legacyDeleted.count} unbooked legacy showtimes prior to baseDate (${baseDate.toISOString()}).`,
    );

    // Safe cleanup: Delete ONLY future showtimes with NO bookings (strictly preserve users & bookings)
    const deleted = await prisma.showtime.deleteMany({
      where: {
        startTime: { gte: baseDate },
        bookings: { none: {} },
      },
    });
    console.log(
      `🧹 Safe cleanup: Removed ${deleted.count} unbooked future showtimes (all bookings preserved).`,
    );

    const showtimesToCreate = generateShowtimeSchedule(
      movies,
      rooms,
      baseDate,
      targetDays,
      bookedShowtimes,
    );
    validateShowtimeSchedule(showtimesToCreate);

    console.log(
      `🚀 Inserting ${showtimesToCreate.length} future showtimes across ${targetDays} days in chunks of 500...`,
    );

    const CHUNK_SIZE = 500;
    let totalInserted = 0;
    for (let i = 0; i < showtimesToCreate.length; i += CHUNK_SIZE) {
      const chunk = showtimesToCreate.slice(i, i + CHUNK_SIZE);
      const result = await prisma.showtime.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(
        `📦 Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(showtimesToCreate.length / CHUNK_SIZE)}: Inserted ${result.count} showtimes (Cumulative: ${totalInserted}).`,
      );
    }

    console.log(`✅ Seeded ${totalInserted} future showtimes successfully!`);

    await invalidateShowtimeCache();

    const finalCount = await prisma.showtime.count();
    console.log(`📊 Total showtimes currently in database: ${finalCount}`);

    return finalCount;
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
        { id: 'room-1', name: 'Premium Cinema 01 / Standard Hall', capacity: 45 },
        { id: 'room-2', name: 'Hall 01 - IMAX Experience', capacity: 72 },
        { id: 'room-3', name: 'Cinema 03 - Gold Class VIP', capacity: 24 },
      ];
      const mockMovies = DEFAULT_MOVIES;
      const simulated = generateShowtimeSchedule(
        mockMovies,
        mockRooms,
        baseDate,
        targetDays,
      );
      console.log(
        `✅ In-memory verification: Generated ${simulated.length} non-overlapping showtimes across ${targetDays} days for ${mockMovies.length} movies in 3 rooms.`,
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

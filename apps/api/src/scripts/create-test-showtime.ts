
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const movieId = 'a2632637-778f-4c63-9ed2-9f24f636f1cf';
  const roomId = 'room-1';
  
  const showtime = await prisma.showtime.create({
    data: {
      id: 'test-showtime-1',
      movieId: movieId,
      roomId: roomId,
      startTime: new Date(Date.now() + 3600000), // 1 hour later
      endTime: new Date(Date.now() + 3600000 + 7200000), // 3 hours later
      priceBase: 100000
    }
  });
  console.log('✅ Created test showtime:', showtime.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());

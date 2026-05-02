
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const showtimes = await prisma.showtime.findMany({
    include: {
      movie: true,
      room: true
    }
  });
  console.log(JSON.stringify(showtimes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

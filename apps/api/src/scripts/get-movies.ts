
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const movies = await prisma.movie.findMany();
  console.log(JSON.stringify(movies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const romance = await prisma.movie.findMany({
    where: { genres: { some: { name: 'Romance' } } }
  });
  console.log("Romance movies:", romance.length);

  const comedy = await prisma.movie.findMany({
    where: { genres: { some: { name: 'Comedy' } } }
  });
  console.log("Comedy movies:", comedy.length);
  
  await prisma.$disconnect();
}
run();

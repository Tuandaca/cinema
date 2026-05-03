const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const moviesCount = await prisma.movie.count();
    const usersCount = await prisma.user.count();
    const showtimesCount = await prisma.showtime.count();
    
    console.log(`Movies: ${moviesCount}`);
    console.log(`Users: ${usersCount}`);
    console.log(`Showtimes: ${showtimesCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

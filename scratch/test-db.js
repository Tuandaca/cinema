const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing DB connection...');
    const movies = await prisma.movie.findMany({ take: 1 });
    console.log('Success! Found', movies.length, 'movies.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();

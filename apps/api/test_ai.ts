import { PrismaClient } from '@prisma/client';
import { MoviesService } from './src/movies/movies.service';
import { BookingService } from './src/booking/booking.service';
import { AiService } from './src/ai/ai.service';
import { PrismaService } from './src/prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function run() {
  const prisma = new PrismaClient() as any;
  const moviesService = new MoviesService(prisma);
  const bookingService = new BookingService(prisma);
  const aiService = new AiService(prisma, moviesService, bookingService);
  
  try {
    const res = await aiService.chat('test-user-id', null, 'tôi muốn tìm một phim tình cảm và có chút hài hước');
    console.log("FINAL CHAT RES:", JSON.stringify(res, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

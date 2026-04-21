import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the root of apps/api
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('🚀 Starting connectivity verification...');

  try {
    // 1. Verify Database
    console.log('📡 Checking Database connection (Supabase)...');
    await prisma.$connect();
    console.log('✅ Database: Connected successfully!');

    // Check if we can perform a simple query (count users)
    const userCount = await prisma.user.count();
    console.log(`📊 Database: Found ${userCount} users in the system.`);

    // 2. Placeholder for Redis (Phase 4)
    if (process.env.UPSTASH_REDIS_URL) {
      console.log('📡 Checking Redis connection (Upstash)...');
      console.log('ℹ️ Redis check script will be fully implemented in Phase 4.');
    } else {
      console.log('ℹ️ Redis URL not found in .env, skipping Redis check.');
    }

    console.log('\n✨ All systems check passed! You are ready for Phase 2.');
  } catch (error) {
    console.error('\n❌ Connectivity check failed!');
    console.error('Error details:', error.message);
    console.log('\n💡 Tip: Make sure your DATABASE_URL in apps/api/.env is correct and your IP is allowed in Supabase.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

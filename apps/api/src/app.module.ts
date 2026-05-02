import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MoviesModule } from './movies/movies.module';
import { BookingModule } from './booking/booking.module';
import { ComboModule } from './combo/combo.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    MoviesModule,
    BookingModule,
    ComboModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MoviesModule } from '../movies/movies.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [MoviesModule, BookingModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimesService } from './showtimes.service';
import { ShowtimesController } from './showtimes.controller';
import { Showtime } from './entities/showtime.entity';
import { Theater } from '../theaters/entities/theater.entity';
import { Movie } from 'src/movies/entities/movie.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { MoviesModule } from '../movies/movies.module'; // Import MoviesModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime, Movie, Theater, Booking]),
    MoviesModule, // Import MoviesModule here
  ],
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  exports: [ShowtimesService],
})
export class ShowtimesModule {}
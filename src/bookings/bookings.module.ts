import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { Theater } from '../theaters/entities/theater.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Showtime, Theater])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {} 
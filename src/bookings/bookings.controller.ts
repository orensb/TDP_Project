import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    try {
      return await this.bookingsService.create(createBookingDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 
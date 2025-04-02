import { IsNotEmpty, IsString,IsDate, Matches, IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsNumber()
  showtimeId: number;

  @IsNotEmpty()
  @IsNumber()
  seatNumber: number;

  @IsNotEmpty()
  @IsString()
  userId: string;
} 
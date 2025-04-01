import { IsNotEmpty, IsNumber, IsDate, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShowtimeDto {
  @IsNotEmpty()
  @IsString()
  movieTitle: string;

  @IsNotEmpty()
  @IsString()
  theaterName: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;
} 
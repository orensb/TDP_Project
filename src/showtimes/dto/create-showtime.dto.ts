import { IsNotEmpty, IsNumber, IsDate, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShowtimeDto {
  @IsNotEmpty()
  @IsNumber()
  movieId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @IsNotEmpty()
  @IsString()
  theater: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

} 

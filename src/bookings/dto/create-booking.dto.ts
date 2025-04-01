import { IsNotEmpty, IsString,IsDate, Matches, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
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

  @IsArray() // Ensure it's an array
  @ArrayNotEmpty() // Ensure it contains at least one element
  @IsString({ each: true }) // Ensure each element is a string
  @Matches(/^[1-9][0-9]?[A-H]$/, {
    message: 'Each seat identifier must be in format [1-10][A-H]',
    each: true, // Apply validation to each item in the array
  })
  seatIdentifiers: string[];

  @IsNotEmpty()
  @IsString()
  userName: string;
} 
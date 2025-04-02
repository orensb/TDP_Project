import { IsNotEmpty, IsNumber, IsString, Min, Max, Length, IsPositive } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  genre: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(1000)
  duration: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Max(10)
  rating: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1888)
  @Max(2100)
  releaseYear: number;
} 
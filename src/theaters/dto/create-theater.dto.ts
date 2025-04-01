import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateTheaterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(50)
  rows: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(50)
  columns: number;
} 
import { Controller, Get, Param, Post, Body , Delete } from '@nestjs/common';
import { TheatersService } from './theaters.service';
import { Theater } from './entities/theater.entity';
import { CreateTheaterDto } from './dto/create-theater.dto';

@Controller('theaters')
export class TheatersController {
  constructor(private theatersService: TheatersService) {}

  @Post()
  create(@Body() createTheaterDto: CreateTheaterDto): Promise<Theater> {
    return this.theatersService.create(createTheaterDto);
  }

  @Get()
  findAll(): Promise<Theater[]> {
    return this.theatersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Theater> {
    return this.theatersService.findOne(+id);
  }
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.theatersService.remove(+id);
  }
} 
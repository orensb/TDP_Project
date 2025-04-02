import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  create(@Body() createShowtimeDto: CreateShowtimeDto) {
    return this.showtimesService.create(createShowtimeDto);
  }
  @Get('all')
  findAll() {
    return this.showtimesService.findAll();
  }
  @Get('/:id')
  findById(@Param('id') id: number){
    return this.showtimesService.findById(id);
  }

  // @Get('movie/:title')
  // findByMovie(@Param('title') title: string) {
  //   return this.showtimesService.findByMovie(title);
  // }

  @Get('theaters/:theaterName')
  findByTheaters(@Param('theaterName') theaterName:string){
    return this.showtimesService.findByTheaters(theaterName);
  }

  @Post('update/:id')
  update(
    @Param('id') id: number,
     @Body() updateShowtimeDto: UpdateShowtimeDto) {
    return this.showtimesService.update(id,updateShowtimeDto);
  }

  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.showtimesService.remove(id);
  }

  @Get('/:id/seats')
  getSeats( @Param('id') id: number) {
    return this.showtimesService.getSeatMatrix(id);
  }
} 
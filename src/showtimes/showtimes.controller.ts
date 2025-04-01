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
  @Get('movie/:title')
  findByMovie(@Param('title') title: string) {
    return this.showtimesService.findByMovie(title);
  }

  @Get('theaters/:theaterName')
  findByTheaters(@Param('theaterName') theaterName:string){
    return this.showtimesService.findByTheaters(theaterName);
  }

  @Post('update/movie/:title/:id')
  update(
    @Param('title') title: string ,
    @Param('id') id: number,
     @Body() updateShowtimeDto: UpdateShowtimeDto) {
    return this.showtimesService.update(title, id,updateShowtimeDto);
  }

  @Delete('movie/:title')
  remove(@Param('title') title: string) {
    return this.showtimesService.remove(title);
  }

  @Get('movie/:title/seats')
  getSeats(@Param('title') title: string) {
    return this.showtimesService.getSeatMatrix(title);
  }
} 
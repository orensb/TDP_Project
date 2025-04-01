

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Theater } from '../theaters/entities/theater.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(Theater)
    private readonly theaterRepository: Repository<Theater>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(createShowtimeDto: CreateShowtimeDto) {
    // Validate movie exists
    console.log('Time start of Showtime: ' , createShowtimeDto.startTime)
    const movie = await this.movieRepository.findOne({
      where: { title: createShowtimeDto.movieTitle },
    });
    if (!movie) {
      throw new NotFoundException(`Movie "${createShowtimeDto.movieTitle}" not found`);
    }

    // Validate theater exists
    const theater = await this.theaterRepository.findOne({
      where: { name: createShowtimeDto.theaterName },
    });
    if (!theater) {
      throw new NotFoundException(`Theater "${createShowtimeDto.theaterName}" not found`);
    }
      // Generate empty seat matrix
    const seatMatrix = [];
    for (let row = 1; row <= theater.rows; row++) {
      const rowSeats = [];
      for (let colIndex = 0; colIndex < theater.columns; colIndex++) {
        const column = String.fromCharCode(65 + colIndex);
        const seatId = `${row}${column}`;
        rowSeats.push({ seatId, row, column, status: 'A' });
      }
      seatMatrix.push(rowSeats);
    }

    // Check for overlapping showtimes
    await this.checkOverlappingShowtimes(
      createShowtimeDto.theaterName,
      createShowtimeDto.startTime,
      createShowtimeDto.endTime,
    );

    // Create and save the showtime
    const startTimeReal = new Date(createShowtimeDto.startTime);
    startTimeReal.setMinutes(startTimeReal.getMinutes() + startTimeReal.getTimezoneOffset()); // Normalize to local time

    const endTimeReal = new Date(createShowtimeDto.endTime);
    endTimeReal.setMinutes(endTimeReal.getMinutes() + endTimeReal.getTimezoneOffset()); // Normalize to local time
    console.log(`Checking overlap for:  Start = ${startTimeReal}, End = ${endTimeReal}`);

    // const startTimeReal = new Date(createShowtimeDto.startTime).toISOString(); // Converts to UTC
    // const endTimeReal = new Date(createShowtimeDto.endTime).toISOString();

    const showtime = this.showtimeRepository.create({
      ...createShowtimeDto,
      startTime: startTimeReal,
      endTime: endTimeReal,
      seatMatrix,
    });
    //  const showtime = this.showtimeRepository.create({
    //   ...createShowtimeDto,
    //   seatMatrix,
    // });
    // return this.showtimeRepository.save(showtime);
    this.showtimeRepository.save(showtime);
    const startISO = new Date(createShowtimeDto.startTime).toISOString(); // Converts to UTC
    const endISO = new Date(createShowtimeDto.endTime).toISOString();

    const showtime_for_return = this.showtimeRepository.create({
      ...createShowtimeDto,
      startTime: startISO,
      endTime: endISO,
      seatMatrix,
    });
    return showtime_for_return;

  }

  // async findAll() {
  //   return this.showtimeRepository.find();
  // }
  async findAll() {
    const showtimes = await this.showtimeRepository.find({
      select: ['id', 'movieTitle', 'theaterName', 'startTime', 'endTime', 'price'],
    });
  
    return showtimes.map(showtime => {
      const startTimeReal = new Date(showtime.startTime);
      startTimeReal.setMinutes(startTimeReal.getMinutes() - startTimeReal.getTimezoneOffset());
  
      const endTimeReal = new Date(showtime.endTime);
      endTimeReal.setMinutes(endTimeReal.getMinutes() - endTimeReal.getTimezoneOffset());
  
      return {
        ...showtime,
        startTime: startTimeReal,
        endTime: endTimeReal,
      };
    });
  }
  

  async findByMovie(movieTitle: string) {
    const showtimes = await this.showtimeRepository.find({
      where: { movieTitle },
      select: ['id', 'movieTitle', 'theaterName', 'startTime', 'endTime', 'price']
    });
    if (!showtimes.length) {
      throw new NotFoundException(`No showtimes found for movie "${movieTitle}"`);
    }
    return showtimes.map(showtime => {
      const startTimeReal = new Date(showtime.startTime);
      startTimeReal.setMinutes(startTimeReal.getMinutes() - startTimeReal.getTimezoneOffset());
  
      const endTimeReal = new Date(showtime.endTime);
      endTimeReal.setMinutes(endTimeReal.getMinutes() - endTimeReal.getTimezoneOffset());
  
      return {
        ...showtime,
        startTime: startTimeReal,
        endTime: endTimeReal,
      };
    });
  }

  async findByTheaters(theaterName: string){
    const showtimes = await this.showtimeRepository.find({
      where: {theaterName},
      select: ['id', 'movieTitle', 'theaterName', 'startTime', 'endTime', 'price']
    })
    if (!showtimes.length){
      throw new NotFoundException(`No Show in theater "${theaterName}"`)
    }
    return showtimes
  }

  async update(movieTitle: string, id:number ,  updateShowtimeDto: UpdateShowtimeDto) {
    const showtime = await this.showtimeRepository.findOne({
      where: { movieTitle , id}
    });
    if (!showtime) {
      throw new NotFoundException(`No showtime found for movie "${movieTitle}"`);
    }

    // If updating theater, validate it exists
    if (updateShowtimeDto.theaterName) {
      const theater = await this.theaterRepository.findOne({
        where: { name: updateShowtimeDto.theaterName }
      });
      if (!theater) {
        throw new NotFoundException(`Theater "${updateShowtimeDto.theaterName}" not found`);
      }
    }

    let newStartTime = showtime.startTime;
    let newEndTime = showtime.endTime;

    if (updateShowtimeDto.startTime) {
        console.log("HI")
        newStartTime = new Date(updateShowtimeDto.startTime);
        newStartTime.setMinutes(newStartTime.getMinutes() + newStartTime.getTimezoneOffset());
    }

    if (updateShowtimeDto.endTime) {
        newEndTime = new Date(updateShowtimeDto.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + newEndTime.getTimezoneOffset());
    }

    // Check for overlaps if updating time or theater
    if (updateShowtimeDto.startTime || updateShowtimeDto.endTime || updateShowtimeDto.theaterName) {
        await this.checkOverlappingShowtimes(
            updateShowtimeDto.theaterName || showtime.theaterName,
            newStartTime,
            newEndTime,
            showtime.id
        );
    }

    // Update and save
    const updatedShowtime = {
        ...showtime,
        ...updateShowtimeDto,
        startTime: newStartTime,
        endTime: newEndTime
    };

    this.showtimeRepository.save(updatedShowtime);
    const startISO = new Date(updateShowtimeDto.startTime).toISOString(); // Converts to UTC
    const endISO = new Date(updateShowtimeDto.endTime).toISOString();

    const showtime_for_return = {
      ...showtime,
        ...updateShowtimeDto,
      startTime: startISO,
      endTime: endISO,
    };
    return showtime_for_return;
  }

  async remove(movieTitle: string) {
    const showtime = await this.showtimeRepository.findOne({
      where: { movieTitle }
    });
    if (!showtime) {
      throw new NotFoundException(`No showtime found for movie "${movieTitle}"`);
    }

    // Check if there are any bookings for this showtime
    const bookings = await this.bookingRepository.find({
      where: { showtimeId: showtime.id }
    });
    if (bookings.length > 0) {
      throw new BadRequestException('Cannot delete showtime with existing bookings');
    }

    return this.showtimeRepository.remove(showtime);
  }

  async getSeatMatrix(movieTitle: string) {
    const showtime = await this.showtimeRepository.findOne({
      where: { movieTitle },
      relations: ['movie', 'theater']
    });
    if (!showtime) {
      throw new NotFoundException(`No showtime found for movie "${movieTitle}"`);
    }

    const theater = await this.theaterRepository.findOne({
      where: { name: showtime.theaterName }
    });

    // Get all bookings for this showtime
    const bookings = await this.bookingRepository.find({
      where: { showtimeId: showtime.id }
    });

    // Create a Set of booked seats for efficient lookup
    const bookedSeats = new Set(bookings.map(booking => booking.seatIdentifier));

    // Generate the seat matrix
    const seatMatrix = [];
    for (let row = 1; row <= theater.rows; row++) {
      const rowSeats = [];
      for (let colIndex = 0; colIndex < theater.columns; colIndex++) {
        const column = String.fromCharCode(65 + colIndex);
        const seatId = `${row}${column}`;
        const status = bookedSeats.has(seatId) ? 'N' : 'A';
        rowSeats.push({ seatId, row, column, status });
      }
      seatMatrix.push(rowSeats);
    }

    return {
      movieTitle: showtime.movieTitle,
      theater: theater.name,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      price: showtime.price,
      seatMatrix
    };
  }

  private async checkOverlappingShowtimes(theaterName: string, startTime: Date, endTime: Date, excludeId?: number) {
    const hasOverlap = await this.hasOverlap(theaterName, startTime, endTime, excludeId);
    if (hasOverlap) {
      throw new BadRequestException('Showtime overlaps with existing showtimes for this theater');
    }
  }
  private async hasOverlap(theaterName: string, startTime: Date, endTime: Date, excludeId?: number) {
    // Ensure these are properly formatted Date objects
    const startTimeReal = new Date(startTime);
    startTimeReal.setMinutes(startTimeReal.getMinutes() + startTimeReal.getTimezoneOffset()); // Normalize to local time

    const endTimeReal = new Date(endTime);
    endTimeReal.setMinutes(endTimeReal.getMinutes() + endTimeReal.getTimezoneOffset()); // Normalize to local time

    // const startTimeReal = new Date(startTime).toISOString(); // Converts to UTC
    // const endTimeReal = new Date(endTime).toISOString();
  
  
    const overlappingShowtimes = await this.showtimeRepository.createQueryBuilder('showtime')
      .where('showtime.theaterName = :theaterName', { theaterName })
      .andWhere(
        '(showtime.startTime < :endTime AND showtime.endTime > :startTime)',
        { startTime: startTimeReal, endTime: endTimeReal }
      )
      .getMany();
    if (overlappingShowtimes.length > 0) {
      const overlappingDetails = overlappingShowtimes.map(showtime => {
        const start_overlap = new Date(showtime.startTime);
        start_overlap.setMinutes(start_overlap.getMinutes() - start_overlap.getTimezoneOffset()); // Normalize to local time
    
        const end_overlap = new Date(showtime.endTime);
        end_overlap.setMinutes(end_overlap.getMinutes() - end_overlap.getTimezoneOffset()); // Normalize to local time
        return {
          start: start_overlap, // or use startTimeReal if you want the Date object instead of string
          end: end_overlap, // or use endTimeReal if you want the Date object instead of string
        };
      });

      throw new BadRequestException({
        message: 'Showtime overlaps with existing showtimes for this theater.',
        overlappingDetails,
      });
    }

  // Return true if no overlaps were found
  return false;
  }
}


  


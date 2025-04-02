

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
      where: { id: createShowtimeDto.movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie "${createShowtimeDto.movieId}" not found`);
    }

    // Validate theater exists
    const theater = await this.theaterRepository.findOne({
      where: { name: createShowtimeDto.theater },
    });
    if (!theater) {
      throw new NotFoundException(`Theater "${createShowtimeDto.theater}" not found`);
    }
      // Generate empty seat matrix
    const seatMatrix = [];
    for (let row = 0; row < theater.rows; row++) {
      const rowSeats = [];
      for (let col = 1; col <= theater.columns; col++) {
        const seatId = parseInt(`${row}${col}`); // Combine row and column as a number
        rowSeats.push({ seatId, row, col, status: 'A' });
      }
      seatMatrix.push(rowSeats);
    }

    // Check for overlapping showtimes
    await this.checkOverlappingShowtimes(
      createShowtimeDto.theater,
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
    
    const savedShowtime = await this.showtimeRepository.save(showtime);
    const startISO = new Date(createShowtimeDto.startTime).toISOString(); // Converts to UTC
    const endISO = new Date(createShowtimeDto.endTime).toISOString();
    // Map the saved showtime to the desired response format
    return {
      id: savedShowtime.showtimeId, // Map showtimeId to id
      price: (savedShowtime.price), // Ensure price is a number
      movieId: savedShowtime.movieId, // Map movieid to movieId
      theater: savedShowtime.theater, // Map theaterName to theater
      startTime: startISO, // Convert to ISO string
      endTime: endISO, // Convert to ISO string
    };

  }

  
  async findAll() {
    const showtimes = await this.showtimeRepository.find({
      select: ['showtimeId','movieId', 'price', 'theater', 'startTime', 'endTime'],
    });
  
    return showtimes.map(showtime => {
      const startTimeReal = new Date(showtime.startTime);
      startTimeReal.setMinutes(startTimeReal.getMinutes() - startTimeReal.getTimezoneOffset());
  
      const endTimeReal = new Date(showtime.endTime);
      endTimeReal.setMinutes(endTimeReal.getMinutes() - endTimeReal.getTimezoneOffset());
  
      return {
        id: showtime.showtimeId, // Map showtimeId to id
      movieId: showtime.movieId,
      price: showtime.price, // Ensure price is returned as a number
      theater: showtime.theater,
        startTime: startTimeReal,
        endTime: endTimeReal,
      };
    });
  }
  async findById(showtimeId : number){
    const showtime = await this.showtimeRepository.findOne({
      where: { showtimeId },
      select: ['showtimeId', 'movieId', 'price', 'theater', 'startTime', 'endTime'],
    });
  
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID "${showtimeId}" not found`);
    }
    const startTimeReal = new Date(showtime.startTime);
    startTimeReal.setMinutes(startTimeReal.getMinutes() - startTimeReal.getTimezoneOffset());
  
    const endTimeReal = new Date(showtime.endTime);
    endTimeReal.setMinutes(endTimeReal.getMinutes() - endTimeReal.getTimezoneOffset());
  
    return {
      id: showtime.showtimeId, // Map showtimeId to id
      movieId: showtime.movieId,
      price: showtime.price, // Ensure price is returned as a number
      theater: showtime.theater,
      startTime: startTimeReal,
      endTime: endTimeReal,
    };
  }

  // async findByMovie(movieTitle: string) {
  //   const showtimes = await this.showtimeRepository.find({
  //     where: { movieTitle },
  //     select: ['id', 'movieTitle', 'theaterName', 'startTime', 'endTime', 'price','seatMatrix']
  //   });
  //   if (!showtimes.length) {
  //     throw new NotFoundException(`No showtimes found for movie "${movieTitle}"`);
  //   }
  //   return showtimes.map(showtime => {
  //     const startTimeReal = new Date(showtime.startTime);
  //     startTimeReal.setMinutes(startTimeReal.getMinutes() - startTimeReal.getTimezoneOffset());
  
  //     const endTimeReal = new Date(showtime.endTime);
  //     endTimeReal.setMinutes(endTimeReal.getMinutes() - endTimeReal.getTimezoneOffset());
  
  //     return {
  //       ...showtime,
  //       startTime: startTimeReal,
  //       endTime: endTimeReal,
  //     };
  //   });
  // }

  async findByTheaters(theater: string){
    const showtimes = await this.showtimeRepository.find({
      where: {theater},
      select: ['movieId', 'price', 'theater', 'startTime', 'endTime']
    })
    if (!showtimes.length){
      throw new NotFoundException(`No Show in theater "${theater}"`)
    }
    return showtimes
  }

  async update( showtimeId:number ,  updateShowtimeDto: UpdateShowtimeDto) {
    const showtime = await this.showtimeRepository.findOne({
      where: { showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(`No showtime found for movie "${showtimeId}"`);
    }
    // If updating theater, validate it exists
    if (updateShowtimeDto.theater) {
      const theater = await this.theaterRepository.findOne({
        where: { name: updateShowtimeDto.theater }
      });
      if (!theater) {
        throw new NotFoundException(`Theater "${updateShowtimeDto.theater}" not found`);
      }
    }

   

    // Check for overlaps if updating time or theater
    if (updateShowtimeDto.startTime || updateShowtimeDto.endTime || updateShowtimeDto.theater) {
        await this.checkOverlappingShowtimes(
            updateShowtimeDto.theater || showtime.theater,
            updateShowtimeDto.startTime || showtime.startTime,
            updateShowtimeDto.endTime || showtime.endTime,
            showtimeId

        );
    }
    let newStartTime = showtime.startTime;
    let newEndTime = showtime.endTime;

    if (updateShowtimeDto.startTime) {
        newStartTime = new Date(updateShowtimeDto.startTime);
        newStartTime.setMinutes(newStartTime.getMinutes() + newStartTime.getTimezoneOffset());
    }

    if (updateShowtimeDto.endTime) {
        newEndTime = new Date(updateShowtimeDto.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + newEndTime.getTimezoneOffset());
    }
    console.log(`Start Time : ${newStartTime}`);
    console.log(`End Time : ${newEndTime}`);
    // Update and save
    const updatedShowtime = {
        ...showtime,
        ...updateShowtimeDto,
        startTime: newStartTime,
        endTime: newEndTime
    };

    const savedShowtime =  await this.showtimeRepository.save(updatedShowtime);
    let startISO = new Date(showtime.startTime);
    startISO.setMinutes(startISO.getMinutes() - startISO.getTimezoneOffset());

    let endISO = new Date(showtime.endTime);
    endISO.setMinutes(endISO.getMinutes() - endISO.getTimezoneOffset());


    if (updateShowtimeDto.startTime) {
      let startISO = new Date(updateShowtimeDto.startTime).toISOString();
       }

    if (updateShowtimeDto.endTime) {
      let endISO = new Date(updateShowtimeDto.endTime).toISOString();
    }
   
    const showtime_for_return = {
      id: savedShowtime.showtimeId, // Map showtimeId to id
      price: (savedShowtime.price), // Ensure price is a number
      movieId: savedShowtime.movieId, // Map movieid to movieId
      theater: savedShowtime.theater, // Map theaterName to theater
      startTime: startISO, // Convert to ISO string
      endTime: endISO , // Convert to ISO string
    };
    // console.log(showtime_for_return);
    return showtime_for_return;
  }

  async remove(showtimeId: number) {
    const showtime = await this.showtimeRepository.findOne({
      where: { showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(`No showtime found for movie "${showtimeId}"`);
    }
  }

  async getSeatMatrix( showtimeId:number) {
    const showtimes = await this.showtimeRepository.find({
      where: { showtimeId },
      select: ['showtimeId','movieId', 'price', 'theater', 'startTime', 'endTime','seatMatrix']
    });
    if (!showtimes.length) {
      throw new NotFoundException(`No showtimes found for movie "${showtimeId}"`);
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

  async checkOverlappingShowtimes(theater: string, startTime: Date, endTime: Date, excludeId?: number) {
    const hasOverlap = await this.hasOverlap(theater, startTime, endTime, excludeId);
    if (hasOverlap) {
      throw new BadRequestException('Showtime overlaps with existing showtimes for this theater');
    }
  }
  async hasOverlap(theater: string, startTime: Date, endTime: Date, excludeId?: number) {
    // Ensure these are properly formatted Date objects
    const startTimeReal = new Date(startTime);
    startTimeReal.setMinutes(startTimeReal.getMinutes() + startTimeReal.getTimezoneOffset()); // Normalize to local time

    const endTimeReal = new Date(endTime);
    endTimeReal.setMinutes(endTimeReal.getMinutes() + endTimeReal.getTimezoneOffset()); // Normalize to local time

    // const startTimeReal = new Date(startTime).toISOString(); // Converts to UTC
    // const endTimeReal = new Date(endTime).toISOString();
    console.log(`Checking overlap for theater: ${theater}`);
    console.log(`Start Time: ${startTimeReal}`);
    console.log(`End Time: ${endTimeReal}`);
  
    const query = await this.showtimeRepository.createQueryBuilder('showtime')
      .where('showtime.theater = :theater', { theater })
      .andWhere(
        '(showtime.startTime <= :endTime AND showtime.endTime >= :startTime)',
        { startTime: startTimeReal, endTime: endTimeReal }
      );

      if (excludeId) {
        query.andWhere('showtime.showtimeId != :excludeId', { excludeId });
      }
    
      const overlappingShowtimes = await query.getMany();
    

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
        statusCode: 400,
        message: 'Showtime overlaps with existing showtimes for this theater',
        error: 'Bad Request',

        overlappingDetails,
      });
    }

  // Return true if no overlaps were found
  return false;
  }
}


  


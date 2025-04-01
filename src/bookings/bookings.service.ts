import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Showtime } from '../showtimes/entities/showtime.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Showtime)
    private showtimeRepository: Repository<Showtime>,
    private connection: Connection,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    // Start a transaction to ensure concurrent booking safety
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const normalizedStartTime = new Date(createBookingDto.startTime);

      const showtime = await queryRunner.manager.findOne(Showtime, {
        where: {
          movieTitle: createBookingDto.movieTitle,
          theaterName: createBookingDto.theaterName,
          startTime: normalizedStartTime, // Use normalized Date object
        },
      });
    
      
      if (!showtime) {
        throw new NotFoundException(
          `No showtime found for movie "${createBookingDto.movieTitle}" in theater "${createBookingDto.theaterName}" at ${createBookingDto.startTime}`
        );
      }
      
      const bookedSeats = [];
      for (const seatIdentifier of createBookingDto.seatIdentifiers) {
        const result = await this.processBooking(
          seatIdentifier,
          showtime,
          createBookingDto.userName,
          queryRunner
        );
        if (!result.success) {
          throw new ConflictException(result.message);
        }
        bookedSeats.push(result.seatInfo);
      }
      await queryRunner.commitTransaction();

    return {
      success: true,
      message: `Successfully booked ${bookedSeats.length} seats`,
      bookedSeats,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

  private async processBooking(
    seatIdentifier: string, 
    showtime: Showtime, 
    userName: string,
    queryRunner: any
  ) {
    try {
      const { rowIndex, columnIndex, updatedSeat } = this.processSeatBooking(
        seatIdentifier,
        showtime,
        userName
      );
  
      await queryRunner.manager.save(showtime);
  
      return {
        success: true,
        message: `Successfully booked seat ${seatIdentifier}`,
        seatInfo: updatedSeat
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          success: false,
          message: `Seat ${seatIdentifier} is already booked. Please select a different seat.`
        };
      } else {
        throw error; // Other errors should not be handled here
      }
    }
  }
  

  /**
   * Parse, validate, and update seat status in the showtime matrix
   * @param seatIdentifier The seat identifier in format [1-10][A-H]
   * @param showtime The showtime entity with seat matrix
   * @param userName The name of the user booking the seat
   * @returns The seat coordinates and updated seat info
   */
  private processSeatBooking(seatIdentifier: string, showtime: Showtime, userName: string) {
    // Validate seat format
    const regex = /^([1-9]|10)([A-H])$/;
    if (!regex.test(seatIdentifier)) {
      throw new BadRequestException('Invalid seat format. Must be [1-10][A-H]');
    }
    
    // Parse the seat identifier
    const row = parseInt(seatIdentifier.match(/^([1-9]|10)/)[0]);
    const column = seatIdentifier.charAt(seatIdentifier.length - 1);
    const columnIndex = column.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
    
    // Validate the seat exists in the matrix
    if (row < 1 || row > showtime.seatMatrix.length || 
        columnIndex < 0 || columnIndex >= showtime.seatMatrix[0].length) {
      throw new BadRequestException('Invalid seat identifier for this theater');
    }
    
    // Check if seat is available
    const rowIndex = row - 1;
    if (showtime.seatMatrix[rowIndex][columnIndex].status === 'N') {
      throw new ConflictException(`Seat ${seatIdentifier} is already booked`);
    }
    
    // Update the seat status
    showtime.seatMatrix[rowIndex][columnIndex].status = 'N';
    showtime.seatMatrix[rowIndex][columnIndex].userName = userName;
    
    return {
      rowIndex,
      columnIndex,
      updatedSeat: showtime.seatMatrix[rowIndex][columnIndex]
    };
  }
}
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { v4 as uuidv4 } from 'uuid';

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
      const normalizedStartTime = new Date(createBookingDto.showtimeId);
      normalizedStartTime.setMinutes(normalizedStartTime.getMinutes() + normalizedStartTime.getTimezoneOffset() )

      const showtime = await queryRunner.manager.findOne(Showtime, {
        where: {
          showtimeId: createBookingDto.showtimeId, // Ensure this matches the entity property name
        },
      });
    
      
      if (!showtime) {
        throw new NotFoundException(
          `No showtime found for showid "${createBookingDto.showtimeId}"`
        );
      }
      
        const result = await this.processBooking(
          createBookingDto.seatNumber,
          showtime,
          createBookingDto.userId ,
          queryRunner
        );
        if (!result.success) {
          throw new ConflictException(result.message);
        }
      await queryRunner.commitTransaction();
      return {
       "bookingId": this.generateBookingId()
      };
    // return {
    //   success: true,
    //   message: `Successfully booked ${createBookingDto.seatNumber} seats`,
    // };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

  private async processBooking(
    seatNumber: number, 
    showtime: Showtime, 
    userId : string ,
    queryRunner: any
  ) {
    try {
      const { rowIndex, colIndex, updatedSeat } = this.processSeatBooking(
        seatNumber,
        showtime,
        userId,
      );
  
      await queryRunner.manager.save(showtime);
  
      return {
        success: true,
        message: `Successfully booked seat ${seatNumber}`,
        seatInfo: updatedSeat
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          success: false,
          message: `Seat ${seatNumber} is already booked. Please select a different seat.`
        };
      } else {
        throw error; // Other errors should not be handled here
      }
    }
  }
  
  private generateBookingId(): string {
    return uuidv4();
  }
  /**
   * Parse, validate, and update seat status in the showtime matrix
   * @param seatIdentifier The seat identifier in format [1-10][A-H]
   * @param showtime The showtime entity with seat matrix
   * @param userName The name of the user booking the seat
   * @returns The seat coordinates and updated seat info
   */
  private processSeatBooking(seatNumber: number, showtime: Showtime , userId:string) {
    // Validate seat format
    
    
    // Parse the seat identifier
    const row = Math.floor(seatNumber / 10); // Extract the left digit as the row
    const col = seatNumber % 10; // Extract the right digit as the column

    
    // Validate the seat exists in the matrix
    if (row < 0 || row >= showtime.seatMatrix.length || 
        col < 1 || col > showtime.seatMatrix[0].length) {

      throw new BadRequestException('Invalid seat identifier for this theater');
    }
    
    // Check if seat is available
    const rowIndex = row;
    const colIndex = col - 1; // Adjust column index to be 0-based
    if (showtime.seatMatrix[rowIndex][colIndex].status === 'N') {
      throw new ConflictException(`Seat ${seatNumber} is already booked`);
    }
    
    // Update the seat status
    showtime.seatMatrix[rowIndex][colIndex].status = 'N';
    showtime.seatMatrix[rowIndex][colIndex].userName = userId
    
    return {
      rowIndex,
      colIndex,
      updatedSeat: showtime.seatMatrix[rowIndex][colIndex]
    };
  }
}
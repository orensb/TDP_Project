// entities/showtime.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Theater } from '../../theaters/entities/theater.entity';

@Entity()
export class Showtime {

  @PrimaryGeneratedColumn()
  showtimeId: number;

  @Column()
  movieId: number;

  @Column('decimal', { precision: 10, scale: 2 ,  transformer: {
    to: (value: number) => value, // Store as is
    from: (value: string) => parseFloat(value), // Convert to number when retrieving
  }})
  price: number;

  @Column()
  theater: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column('json')
  seatMatrix: {
    seatId: number;
    row: number;
    column: number;
    status: 'A' | 'N'; // Available or Not available
    userName?: string; // Optional: store who booked it
  }[][];

  // @ManyToOne(() => Movie)
  // @JoinColumn({ name: 'movieTitle', referencedColumnName: 'title' })
  // movie: Movie;
  @ManyToOne(() => Movie, (movie) => movie.showtimes, { onDelete: 'CASCADE' })
  movie: Movie;

  @ManyToOne(() => Theater, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'theater', referencedColumnName: 'name' })
  theater1: Theater;
}
// entities/showtime.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Theater } from '../../theaters/entities/theater.entity';

@Entity()
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieTitle: string;

  @Column()
  theaterName: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('json')
  seatMatrix: {
    seatId: string;
    row: number;
    column: string;
    status: 'A' | 'N'; // Available or Not available
    userName?: string; // Optional: store who booked it
  }[][];

  // @ManyToOne(() => Movie)
  // @JoinColumn({ name: 'movieTitle', referencedColumnName: 'title' })
  // movie: Movie;
  @ManyToOne(() => Movie, (movie) => movie.showtimes, { onDelete: 'CASCADE' })
  movie: Movie;

  @ManyToOne(() => Theater)
  @JoinColumn({ name: 'theaterName', referencedColumnName: 'name' })
  theater: Theater;
}
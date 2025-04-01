import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @Column()
  duration: number;

  @Column('decimal', { precision: 3, scale: 1 })
  rating: number;

  @Column()
  releaseYear: number;

  @OneToMany(() => Showtime, (showtime) => showtime.movie)
  showtimes: Showtime[];
} 
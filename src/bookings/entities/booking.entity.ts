import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  showtimeId: number;

  @Column()
  seatIdentifier: string;

  @Column()
  userName: string;

} 
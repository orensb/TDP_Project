import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

@Entity()
export class Theater {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  rows: number;

  @Column()
  columns: number;

  @OneToMany(() => Showtime, (showtime) => showtime.theater)
  showtimes: Showtime[];
} 
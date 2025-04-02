import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theater } from './entities/theater.entity';
import { CreateTheaterDto } from './dto/create-theater.dto';

@Injectable()
export class TheatersService implements OnModuleInit {
  constructor(
    @InjectRepository(Theater)
    private theaterRepository: Repository<Theater>,
  ) {}

  async onModuleInit() {
    const count = await this.theaterRepository.count();
    if (count === 0) {
      // Initialize theaters if none exist
      for (let i = 1; i <= 4; i++) {
        await this.create({
          name: `Theater ${i}`,
          rows: 10,
          columns: 8,
        });
      }
      await this.create({
        name: 'Sample Theater',
        rows: 10,
        columns: 8,
      }); 
    }
  }

  async create(createTheaterDto: CreateTheaterDto): Promise<Theater> {
    const theater = this.theaterRepository.create(createTheaterDto);
    return this.theaterRepository.save(theater);
  }

  async findAll(): Promise<Theater[]> {
    return this.theaterRepository.find();
  }

  async findOne(id: number): Promise<Theater> {
    return this.theaterRepository.findOne({ where: { id } });
  }
  async remove(id: number) {
    const movie = await this.findOne(id);
    return this.theaterRepository.remove(movie);
  }
} 
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto) {
    const exist_movie = await this.moviesRepository.findOne({where : {title: createMovieDto.title},
    });
    if (exist_movie) {
      throw new NotFoundException(`Movie with title "${createMovieDto.title}" already exists`);
    }
    const movie = this.moviesRepository.create(createMovieDto);
    return this.moviesRepository.save(movie);
      
  }

  async findAll() {
    return this.moviesRepository.find();
  }

  async findOne(title: string) {
    const movie = await this.moviesRepository.findOne({ where: { title } });
    if (!movie) {
      throw new NotFoundException(`Movie with title: ${title} not found`);
    }
    return movie;
  }

  async findByTitle(title: string) {
    const movie = await this.moviesRepository.findOne({ where: { title } });
    if (!movie) {
      throw new NotFoundException(`Movie with title ${title} not found`);
    }
    return movie;
  }

  async update(title: string, updateMovieDto: UpdateMovieDto) {
    const movie = await this.findByTitle(title);
    const updatedMovie = { ...movie, ...updateMovieDto };
    return this.moviesRepository.save(updatedMovie);
  }

  async remove(title: string) {
    const movie = await this.findByTitle(title);
    return this.moviesRepository.remove(movie);
  }
  
} 
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';


describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: Partial<Record<keyof Repository<Movie>, jest.Mock>>;

  const mockMovie = {
    title: 'Test Movie',
    genre: 'Action',
    duration: 120,
    rating: 8.5,
    releaseYear: 2023
  };

  beforeEach(async () => {
    movieRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: movieRepository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should successfully create a movie', async () => {
      const createDto: CreateMovieDto = mockMovie;
      
      movieRepository.findOne.mockResolvedValue(null);
      movieRepository.create.mockReturnValue(createDto);
      movieRepository.save.mockResolvedValue(createDto);

      const result = await service.create(createDto);
      expect(result).toEqual(createDto);
      expect(movieRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException for duplicate movie title', async () => {
      const createDto: CreateMovieDto = mockMovie;
      
      movieRepository.findOne.mockResolvedValue(mockMovie);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(`Movie with title "${createDto.title}" already exists`)
      );
    });
  });

  describe('findAll()', () => {
    it('should return array of movies', async () => {
      movieRepository.find.mockResolvedValue([mockMovie]);
      
      const result = await service.findAll();
      expect(result).toEqual([mockMovie]);
      expect(movieRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a movie by title', async () => {
      movieRepository.findOne.mockResolvedValue(mockMovie);
      
      const result = await service.findOne('Test Movie');
      expect(result).toEqual(mockMovie);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { title: 'Test Movie' }
      });
    });

    it('should throw NotFoundException for non-existent title', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('Unknown Movie')).rejects.toThrow(
        new NotFoundException(`Movie with title: Unknown Movie not found`)
      );
    });
  });

  describe('update()', () => {
    it('should update movie details', async () => {
      const updateDto: UpdateMovieDto = { rating: 9.0 };
      const updatedMovie = { ...mockMovie, ...updateDto };

      movieRepository.findOne.mockResolvedValue(mockMovie);
      movieRepository.save.mockResolvedValue(updatedMovie);

      const result = await service.update('Test Movie', updateDto);
      expect(result).toEqual(updatedMovie);
      expect(movieRepository.save).toHaveBeenCalledWith(updatedMovie);
    });

    it('should throw error when updating non-existent movie', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      
      await expect(service.update('Unknown Movie', {}))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should remove a movie', async () => {
      movieRepository.findOne.mockResolvedValue(mockMovie);
      movieRepository.remove.mockResolvedValue(mockMovie);

      const result = await service.remove('Test Movie');
      expect(result).toEqual(mockMovie);
      expect(movieRepository.remove).toHaveBeenCalledWith(mockMovie);
    });

    it('should throw error when removing non-existent movie', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      
      await expect(service.remove('Unknown Movie'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTitle()', () => {
    it('should return movie by title with proper error', async () => {
      movieRepository.findOne.mockResolvedValue(mockMovie);
      
      const result = await service.findByTitle('Test Movie');
      expect(result).toEqual(mockMovie);
    });

    it('should format error message correctly for missing title', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findByTitle('Unknown Movie')).rejects.toThrow(
        new NotFoundException(`Movie with title Unknown Movie not found`)
      );
    });
  });

  
describe('DTO Validation', () => {
    it('should enforce validation rules through DTO', async () => {
      const dto = new CreateMovieDto();
      
      // Assign invalid values
      dto.title = '';
      dto.genre = '';
      dto.duration = 0;
      dto.rating = -1;
      dto.releaseYear = 1887;
  
      // Validate the DTO
      const errors = await validate(dto);
  
      // Expect errors to be thrown
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
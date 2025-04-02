import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimesService } from './showtimes.service';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Theater } from '../theaters/entities/theater.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('ShowtimesService', () => {
  let service: ShowtimesService;
  let showtimeRepository: MockRepository;
  let movieRepository: MockRepository;
  let theaterRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimesService,
        {
          provide: getRepositoryToken(Showtime),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Theater),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ShowtimesService>(ShowtimesService);
    showtimeRepository = module.get<MockRepository>(getRepositoryToken(Showtime));
    movieRepository = module.get<MockRepository>(getRepositoryToken(Movie));
    theaterRepository = module.get<MockRepository>(getRepositoryToken(Theater));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a showtime', async () => {
      const createDto: CreateShowtimeDto = {
        movieId: 1,
        theater: 'Test Theater',
        startTime: new Date('2025-04-01T12:00:00Z'),
        endTime: new Date('2025-04-01T14:00:00Z'),
        price: 12.99
      };

      movieRepository.findOne.mockResolvedValue({ id: 1, title: 'Test Movie' });
      theaterRepository.findOne.mockResolvedValue({ 
        id: 1, 
        name: 'Test Theater', 
        rows: 10, 
        columns: 10 
      });
      showtimeRepository.save.mockResolvedValue({ 
        ...createDto, 
        showtimeId: 1,
        seatMatrix: []
      });

      const result = await service.create(createDto);
      expect(result).toHaveProperty('id', 1);
      expect(showtimeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent movie', async () => {
      const createDto: CreateShowtimeDto = {
        movieId: 999,
        theater: 'Test Theater',
        startTime: new Date(),
        endTime: new Date(),
        price: 12.99
      };

      movieRepository.findOne.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all showtimes with adjusted times', async () => {
      const mockShowtimes = [{
        showtimeId: 1,
        movieId: 1,
        theater: 'Theater A',
        startTime: new Date('2025-04-01T12:00:00Z'),
        endTime: new Date('2025-04-01T14:00:00Z'),
        price: 12.99
      }];

      showtimeRepository.find.mockResolvedValue(mockShowtimes);
      const result = await service.findAll();
      expect(result[0].startTime).toBeInstanceOf(Date);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a showtime by ID', async () => {
      const mockShowtime = {
        showtimeId: 1,
        movieId: 1,
        theater: 'Theater A',
        startTime: new Date(),
        endTime: new Date(),
        price: 12.99
      };

      showtimeRepository.find.mockResolvedValue([mockShowtime]);
      const result = await service.findById(1);
      expect(result[0]).toHaveProperty('id', 1);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      showtimeRepository.find.mockResolvedValue([]);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should successfully update a showtime', async () => {
      const existingShowtime = {
        showtimeId: 1,
        movieId: 1,
        theater: 'Old Theater',
        startTime: new Date(),
        endTime: new Date(),
        price: 10.99
      };

      const updateDto: UpdateShowtimeDto = { price: 14.99 };
      
      showtimeRepository.findOne.mockResolvedValue(existingShowtime);
      theaterRepository.findOne.mockResolvedValue({ name: 'Old Theater' });
      showtimeRepository.save.mockResolvedValue({ ...existingShowtime, ...updateDto });

      const result = await service.update(1, updateDto);
      expect(result.price).toEqual(14.99);
    });
  });

  describe('remove', () => {
    it('should successfully remove a showtime', async () => {
      const mockShowtime = { showtimeId: 1 };
      showtimeRepository.findOne.mockResolvedValue(mockShowtime);
      showtimeRepository.remove.mockResolvedValue(mockShowtime);
      
      const result = await service.remove(1);
      expect(result).toEqual(mockShowtime);
    });
  });

  describe('getSeatMatrix', () => {
    it('should return seat matrix for movie', async () => {
      const mockShowtimes = [{
        showtimeId: 1,
        movieId: 1,
        theater: 'Theater A',
        seatMatrix: [[{ seatId: 1, status: 'A' }]]
      }];

      showtimeRepository.find.mockResolvedValue(mockShowtimes);
      const result = await service.getSeatMatrix(1);
      expect(result[0].seatMatrix[0][0].status).toBe('A');
    });
  });

  describe('hasOverlap', () => {
    it('should detect overlapping showtimes', async () => {
      const mockOverlapping = [{
        showtimeId: 2,
        startTime: new Date('2025-04-01T13:00:00Z'),
        endTime: new Date('2025-04-01T15:00:00Z')
      }];

      showtimeRepository.createQueryBuilder.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOverlapping)
      }));

      await expect(service.hasOverlap(
        'Test Theater',
        new Date('2025-04-01T12:00:00Z'),
        new Date('2025-04-01T14:00:00Z')
      )).rejects.toThrow(BadRequestException);
    });
  });
});

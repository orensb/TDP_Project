import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createConnection } from 'typeorm'; 

import { ShowtimesModule } from '../src/showtimes/showtimes.module';
import { MoviesModule } from '../src/movies/movies.module';
import { TheatersModule } from '../src/theaters/theaters.module';
import { BookingsModule } from '../src/bookings/bookings.module';

import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { Theater } from '../src/theaters/entities/theater.entity';
import { Booking } from '../src/bookings/entities/booking.entity';

jest.setTimeout(30000);

describe('Showtimes E2E Tests', () => {
  let app: INestApplication;
  let movieId: number;
  let theaterName = 'Sample Theater';
  let createdShowtimeId: number;
  let showtimeId: number;
  let bookingId: string;

  beforeAll(async () => {
    // Create a temporary connection to manage database setup
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'popcorn-palace',
      password: 'popcorn-palace',
      database: 'popcorn-palace', // Connect to the main DB to create the test DB
      entities: [Showtime, Movie, Theater, Booking],

    });

    // Drop the test database if it already exists
    try {
      await connection.query('DROP DATABASE IF EXISTS "popcorn-palace-test"');
    } catch (err) {
      console.log('Could not drop test database:', err);
    }

    // Create a fresh test database
    try {
      await connection.query('CREATE DATABASE "popcorn-palace-test"');
    } catch (err) {
      console.log('Could not create test database:', err);
    }

    await connection.close(); // Close temporary connection

    // ✅ Now initialize the NestJS application using the test database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'popcorn-palace',
          password: 'popcorn-palace',
          database: 'popcorn-palace-test', // Use test DB
          entities: [Showtime, Movie, Theater, Booking],
          synchronize: true, // Sync schema automatically
        }),
        ShowtimesModule,
        MoviesModule,
        TheatersModule,
        BookingsModule,

      ],
    }).compile();


    app = moduleFixture.createNestApplication();
    await app.init();

    // Seed test movie
    const movieResponse = await request(app.getHttpServer())
      .post('/movies')
      .send({ 
        title: 'Inception', 
        genre: 'Sci-Fi', 
        duration: 148, 
        rating: 8.8, 
        releaseYear: 2010 
      });

    movieId = movieResponse.body.id;
    if (movieResponse.status !== 201) {
        throw new Error('Failed to create movie');
      }

    // Seed test theater
    await request(app.getHttpServer())
      .post('/theaters')
      .send({ 

        name: theaterName, 
        rows: 10, 
        columns: 15 
      });
      const showtimeRes = await request(app.getHttpServer())
      .post('/showtimes')
      .send({
        movieId: movieId,
        theater: theaterName,
        startTime: '2025-04-02T12:00:00Z',
        endTime: '2025-04-02T14:30:00Z',
        price: 12.99
      });
    createdShowtimeId = showtimeRes.body.id;
    if (!createdShowtimeId) {
        throw new Error('Failed to create showtime');
      }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/showtimes (POST)', () => {

    it('should reject overlapping showtimes', async () => {
      await request(app.getHttpServer())
        .post('/showtimes')
        .send({
          movieId: movieId,
          theater: theaterName,
          startTime: '2025-04-02T13:00:00Z',
          endTime: '2025-04-02T15:00:00Z',
          price: 14.99
        })
        .expect(400)
        .expect(res => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            message: 'Showtime overlaps with existing showtimes for this theater',
            error: 'Bad Request'
          });
        });
    });
  });

  describe('/showtimes/all (GET)', () => {
    it('should retrieve all showtimes', async () => {
      const response = await request(app.getHttpServer())
        .get('/showtimes/all')
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            movieId: expect.any(Number),
            theater: expect.any(String)
          })
        ])
      );
    });
  });

  describe('/showtimes/:id (GET)', () => {
    it('should get a specific showtime', async () => {
      const response = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}`)
        .expect(200);

      expect(response.body).toEqual({ 
        id: createdShowtimeId,
      movieId: movieId,
      theater: theaterName,
      price: 12.99, // Ensure price is a number
      startTime: expect.any(String), // Include startTime
      endTime: expect.any(String), // Include
    });
    });
  });

  describe('/showtimes/update/:id (POST)', () => {
    it('should update a showtime price', async () => {
      const response = await request(app.getHttpServer())
        .post(`/showtimes/update/${createdShowtimeId}`)
        .send({ price: 14.99 })
        .expect(201);

      expect(response.body).toMatchObject({
        id: createdShowtimeId,
        price: 14.99
      });
    });
  });

  describe('/showtimes/movie/:id/seats (GET)', () => {
    it('should get seat matrix', async () => {
      const response = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}/seats`)
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            seatMatrix: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  seatId: expect.any(Number),
                  status: expect.stringMatching(/A|N/)
                })
              ])
            ])
          })
        ])
      );
    });
});


  
  // Movies Tests
  describe('Movies', () => {
    it('should create and retrieve movies', async () => {
      const newMovie = {
        title: 'The Matrix',
        genre: 'Sci-Fi',
        duration: 136,
        rating: 8.7,
        releaseYear: 1999
      };

      // Test creation
      const createRes = await request(app.getHttpServer())
        .post('/movies')
        .send(newMovie)
        .expect(201);

      // Test retrieval
      const getRes = await request(app.getHttpServer())
        .get(`/movies/${newMovie.title}`)
        .expect(200);

      expect(getRes.body).toMatchObject(newMovie);
    });

    it('should update movie details', async () => {
      const updateRes = await request(app.getHttpServer())
        .post('/movies/update/Inception')
        .send({ rating: 9.0 })
        .expect(201);

      expect(updateRes.body.rating).toBe(9.0);
    });

    
  });

  // Bookings Tests
  describe('Bookings', () => {
    it('should create and confirm booking', async () => {
      const bookingRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          showtimeId: createdShowtimeId,
          seatNumber: 5,
          userId: '123e4567-e89b-12d3-a456-426614174000'
        })
        .expect(201);

      bookingId = bookingRes.body.bookingId;
    //   expect(bookingId).toMatch(/^[0-9a-f-]{36}$/); // UUID validation

      // Verify seat status
      const seatsRes = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}/seats`)
        .expect(200);

      const bookedSeat = seatsRes.body[0].seatMatrix
        .flat()
        .find((s: any) => s.seatId === 5);
      expect(bookedSeat.status).toBe('N');
    });

    it('should prevent double booking', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          showtimeId: createdShowtimeId,
          seatNumber: 5,
          userId: 'user-456'
        })
        .expect(400);
    });

    describe('/showtimes/:id (DELETE)', () => {
        it('should delete a showtime', async () => {
          await request(app.getHttpServer())
            .delete(`/showtimes/${createdShowtimeId}`)
            .expect(200);
    
          await request(app.getHttpServer())
            .get(`/showtimes/${createdShowtimeId}`)
            .expect(404);
        });
      });
         it('should delete a movie', async () => {
      await request(app.getHttpServer())
        .delete('/movies/Inception')
        .expect(200);

      await request(app.getHttpServer())
        .get('/movies/Inception')
        .expect(404);
    });
  });

  // Full Workflow Test
  describe('Full User Journey', () => {
    it('should complete movie->showtime->booking flow', async () => {
      // Create movie
      const movieRes = await request(app.getHttpServer())
        .post('/movies')
        .send({
          title: 'Interstellar',
          genre: 'Sci-Fi',
          duration: 169,
          rating: 8.6,
          releaseYear: 2014
        });

      // Create showtime
      const showtimeRes = await request(app.getHttpServer())
        .post('/showtimes')
        .send({
          movieId: movieRes.body.id,
          theater: theaterName,
          startTime: '2025-04-02T18:00:00Z',
          endTime: '2025-04-02T20:30:00Z',
          price: 14.99
        });

      // Create booking
      const bookingRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          showtimeId: showtimeRes.body.id,
          seatNumber: 10,
          userId: 'user-789'
        });

      // Verify all components
      await request(app.getHttpServer())
        .get(`/movies/${movieRes.body.title}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/showtimes/${showtimeRes.body.id}`)
        .expect(200);
    });
  });
});






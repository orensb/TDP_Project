# Movie Ticket Booking System API Documentation

## System Requirements
- Node.js v18+
- PostgreSQL 15+
- Docker Engine 24+
- NestJS CLI 10+

I use this Youtube Tutorial to study : https://www.youtube.com/watch?v=8_X0nSrzrCw


### 1. Database Configuration
```
# Use the provided compose.yml
# Using postgres for DataBase , and pgAdmin for viewing the DB
services:
  db:
    image: postgres
    environment:
      POSTGRES_USER: popcorn-palace
      POSTGRES_PASSWORD: popcorn-palace
      POSTGRES_DB: popcorn-palace
    ports:
      - "5432:5432"
```
Start/Create DataBase :
```
docker-compose up -d
```
Delete the DateBase:
```
docker-compose down
docker volume rm popcorn_palace_typescript_postgres_data

```

### 3. Running & Test the Application
```
npm Install command line : npm install

# Development mode
npm run start:dev

# Production build
npm run build && npm run start:prod

# Test Mode
Unit test: npm run test
E2E test: npm run test:e2e
Coverage test: npm run test:cov
```

## API Endpoints

1. Acess the Application via:
    http://localhost:3000
2. API Endpoints:
```
        Movies: /movies
        Theaters: /theaters
        Showtimes: /showtimes
        Bookings: /bookings
```
## Movie Management
```

| Endpoint                  | Method | Description                     |
|---------------------------|--------|---------------------------------|
| `/movies`                 | POST   | Create new movie                |
| `/movies/all`             | GET    | List all movies                 |
| `/movies/{title}`         | GET    | Get movie by title              |
| `/movies/update/{title}`  | POST | Update movie details              |
| `/movies/{title}`         | DELETE | Remove movie                    |

Exapmle of a Movie DTO:
    {   
    "title": "Sample Movie Title", 
    "genre": "Action", 
    "duration": 120, 
    "rating": 8.7, 
    "releaseYear": 2025
    }
```
<u>Key constraints:<u>
- Cant create two movies with the same name

## Showtime Management
```

| Endpoint                          | Method | Description                                                      |
|-----------------------------------|--------|------------------------------------------------------------------|
| `/showtimes`                      | POST   | Create a new showtime
| `/showtimes/all`                  | GET    | Retrieve all showtimes
| `/showtimes/{id}`                 | GET    | Get specific showtime details by its ID.                        |
| `/showtimes/theaters/{name}`      | GET    | List all showtimes for a specific theater.                      |
| `/showtimes/update/{id}`          | POST   | Update showtime details with overlap checks. |
| `/showtimes/{id}`                 | DELETE | Delete a specific showtime by its ID.                           |
| `/showtimes/{id}/seats`           | GET    | Retrieve the seat matrix for a showtime (A = Available, N = Booked). |

Example of Showtime DTO:
{ 
    "movieId": 1, 
    "price":20.2, 
    "theater": "Sample Theater", 
    "startTime": "2025-02-14T11:47:46.125405Z", 
    "endTime": "2025-02-14T14:47:46.125405Z" 
}
```
- Showtime is the main DB, were the Booking ticket system is connecting to and update his DB.
- We also have the Seat Matrix for the Showtime based on the size of the Theater, and flag if a seat is Available.

<u>Key constraints:<u>
- Automatic seat matrix generation based on theater capacity, all the seat are Available(A)
- Overlapping showtime check, by same theater.
    the checking exclude the same showtime we when to update/create (one showtime doesnt ovelap with himself)

## Seat Matrix
Based on Theater size, every showtime created, create a Defualt Seat Matrix, which corsponde the size.
The seat Matrix detail:
```
    SeatId -> the exact [row][col] we want to order. rows start from 0 and col from 1 (new line new tens digit)
    Row
    Colum
    Status: 'A' for Available and 'N' for Booked
    userName: exist only if someone booked an seat, otherwise doesnt show.
```
With the Seat Matrix We making sure now seat is booked twice, and we know how booked too.

## Ticket Booking System
```

| Endpoint                          | Method | Description                                                      |
|-----------------------------------|--------|------------------------------------------------------------------|
| `/bookings`                       | POST   | Create a new booking for a specific showtime and seat number     |

Example of Booking DTO:
{ 
    "showtimeId": 1,
    "seatNumber": 15 , 
    userId:"84438967-f68f-4fa0-b620-0f08217e76af" 
}
```

<u>Booking process features:<u>
- One by One operation (Atomic)
- Seat status validation
- UUID generation for bookings ID as response body.
- Update the seat Matrix for the speficif showTime (will be 'N' and adding the UserId)


## Theaters Management

```
| Endpoint             | Method | Description                                      |
|----------------------|--------|--------------------------------------------------|
| `/theaters`          | POST   | Create a new theater with row and column         |
| `/theaters/{id}`     | GET    | Retrieve details of a specific theater by id     |
| `/theaters/{name}`   | DELETE | Delete a theater by its id                       |

```

## Testing Guidelines
Run full test suite:
```
npm run test:e2e
```
- creating a new Test Database, which earse himself everytime (otherwise we will have collision)
- Checking every function that have an E2E interface

Unit Test: bpm run test

- Test each function by itself with some scenario 


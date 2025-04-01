import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TheatersController } from './theaters.controller';
import { TheatersService } from './theaters.service';
import { Theater } from './entities/theater.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Theater])],
  controllers: [TheatersController],
  providers: [TheatersService],
  exports: [TheatersService],
})
export class TheatersModule {} 
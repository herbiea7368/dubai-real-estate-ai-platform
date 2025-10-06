import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermitsController } from './permits.controller';
import { PermitsService } from './permits.service';
import { Permit } from './entities/permit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permit])],
  controllers: [PermitsController],
  providers: [PermitsService],
  exports: [PermitsService],
})
export class PermitsModule {}

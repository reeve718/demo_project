import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Dataset } from './entities/dataset.entity';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset])],
  controllers: [DatasetsController],
  providers: [DatasetsService],
  exports: [DatasetsService, TypeOrmModule],
})
export class DatasetsModule {}
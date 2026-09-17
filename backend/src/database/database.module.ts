import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Dataset } from '../datasets/entities/dataset.entity';
import { GeoFeature } from '../features/entities/geo-feature.entity';

/**
 * Wires TypeORM to the PostGIS container using environment variables.
 *
 * `synchronize` is intentionally false. Schema is managed by the SQL
 * init scripts under `db/init/`, which is the recommended pattern for
 * anything beyond throwaway prototypes.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'db'),
        port: parseInt(config.get<string>('POSTGRES_PORT', '5432'), 10),
        username: config.get<string>('POSTGRES_USER', 'geocatalog'),
        password: config.get<string>('POSTGRES_PASSWORD', 'geocatalog'),
        database: config.get<string>('POSTGRES_DB', 'geocatalog'),
        entities: [Dataset, GeoFeature],
        synchronize: false,
        logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
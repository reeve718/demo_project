import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { DatabaseModule } from './database/database.module';
import { DatasetsModule } from './datasets/datasets.module';
import { FeaturesModule } from './features/features.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    DatasetsModule,
    FeaturesModule,
  ],
  providers: [LoggingInterceptor, AllExceptionsFilter],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
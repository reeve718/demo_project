import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // Global validation: strip unknown properties, coerce primitives, reject extras.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Global filter to normalise error envelopes.
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  // Lightweight access logging.
  app.useGlobalInterceptors(new LoggingInterceptor());

  // API global prefix for everything except Swagger's documentation paths.
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'api/docs', method: RequestMethod.GET },
      { path: 'api/docs-json', method: RequestMethod.GET },
      { path: 'api/docs/(.*)', method: RequestMethod.GET },
    ],
  });

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GeoCatalog Explorer API')
    .setDescription('Synthetic dataset catalogue and spatial feature API.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.BACKEND_PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');

  Logger.log(`Geocatalog API listening on http://0.0.0.0:${port}`, 'Bootstrap');
}

void bootstrap();
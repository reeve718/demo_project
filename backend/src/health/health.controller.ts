import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiSuccessEnvelope } from '../common/api-success.interface';

interface HealthBody {
  status: 'ok';
  service: 'geocatalog-api';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe.' })
  @ApiOkResponse({
    description: 'Service is up.',
    schema: { example: { data: { status: 'ok', service: 'geocatalog-api' } } },
  })
  check(): ApiSuccessEnvelope<HealthBody> {
    return { data: { status: 'ok', service: 'geocatalog-api' } };
  }
}
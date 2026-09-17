import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns ok status', () => {
    const result = controller.check();
    expect(result.data.status).toBe('ok');
    expect(result.data.service).toBe('geocatalog-api');
  });
});
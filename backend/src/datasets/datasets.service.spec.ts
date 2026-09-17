import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiException } from '../common/http-exception';
import { Dataset } from './entities/dataset.entity';
import { DatasetsService } from './datasets.service';

interface FakeDatasetRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  publisher: string;
  license: string;
  tags: string[];
  updatedAt: Date;
  createdAt: Date;
  bbox: unknown;
  fields: unknown;
}

function makeRepo(rows: FakeDatasetRow[]): Pick<Repository<Dataset>, 'createQueryBuilder' | 'findOne'> {
  const matchSlug = (slug: string) => rows.find((r) => r.slug === slug) ?? null;

  const qb: any = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
  };

  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOne: jest.fn().mockImplementation(({ where }: { where: { slug: string } }) =>
      Promise.resolve(matchSlug(where.slug)),
    ),
  };
}

describe('DatasetsService', () => {
  it('returns empty result when no datasets match', async () => {
    const repo = makeRepo([]);
    const module = await Test.createTestingModule({
      providers: [
        DatasetsService,
        { provide: getRepositoryToken(Dataset), useValue: repo },
      ],
    }).compile();
    const service = module.get(DatasetsService);

    const result = await service.list({
      q: 'nothing-matches',
      page: 1,
      pageSize: 10,
    } as any);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('projects a row into a DatasetSummaryDto with safe defaults', async () => {
    const rows: FakeDatasetRow[] = [
      {
        id: 'id-1',
        slug: 'demo',
        title: 'Demo',
        description: 'desc',
        theme: 'Environment',
        publisher: 'pub',
        license: 'lic',
        tags: ['a', 'b'],
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        bbox: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
        fields: [{ name: 'id', alias: 'ID', type: 'text', nullable: false }],
      },
    ];
    const repo = makeRepo(rows);
    const module = await Test.createTestingModule({
      providers: [
        DatasetsService,
        { provide: getRepositoryToken(Dataset), useValue: repo },
      ],
    }).compile();
    const service = module.get(DatasetsService);

    const result = await service.list({ page: 1, pageSize: 10 } as any);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('demo');
    expect(result.items[0].bbox).toEqual([0, 0, 1, 1]);
    expect(result.items[0].tags).toEqual(['a', 'b']);
  });

  it('throws ApiException(404) when slug is not found', async () => {
    const repo = makeRepo([]);
    const module = await Test.createTestingModule({
      providers: [
        DatasetsService,
        { provide: getRepositoryToken(Dataset), useValue: repo },
      ],
    }).compile();
    const service = module.get(DatasetsService);

    await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(ApiException);
  });
});
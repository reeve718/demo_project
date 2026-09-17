import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiException } from '../common/http-exception';
import { Dataset } from './entities/dataset.entity';
import { BboxTuple, DatasetSummaryDto } from './dto/dataset-summary.dto';
import { DatasetDetailDto, DatasetFieldDto } from './dto/dataset-detail.dto';
import { ListDatasetsQuery } from './dto/list-datasets.query';

/**
 * Data access + business logic for the catalogue.
 *
 * The controller stays thin: it hands parsed query DTOs to this service
 * and projects the returned records to the API DTOs.
 */
@Injectable()
export class DatasetsService {
  private readonly logger = new Logger(DatasetsService.name);

  constructor(
    @InjectRepository(Dataset)
    private readonly repo: Repository<Dataset>,
  ) {}

  /**
   * Paginated catalogue listing with optional keyword and theme filters.
   */
  async list(query: ListDatasetsQuery): Promise<{ items: DatasetSummaryDto[]; total: number }> {
    const qb = this.repo.createQueryBuilder('d');

    if (query.q && query.q.length > 0) {
      // ILIKE on title and description plus ANY on tags array. Parameters
      // are passed via setParameter so user input is never string-concatenated.
      const pattern = `%${query.q}%`;
      qb.andWhere(
        '(d.title ILIKE :pattern OR d.description ILIKE :pattern OR EXISTS (SELECT 1 FROM unnest(d.tags) tag WHERE tag ILIKE :pattern))',
        { pattern },
      );
    }

    if (query.theme) {
      qb.andWhere('d.theme = :theme', { theme: query.theme });
    }

    qb.orderBy('d.updated_at', 'DESC').take(query.pageSize).skip((query.page - 1) * query.pageSize);

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map((row) => this.toSummary(row));
    return { items, total };
  }

  /**
   * Detail lookup by slug. Throws 404 ApiException when missing so the
   * global filter can return the standard envelope.
   */
  async findBySlug(slug: string): Promise<DatasetDetailDto> {
    const row = await this.repo.findOne({ where: { slug } });
    if (!row) {
      throw new ApiException(404, 'DATASET_NOT_FOUND', `Dataset '${slug}' was not found.`);
    }
    return this.toDetail(row);
  }

  /**
   * Internal helper: resolves a dataset id from its slug, returning the
   * record so the features service can reuse the existing pattern.
   */
  async findBySlugOrFail(slug: string): Promise<Dataset> {
    const row = await this.repo.findOne({ where: { slug } });
    if (!row) {
      throw new ApiException(404, 'DATASET_NOT_FOUND', `Dataset '${slug}' was not found.`);
    }
    return row;
  }

  private toSummary(row: Dataset): DatasetSummaryDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      theme: row.theme,
      publisher: row.publisher,
      license: row.license,
      updatedAt: row.updatedAt.toISOString(),
      tags: row.tags ?? [],
      bbox: this.readBbox(row.bbox),
    };
  }

  private toDetail(row: Dataset): DatasetDetailDto {
    return {
      ...this.toSummary(row),
      fields: this.readFields(row.fields),
    };
  }

  /**
   * TypeORM returns a PostGIS geometry column as a parsed object similar to
   * `{ type: 'Polygon', coordinates: [...] }` when the driver recognises it;
   * we always coerce to a flat `[minLon, minLat, maxLon, maxLat]` tuple
   * by walking the coordinates array.
   */
  private readBbox(value: unknown): BboxTuple {
    const coords = this.collectCoordinates(value);
    if (coords.length === 0) {
      return [0, 0, 0, 0];
    }
    let minLon = coords[0][0];
    let minLat = coords[0][1];
    let maxLon = coords[0][0];
    let maxLat = coords[0][1];
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
    return [minLon, minLat, maxLon, maxLat];
  }

  private collectCoordinates(value: unknown): [number, number][] {
    const out: [number, number][] = [];
    const visit = (node: unknown): void => {
      if (!node) return;
      if (Array.isArray(node)) {
        // Leaf coordinate pair
        if (typeof node[0] === 'number' && typeof node[1] === 'number') {
          out.push([node[0], node[1]]);
          return;
        }
        for (const child of node) visit(child);
      } else if (typeof value === 'object' && value !== null && 'coordinates' in (value as object)) {
        visit((value as { coordinates: unknown }).coordinates);
      }
    };
    visit(value);
    return out;
  }

  private readFields(value: unknown): DatasetFieldDto[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        name: String(item.name ?? ''),
        alias: String(item.alias ?? item.name ?? ''),
        type: String(item.type ?? 'text'),
        nullable: Boolean(item.nullable ?? true),
      }));
  }
}
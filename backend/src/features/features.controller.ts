import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { ApiSuccessEnvelope } from '../common/api-success.interface';
import { BboxFeatureCollection, FeaturesService, SingleFeatureResult } from './features.service';
import { BboxQueryDto } from './dto/bbox-query.dto';

interface RequestWithId extends Request {
  id?: string;
}

@ApiTags('features')
@Controller()
export class FeaturesController {
  constructor(private readonly service: FeaturesService) {}

  /**
   * Mounted at `/api/v1/datasets/:slug/features`. The path prefix lives
   * on the parent datasets route to keep URL grouping obvious in Swagger.
   * We expose the same controller twice (different `@Controller` paths)
   * so route-level guards remain explicit.
   */
  @Get('datasets/:slug/features')
  @ApiOperation({ summary: 'Get features for a dataset inside the given bbox.' })
  @ApiOkResponse({ description: 'GeoJSON FeatureCollection with metadata.' })
  async findByBbox(
    @Param('slug') slug: string,
    @Query() query: BboxQueryDto,
    @Req() req: RequestWithId,
  ): Promise<ApiSuccessEnvelope<BboxFeatureCollection>> {
    const fc = await this.service.findByBbox(slug, query, req.id);
    return { data: fc, meta: { requestId: req.id } };
  }

  @Get('features/:id')
  @ApiOperation({ summary: 'Get a single feature by id with its dataset reference.' })
  @ApiOkResponse({ description: 'GeoJSON Feature with dataset metadata.' })
  async findById(
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ): Promise<ApiSuccessEnvelope<SingleFeatureResult>> {
    const feature = await this.service.findById(id, req.id);
    return { data: feature, meta: { requestId: req.id } };
  }
}
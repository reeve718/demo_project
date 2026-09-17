import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { ApiSuccessEnvelope } from '../common/api-success.interface';
import { DatasetDetailDto } from './dto/dataset-detail.dto';
import { DatasetSummaryDto } from './dto/dataset-summary.dto';
import { ListDatasetsQuery } from './dto/list-datasets.query';
import { DatasetsService } from './datasets.service';

interface RequestWithId extends Request {
  id?: string;
}

@ApiTags('datasets')
@Controller('datasets')
export class DatasetsController {
  constructor(private readonly service: DatasetsService) {}

  @Get()
  @ApiOperation({ summary: 'List datasets with optional search and theme filter.' })
  @ApiOkResponse({ description: 'Paginated dataset summaries.' })
  async list(
    @Query() query: ListDatasetsQuery,
    @Req() req: RequestWithId,
  ): Promise<ApiSuccessEnvelope<DatasetSummaryDto[]>> {
    const { items, total } = await this.service.list(query);
    return {
      data: items,
      meta: {
        requestId: req.id,
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
    };
  }

  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get full dataset metadata by slug.' })
  @ApiOkResponse({ description: 'Dataset detail including fields schema.' })
  async findOne(
    @Param('slug') slug: string,
    @Req() req: RequestWithId,
  ): Promise<ApiSuccessEnvelope<DatasetDetailDto>> {
    const data = await this.service.findBySlug(slug);
    return { data, meta: { requestId: req.id } };
  }
}
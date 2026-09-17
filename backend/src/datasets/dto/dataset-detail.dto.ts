import { ApiProperty } from '@nestjs/swagger';

import { DatasetSummaryDto } from './dataset-summary.dto';

export class DatasetFieldDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  alias!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  nullable!: boolean;
}

/**
 * Full dataset metadata returned by GET /api/v1/datasets/:slug.
 *
 * Adds the per-dataset field schema on top of the summary view.
 */
export class DatasetDetailDto extends DatasetSummaryDto {
  @ApiProperty({ type: [DatasetFieldDto] })
  fields!: DatasetFieldDto[];
}
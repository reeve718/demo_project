import { ApiProperty } from '@nestjs/swagger';

/**
 * Bounding box as `[minLon, minLat, maxLon, maxLat]` in WGS84.
 */
export type BboxTuple = [number, number, number, number];

/**
 * Lightweight dataset summary returned by the catalogue endpoint.
 */
export class DatasetSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  theme!: string;

  @ApiProperty()
  publisher!: string;

  @ApiProperty()
  license!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: [Number], description: '[minLon, minLat, maxLon, maxLat]' })
  bbox!: BboxTuple;
}
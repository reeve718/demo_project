import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Maximum total area (in square degrees) we allow for a single bbox query.
 * Restricting this keeps the response payload bounded for an MVP and avoids
 * accidental "give me the whole world" requests.
 */
export const MAX_BBOX_AREA_SQ_DEG = 1.0;

/**
 * Default and hard cap for feature pagination on the bbox endpoint.
 */
export const FEATURE_LIMIT_DEFAULT = 200;
export const FEATURE_LIMIT_MAX = 500;

/**
 * Query DTO for GET /api/v1/datasets/:slug/features.
 *
 * All coordinates are required; an explicit limit clamps the response size.
 */
export class BboxQueryDto {
  @ApiProperty({ description: 'Western longitude (WGS84).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  minLon!: number;

  @ApiProperty({ description: 'Southern latitude (WGS84).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  minLat!: number;

  @ApiProperty({ description: 'Eastern longitude (WGS84).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  maxLon!: number;

  @ApiProperty({ description: 'Northern latitude (WGS84).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  maxLat!: number;

  @ApiPropertyOptional({ description: 'Maximum features to return (default 200, max 500).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(FEATURE_LIMIT_MAX)
  limit: number = FEATURE_LIMIT_DEFAULT;
}
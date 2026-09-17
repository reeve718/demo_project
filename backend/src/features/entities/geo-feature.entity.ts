import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Dataset } from '../../datasets/entities/dataset.entity';

/**
 * One row per spatial feature belonging to a dataset.
 *
 * `geom` uses the generic GEOMETRY type because each dataset may mix
 * points, polygons, and lines. The frontend layers decide how to style
 * each based on GeoJSON geometry type.
 */
@Entity({ name: 'geo_features' })
@Index('geo_features_dataset_id_idx', ['datasetId'])
export class GeoFeature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @ManyToOne(() => Dataset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataset_id' })
  dataset?: Dataset;

  @Column({ name: 'external_id', type: 'text', nullable: true })
  externalId!: string | null;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  properties!: Record<string, unknown>;

  @Column({ type: 'geometry', spatialFeatureType: 'Geometry', srid: 4326 })
  geom!: unknown;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
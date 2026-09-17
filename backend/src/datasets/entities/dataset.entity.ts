import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One row per logical dataset in the catalogue.
 *
 * The `bbox` column is a PostGIS POLYGON in WGS84. We expose it as a JSON
 * `[minLon, minLat, maxLon, maxLat]` tuple in API responses so the
 * frontend can consume it without a GIS library.
 */
@Entity({ name: 'datasets' })
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  theme!: string;

  @Column({ type: 'text' })
  publisher!: string;

  @Column({ type: 'text' })
  license!: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ type: 'geometry(POLYGON,4326)' })
  bbox!: unknown;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  fields!: unknown;
}
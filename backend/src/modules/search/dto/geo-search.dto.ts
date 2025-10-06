import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GeoSearchDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;
}

export class GeoBoundsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  topLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  topLng!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  bottomLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  bottomLng!: number;
}

export class ClusterPropertiesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  zoomLevel!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  topLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  topLng!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  bottomLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  bottomLng!: number;
}

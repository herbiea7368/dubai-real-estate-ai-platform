import { IsEnum, IsObject } from 'class-validator';
import { ActivityType } from '../entities/lead-activity.entity';

export class CreateActivityDto {
  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @IsObject()
  details!: Record<string, any>;
}

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TourType } from '../entities/tour.entity';

class TourScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  timeSlot?: string | null;

  @IsOptional()
  @IsString()
  roundName?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxCapacity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentBooked?: number;
}

class ItineraryItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  day?: number;

  @IsString()
  time: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class CreateTourDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(TourType)
  tourType: TourType;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  childPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minPeople?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxPeople?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  highlights: string[];

  @IsOptional()
  @IsString()
  transportation?: string;

  @IsString()
  duration: string;

  @IsString()
  region: string;

  @IsString()
  province: string;

  @IsOptional()
  @IsString()
  accommodation?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourScheduleDto)
  schedules?: TourScheduleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary?: ItineraryItemDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

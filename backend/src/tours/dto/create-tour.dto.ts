import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateTourScheduleDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeSlot?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  roundName?: string | null;

  @IsInt()
  @Min(1)
  maxCapacity: number;
}

class CreateTourItineraryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  day?: number;

  @IsString()
  @MaxLength(100)
  time: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  description: string;
}

export class CreateTourDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  description: string;

  @IsIn(['one_day', 'package'])
  tourType: 'one_day' | 'package';

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  childPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  minPeople?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPeople?: number;

  @IsOptional()
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
  @IsBoolean()
  isActive?: boolean;

  // nested DTO ช่วยให้ whitelist + validation ตรวจโครงสร้างได้ครบทุกระดับ
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourScheduleDto)
  schedules?: CreateTourScheduleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTourItineraryDto)
  itinerary?: CreateTourItineraryDto[];
}

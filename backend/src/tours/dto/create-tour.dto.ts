import { TourType } from '../entities/tour.entity';

export class CreateTourDto {
  name: string;
  description: string;
  tourType: TourType;
  price: number;
  region: string;
  province: string;
  categories: string[];
  highlights: string[];
  duration: string;
  isActive: boolean;
  images: string[];
  schedules?: any[]; 
}
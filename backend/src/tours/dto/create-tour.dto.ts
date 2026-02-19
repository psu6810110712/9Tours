export class CreateTourDto {
  name: string;
  description: string;
  tourType: 'one_day' | 'package';
  categories: string[];
  price: number;
  originalPrice?: number | null;
  images?: string[];
  highlights: string[];
  transportation?: string;
  duration: string;
  region: string;
  province: string;
  accommodation?: string | null;
  schedules?: {
    startDate: string;
    endDate: string;
    maxCapacity: number;
  }[];
}

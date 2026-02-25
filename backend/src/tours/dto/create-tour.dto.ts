export class CreateTourDto {
  tourCode?: string;
  title: string;
  description?: string;
  pricePerPerson?: number;
  imageUrl?: string;
  isVisible?: boolean;
  categoryId?: number;
  regionId?: number;
  provinceId?: number;
  festivalId?: number;
  schedules?: any[];
}
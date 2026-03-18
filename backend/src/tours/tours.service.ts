import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { In, QueryFailedError, Repository } from 'typeorm';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Festival } from '../festivals/entities/festival.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourSchedule } from './entities/tour-schedule.entity';
import { Tour, TourType } from './entities/tour.entity';
import { parseToursData } from './tours-data.util';

type TourRecord = Record<string, any>;
type ScheduleRecord = Record<string, any>;
interface TourImportOptions {
  reset?: boolean;
  force?: boolean;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBookedCount(value: unknown) {
  return Math.max(0, Math.trunc(normalizeNumber(value, 0)));
}

function normalizeScheduleSignature(schedule: Partial<ScheduleRecord>) {
  return [
    schedule.startDate || '',
    schedule.endDate || '',
    schedule.timeSlot || '',
    schedule.roundName || '',
  ].join('|');
}

@Injectable()
export class ToursService implements OnModuleInit {
  private cachedTours: TourRecord[] = [];

  constructor(
    @InjectRepository(Tour)
    private readonly toursRepo: Repository<Tour>,
    @InjectRepository(TourSchedule)
    private readonly schedulesRepo: Repository<TourSchedule>,
    @InjectRepository(BehaviorEvent)
    private readonly behaviorEventsRepo: Repository<BehaviorEvent>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
  ) {}

  async onModuleInit() {
    if (this.isJsonImportEnabled()) {
      await this.importToursFromJson();
    }
    await this.refreshCache();
  }

  private isMissingSchemaError(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === '42P01';
  }

  private isJsonImportEnabled() {
    return String(process.env.ENABLE_TOUR_JSON_IMPORT ?? '').trim().toLowerCase() === 'true';
  }

  private resolveDataFile() {
    const candidates = [
      path.join(process.cwd(), 'tours-data.json'),
      path.join(process.cwd(), 'backend', 'tours-data.json'),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
  }

  private async refreshCache() {
    let tours: Tour[] = [];

    try {
      tours = await this.toursRepo.find({
        relations: ['schedules', 'festival'],
        order: { id: 'ASC' },
      });
    } catch (error) {
      if (!this.isMissingSchemaError(error)) {
        throw error;
      }
    }

    this.cachedTours = tours.map((tour) => this.toTourRecord(tour));
  }

  private toTourRecord(tour: Tour): TourRecord {
    const schedules = Array.isArray(tour.schedules)
      ? [...tour.schedules]
        .sort((a, b) => {
          const byStart = String(a.startDate).localeCompare(String(b.startDate));
          if (byStart !== 0) return byStart;
          const byTime = String(a.timeSlot || '').localeCompare(String(b.timeSlot || ''));
          if (byTime !== 0) return byTime;
          return a.id - b.id;
        })
        .map((schedule) => ({
          id: schedule.id,
          tourId: schedule.tourId,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          timeSlot: schedule.timeSlot ?? null,
          roundName: schedule.roundName ?? null,
          maxCapacity: normalizeNumber(schedule.maxCapacity, 0),
          currentBooked: normalizeBookedCount(schedule.currentBooked),
        }))
      : [];

    const rawOriginalPrice = normalizeNullableNumber(tour.originalPrice);
    const rawPrice = normalizeNumber(tour.price, 0);
    const hasDiscountDates = Boolean(tour.discountStartDate || tour.discountEndDate);
    const discountActive = this.isDiscountCurrentlyActive(tour.discountStartDate, tour.discountEndDate);
    const showDiscount = rawOriginalPrice != null && rawOriginalPrice > rawPrice
      && (!hasDiscountDates || discountActive);

    return {
      id: tour.id,
      tourCode: tour.tourCode,
      name: tour.name,
      description: tour.description,
      tourType: tour.tourType,
      categories: Array.isArray(tour.categories) ? tour.categories : [],
      price: showDiscount ? rawPrice : (rawOriginalPrice ?? rawPrice),
      childPrice: normalizeNullableNumber(tour.childPrice),
      minPeople: normalizeNullableNumber(tour.minPeople),
      maxPeople: normalizeNullableNumber(tour.maxPeople),
      originalPrice: showDiscount ? rawOriginalPrice : null,
      discountStartDate: tour.discountStartDate ?? null,
      discountEndDate: tour.discountEndDate ?? null,
      discountActive: showDiscount,
      images: Array.isArray(tour.images) ? tour.images : [],
      highlights: Array.isArray(tour.highlights) ? tour.highlights : [],
      itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
      transportation: tour.transportation || '',
      duration: tour.duration,
      region: tour.region,
      province: tour.province,
      accommodation: tour.accommodation ?? null,
      rating: normalizeNumber(tour.rating, 0),
      reviewCount: normalizeNumber(tour.reviewCount, 0),
      isActive: Boolean(tour.isActive),
      festivalId: tour.festival?.id ?? null,
      festival: tour.festival ? { id: tour.festival.id, name: tour.festival.name, startDate: tour.festival.startDate, endDate: tour.festival.endDate } : null,
      schedules,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
    };
  }

  private isDiscountCurrentlyActive(startDate: string | null | undefined, endDate: string | null | undefined): boolean {
    if (!startDate && !endDate) return true;
    const today = new Date().toISOString().slice(0, 10);
    if (startDate && today < startDate) return false;
    if (endDate && today > endDate) return false;
    return true;
  }

  private cloneTour(tour: TourRecord): TourRecord {
    return {
      ...tour,
      categories: [...(tour.categories || [])],
      images: [...(tour.images || [])],
      highlights: [...(tour.highlights || [])],
      itinerary: Array.isArray(tour.itinerary)
        ? tour.itinerary.map((item: Record<string, unknown>) => ({ ...item }))
        : [],
      schedules: Array.isArray(tour.schedules)
        ? tour.schedules.map((schedule: Record<string, unknown>) => ({ ...schedule }))
        : [],
    };
  }

  private readToursFromSource() {
    const dataFile = this.resolveDataFile();
    if (!fs.existsSync(dataFile)) {
      return [];
    }

    return parseToursData<TourRecord>(fs.readFileSync(dataFile, 'utf8'))
      .sort((a, b) => normalizeNumber(a.id, 0) - normalizeNumber(b.id, 0));
  }

  private async upsertImportedTour(tourData: TourRecord) {
    const festivalId = normalizeNullableNumber(tourData.festivalId ?? tourData.festival?.id);
    const existingTour = await this.toursRepo.findOne({
      where: { tourCode: tourData.tourCode },
      relations: ['schedules', 'festival'],
    });
    const schedules = Array.isArray(tourData.schedules) ? tourData.schedules : [];

    if (!existingTour) {
      const newTourData = this.toursRepo.create({
        tourCode: tourData.tourCode,
        name: tourData.name,
        description: tourData.description,
        tourType: tourData.tourType as TourType,
        categories: Array.isArray(tourData.categories) ? tourData.categories : [],
        price: normalizeNumber(tourData.price, 0),
        childPrice: normalizeNullableNumber(tourData.childPrice),
        minPeople: normalizeNullableNumber(tourData.minPeople),
        maxPeople: normalizeNullableNumber(tourData.maxPeople),
        originalPrice: normalizeNullableNumber(tourData.originalPrice),
        images: Array.isArray(tourData.images) ? tourData.images : [],
        highlights: Array.isArray(tourData.highlights) ? tourData.highlights : [],
        itinerary: Array.isArray(tourData.itinerary) ? tourData.itinerary : [],
        transportation: tourData.transportation || '',
        duration: tourData.duration || '',
        region: tourData.region || '',
        province: tourData.province || '',
        accommodation: tourData.accommodation ?? null,
        rating: normalizeNumber(tourData.rating, 0),
        reviewCount: normalizeNumber(tourData.reviewCount, 0),
        isActive: tourData.isActive ?? true,
        festival: festivalId ? ({ id: festivalId } as Festival) : undefined,
      });
      const savedTour = await this.toursRepo.save(newTourData);

      if (schedules.length > 0) {
        await this.schedulesRepo.save(
          schedules.map((scheduleData) => this.schedulesRepo.create({
            tourId: savedTour.id,
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            timeSlot: scheduleData.timeSlot ?? null,
            roundName: scheduleData.roundName ?? null,
            maxCapacity: normalizeNumber(scheduleData.maxCapacity, 0),
            currentBooked: normalizeBookedCount(scheduleData.currentBooked),
          })),
        );
      }

      return;
    }

    Object.assign(existingTour, {
      name: tourData.name,
      description: tourData.description,
      tourType: tourData.tourType as TourType,
      categories: Array.isArray(tourData.categories) ? tourData.categories : [],
      price: normalizeNumber(tourData.price, 0),
      childPrice: normalizeNullableNumber(tourData.childPrice),
      minPeople: normalizeNullableNumber(tourData.minPeople),
      maxPeople: normalizeNullableNumber(tourData.maxPeople),
      originalPrice: normalizeNullableNumber(tourData.originalPrice),
      images: Array.isArray(tourData.images) ? tourData.images : [],
      highlights: Array.isArray(tourData.highlights) ? tourData.highlights : [],
      itinerary: Array.isArray(tourData.itinerary) ? tourData.itinerary : [],
      transportation: tourData.transportation || '',
      duration: tourData.duration || '',
      region: tourData.region || '',
      province: tourData.province || '',
      accommodation: tourData.accommodation ?? null,
      rating: normalizeNumber(tourData.rating, 0),
      reviewCount: normalizeNumber(tourData.reviewCount, 0),
      isActive: tourData.isActive ?? true,
    });
    (existingTour as any).festival = festivalId ? ({ id: festivalId } as Festival) : null;
    await this.toursRepo.save(existingTour);

    const existingSchedules = Array.isArray(existingTour.schedules) ? existingTour.schedules : [];
    const existingById = new Map(
      existingSchedules
        .filter((schedule) => schedule?.id != null)
        .map((schedule) => [Number(schedule.id), schedule]),
    );
    const existingBySignature = new Map(
      existingSchedules.map((schedule) => [normalizeScheduleSignature(schedule), schedule]),
    );

    const persistedScheduleIds = new Set<number>();
    const schedulesToSave = schedules.map((scheduleData) => {
      const incomingId = scheduleData?.id != null ? Number(scheduleData.id) : undefined;
      const matchedExisting = (
        (incomingId != null ? existingById.get(incomingId) : undefined)
        || existingBySignature.get(normalizeScheduleSignature(scheduleData))
      ) as TourSchedule | undefined;

      if (matchedExisting?.id != null) {
        persistedScheduleIds.add(matchedExisting.id);
      }

      return this.schedulesRepo.create({
        id: matchedExisting?.id,
        tourId: existingTour.id,
        startDate: scheduleData.startDate,
        endDate: scheduleData.endDate,
        timeSlot: scheduleData.timeSlot ?? null,
        roundName: scheduleData.roundName ?? null,
        maxCapacity: normalizeNumber(scheduleData.maxCapacity, 0),
        currentBooked: matchedExisting
          ? normalizeBookedCount(matchedExisting.currentBooked)
          : normalizeBookedCount(scheduleData.currentBooked),
      });
    });

    const removedScheduleIds = existingSchedules
      .map((schedule) => schedule.id)
      .filter((scheduleId) => !persistedScheduleIds.has(scheduleId));

    if (removedScheduleIds.length > 0) {
      await this.schedulesRepo.delete({ id: In(removedScheduleIds) });
    }

    if (schedulesToSave.length > 0) {
      await this.schedulesRepo.save(schedulesToSave);
    }
  }

  async importToursFromJson(options: TourImportOptions = {}) {
    const { reset = false, force = false } = options;
    const toursData = this.readToursFromSource();

    if (reset) {
      const bookingCount = await this.bookingsRepo.count();
      if (bookingCount > 0 && !force) {
        throw new Error('Refusing to reset tours because bookings already exist. Re-run with force if this is intentional.');
      }

      await this.schedulesRepo.clear();
      await this.toursRepo.clear();
    }

    for (const tourData of toursData) {
      await this.upsertImportedTour(tourData);
    }

    await this.refreshCache();
    return {
      importedTours: toursData.length,
      reset,
    };
  }

  private async makeTourCode() {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.toursRepo.count();
    const seq = String(count + 1).padStart(3, '0');
    return `${dd}${mm}${date.getFullYear()}${seq}`;
  }

  async create(dto: CreateTourDto) {
    const festivalId = normalizeNullableNumber(dto.festivalId);
    const newTourData = this.toursRepo.create({
      tourCode: await this.makeTourCode(),
      name: dto.name,
      description: dto.description,
      tourType: dto.tourType as unknown as TourType,
      categories: dto.categories || [],
      price: normalizeNumber(dto.price, 0),
      childPrice: normalizeNullableNumber(dto.childPrice),
      minPeople: normalizeNullableNumber(dto.minPeople),
      maxPeople: normalizeNullableNumber(dto.maxPeople),
      originalPrice: normalizeNullableNumber(dto.originalPrice),
      images: dto.images || [],
      highlights: dto.highlights || [],
      itinerary: (dto.itinerary || []).map((item) => ({
        ...item,
        day: item.day != null ? Number(item.day) : undefined,
      })),
      transportation: dto.transportation || '',
      duration: dto.duration,
      region: dto.region,
      province: dto.province,
      accommodation: dto.accommodation || null,
      rating: 0,
      reviewCount: 0,
      discountStartDate: dto.discountStartDate || null,
      discountEndDate: dto.discountEndDate || null,
      isActive: dto.isActive ?? true,
      festival: festivalId ? ({ id: festivalId } as Festival) : undefined,
    });
    const newTour = await this.toursRepo.save(newTourData);

    if (Array.isArray(dto.schedules) && dto.schedules.length > 0) {
      const schedules = dto.schedules.map((schedule) => this.schedulesRepo.create({
        tourId: newTour.id,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        timeSlot: schedule.timeSlot ?? null,
        roundName: schedule.roundName ?? null,
        maxCapacity: normalizeNumber(schedule.maxCapacity, 0),
        currentBooked: normalizeBookedCount(schedule.currentBooked),
      }));
      await this.schedulesRepo.save(schedules);
    }

    await this.refreshCache();
    return this.findOne(newTour.id);
  }

  findAll(filters?: {
    region?: string;
    province?: string;
    tourType?: string;
    search?: string;
    admin?: string;
    month?: string;
    categories?: string | string[];
    minPrice?: string | number;
    maxPrice?: string | number;
    festivalId?: string | number;
  }) {
    const { region, province, tourType, search, admin, month, categories, minPrice, maxPrice, festivalId } = filters || {};

    const parsedCategories = (Array.isArray(categories) ? categories : String(categories || '').split(','))
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const parsedMinPrice = typeof minPrice === 'string' ? Number(minPrice) : minPrice;
    const parsedMaxPrice = typeof maxPrice === 'string' ? Number(maxPrice) : maxPrice;

    let result = admin === 'true'
      ? this.cachedTours.map((tour) => this.cloneTour(tour))
      : this.cachedTours.filter((tour) => tour.isActive).map((tour) => this.cloneTour(tour));

    if (region) {
      result = result.filter((tour) => tour.region === region);
    }
    if (province) {
      result = result.filter((tour) => tour.province === province);
    }
    if (tourType) {
      result = result.filter((tour) => tour.tourType === tourType);
    }
    if (parsedCategories.length > 0) {
      result = result.filter((tour) => Array.isArray(tour.categories)
        && tour.categories.some((category: string) => parsedCategories.includes(String(category).trim().toLowerCase())));
    }
    if (Number.isFinite(parsedMinPrice)) {
      result = result.filter((tour) => Number(tour.price) >= Number(parsedMinPrice));
    }
    if (Number.isFinite(parsedMaxPrice)) {
      result = result.filter((tour) => Number(tour.price) <= Number(parsedMaxPrice));
    }
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (tour) => String(tour.name || '').toLowerCase().includes(term)
          || String(tour.description || '').toLowerCase().includes(term)
          || String(tour.province || '').toLowerCase().includes(term),
      );
    }
    if (month) {
      result = result.filter((tour) => Array.isArray(tour.schedules)
        && tour.schedules.some((schedule: ScheduleRecord) => schedule.startDate && schedule.startDate.startsWith(month)));
    }
    if (festivalId) {
      const parsedFestivalId = Number(festivalId);
      if (Number.isFinite(parsedFestivalId)) {
        result = result.filter((tour) => tour.festivalId === parsedFestivalId);
      }
    }

    return result;
  }

  findOne(id: number) {
    const found = this.cachedTours.find((tour) => tour.id === id);
    return found ? this.cloneTour(found) : null;
  }

  getAvailableSeats(tourId: number, scheduleId: number) {
    const tour = this.cachedTours.find((item) => item.id === tourId);
    if (!tour) {
      throw new Error(`Tour ${tourId} not found`);
    }

    const schedule = (tour.schedules || []).find((item: ScheduleRecord) => item.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found for tour ${tourId}`);
    }

    const currentBooked = normalizeBookedCount(schedule.currentBooked);
    const availableSeats = schedule.maxCapacity - currentBooked;

    return {
      tourId,
      scheduleId,
      maxCapacity: schedule.maxCapacity,
      currentBooked,
      availableSeats,
      isFull: availableSeats <= 0,
    };
  }

  async update(id: number, dto: UpdateTourDto) {
    const tour = await this.toursRepo.findOne({
      where: { id },
      relations: ['schedules', 'festival'],
    });
    if (!tour) return null;

    const { schedules: incomingSchedules, festivalId, ...rest } = dto as UpdateTourDto & { schedules?: ScheduleRecord[]; festivalId?: number | null };

    const willBeActive = rest.isActive !== undefined ? rest.isActive : tour.isActive;
    const willHaveSchedules = Array.isArray(incomingSchedules)
      ? incomingSchedules.length > 0
      : (Array.isArray(tour.schedules) && tour.schedules.length > 0);

    if (willBeActive && !willHaveSchedules) {
      throw new BadRequestException('ไม่สามารถเปิดใช้งานทัวร์ได้ เนื่องจากยังไม่มีรอบเดินทาง กรุณาเพิ่มรอบเดินทางก่อน');
    }

    Object.assign(tour, {
      ...rest,
      price: rest.price !== undefined ? normalizeNumber(rest.price, 0) : tour.price,
      childPrice: rest.childPrice !== undefined ? normalizeNullableNumber(rest.childPrice) : tour.childPrice,
      minPeople: rest.minPeople !== undefined ? normalizeNullableNumber(rest.minPeople) : tour.minPeople,
      maxPeople: rest.maxPeople !== undefined ? normalizeNullableNumber(rest.maxPeople) : tour.maxPeople,
      originalPrice: rest.originalPrice !== undefined ? normalizeNullableNumber(rest.originalPrice) : tour.originalPrice,
      discountStartDate: rest.discountStartDate !== undefined ? (rest.discountStartDate || null) : tour.discountStartDate,
      discountEndDate: rest.discountEndDate !== undefined ? (rest.discountEndDate || null) : tour.discountEndDate,
      itinerary: Array.isArray(rest.itinerary)
        ? rest.itinerary.map((item) => ({
          ...item,
          day: item?.day != null ? Number(item.day) : undefined,
        }))
        : tour.itinerary,
      updatedAt: new Date(),
    });

    if (festivalId !== undefined) {
      (tour as any).festival = festivalId ? { id: festivalId } : null;
    }

    await this.toursRepo.save(tour);

    if (Array.isArray(incomingSchedules)) {
      const existingSchedules = Array.isArray(tour.schedules) ? tour.schedules : [];
      const existingById = new Map(
        existingSchedules
          .filter((schedule) => schedule?.id != null)
          .map((schedule) => [Number(schedule.id), schedule]),
      );
      const existingBySignature = new Map(
        existingSchedules.map((schedule) => [normalizeScheduleSignature(schedule), schedule]),
      );

      const persistedScheduleIds = new Set<number>();
      const schedulesToSave = incomingSchedules.map((schedule) => {
        const incomingId = schedule?.id != null ? Number(schedule.id) : undefined;
        const matchedExisting = (
          (incomingId != null ? existingById.get(incomingId) : undefined)
          || existingBySignature.get(normalizeScheduleSignature(schedule))
        ) as TourSchedule | undefined;

        if (matchedExisting?.id != null) {
          persistedScheduleIds.add(matchedExisting.id);
        }

        return this.schedulesRepo.create({
          id: matchedExisting?.id,
          tourId: tour.id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          timeSlot: schedule.timeSlot ?? null,
          roundName: schedule.roundName ?? null,
          maxCapacity: normalizeNumber(schedule.maxCapacity, 0),
          currentBooked: matchedExisting
            ? normalizeBookedCount(matchedExisting.currentBooked)
            : normalizeBookedCount(schedule.currentBooked),
        });
      });

      const removedScheduleIds = existingSchedules
        .map((schedule) => schedule.id)
        .filter((scheduleId) => !persistedScheduleIds.has(scheduleId));

      if (removedScheduleIds.length > 0) {
        await this.schedulesRepo.delete({ id: In(removedScheduleIds) });
      }

      if (schedulesToSave.length > 0) {
        await this.schedulesRepo.save(schedulesToSave);
      }
    }

    await this.refreshCache();
    return this.findOne(id);
  }

  async remove(id: number) {
    const tour = await this.toursRepo.findOne({
      where: { id },
      relations: ['schedules'],
    });
    if (!tour) return null;

    const scheduleIds = Array.isArray(tour.schedules) ? tour.schedules.map((schedule) => schedule.id) : [];
    if (scheduleIds.length > 0) {
      const bookingCount = await this.bookingsRepo.count({
        where: { scheduleId: In(scheduleIds) },
      });

      if (bookingCount > 0) {
        throw new BadRequestException('ไม่สามารถลบทัวร์นี้ได้ เพราะมีประวัติการจองอยู่แล้ว กรุณาใช้การปิดใช้งานแทน');
      }

      await this.schedulesRepo.delete({ id: In(scheduleIds) });
    }

    await this.toursRepo.delete({ id: tour.id });
    await this.refreshCache();
    return { id, deleted: true };
  }

  async getRecommendationsForUser(userId: string, limit = 8) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 12));
    const activeTours = this.findAll();
    const activeMap = new Map<number, TourRecord>(activeTours.map((tour: TourRecord) => [tour.id, tour]));
    const resultTours: TourRecord[] = [];
    const usedTourIds = new Set<number>();

    const addIfActive = (tourId: number) => {
      if (usedTourIds.has(tourId)) return;
      const tour = activeMap.get(tourId);
      if (!tour) return;
      usedTourIds.add(tourId);
      resultTours.push(tour);
    };

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const personalized = await this.behaviorEventsRepo
      .createQueryBuilder('be')
      .select('be.tourId', 'tourId')
      .addSelect(`
        SUM(
          CASE
            WHEN be.eventType = 'cta_click' THEN 5
            WHEN be.eventType = 'dwell_time' THEN LEAST(COALESCE(be.dwellMs, 0) / 15000.0, 4)
            WHEN be.eventType = 'page_view' THEN 1
            ELSE 0
          END
        )
      `, 'score')
      .addSelect('MAX(be.occurredAt)', 'last_seen_at')
      .where('be.userId = :userId', { userId })
      .andWhere('be.tourId IS NOT NULL')
      .andWhere('be.occurredAt >= :since', { since: ninetyDaysAgo })
      .groupBy('be.tourId')
      .orderBy('score', 'DESC')
      .addOrderBy('last_seen_at', 'DESC')
      .limit(safeLimit)
      .getRawMany<{ tourId: string }>();

    personalized.forEach((row) => addIfActive(Number(row.tourId)));

    if (resultTours.length < safeLimit) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const trending = await this.behaviorEventsRepo
        .createQueryBuilder('be')
        .select('be.tourId', 'tourId')
        .addSelect(`
          SUM(
            CASE
              WHEN be.eventType = 'cta_click' THEN 3
              WHEN be.eventType = 'dwell_time' THEN LEAST(COALESCE(be.dwellMs, 0) / 30000.0, 2)
              WHEN be.eventType = 'page_view' THEN 1
              ELSE 0
            END
          )
        `, 'score')
        .where('be.tourId IS NOT NULL')
        .andWhere('be.occurredAt >= :since', { since: thirtyDaysAgo })
        .groupBy('be.tourId')
        .orderBy('score', 'DESC')
        .limit(safeLimit * 2)
        .getRawMany<{ tourId: string }>();

      trending.forEach((row) => addIfActive(Number(row.tourId)));
    }

    if (resultTours.length < safeLimit) {
      const staticPopular = [...activeTours].sort((a: TourRecord, b: TourRecord) => {
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return (b.rating || 0) - (a.rating || 0);
      });
      staticPopular.forEach((tour: TourRecord) => addIfActive(tour.id));
    }

    return resultTours.slice(0, safeLimit);
  }

  async updateScheduleBookedCount(scheduleId: number, addPax: number) {
    const schedule = await this.schedulesRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      return;
    }

    schedule.currentBooked = Math.max(0, normalizeBookedCount(schedule.currentBooked) + addPax);
    await this.schedulesRepo.save(schedule);

    const cachedTour = this.cachedTours.find((tour) => Array.isArray(tour.schedules) && tour.schedules.some((item: ScheduleRecord) => item.id === scheduleId));
    const cachedSchedule = cachedTour?.schedules?.find((item: ScheduleRecord) => item.id === scheduleId);
    if (cachedSchedule) {
      cachedSchedule.currentBooked = schedule.currentBooked;
    }
  }

  async getAdminOverview() {
    const activeTours = this.cachedTours.filter((tour) => tour.isActive);

    const bookingCounts = await this.bookingsRepo
      .createQueryBuilder('b')
      .select('b.schedule_id', 'scheduleId')
      .addSelect('SUM(b.pax_count)', 'totalPax')
      .addSelect('COUNT(b.id)', 'bookingCount')
      .where('b.status IN (:...activeStatuses)', {
        activeStatuses: [
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.AWAITING_APPROVAL,
          BookingStatus.CONFIRMED,
          BookingStatus.SUCCESS,
        ],
      })
      .groupBy('b.schedule_id')
      .getRawMany();

    const countMap = new Map<number, { totalPax: number; bookingCount: number }>();
    for (const row of bookingCounts) {
      countMap.set(Number(row.scheduleId), {
        totalPax: Number(row.totalPax) || 0,
        bookingCount: Number(row.bookingCount) || 0,
      });
    }

    return activeTours.map((tour) => ({
      id: tour.id,
      tourCode: tour.tourCode,
      name: tour.name,
      tourType: tour.tourType,
      province: tour.province,
      region: tour.region,
      images: tour.images?.slice(0, 1) || [],
      isActive: tour.isActive,
      totalSchedules: (tour.schedules || []).length,
      schedules: (tour.schedules || []).map((schedule: ScheduleRecord) => {
        const dbCount = countMap.get(schedule.id);
        const currentBooked = dbCount ? dbCount.totalPax : 0;
        return {
          id: schedule.id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          roundName: schedule.roundName,
          timeSlot: schedule.timeSlot,
          maxCapacity: schedule.maxCapacity,
          currentBooked,
          availableSeats: schedule.maxCapacity - currentBooked,
          occupancyPercent: schedule.maxCapacity > 0
            ? Math.min(100, Math.round((currentBooked / schedule.maxCapacity) * 100))
            : 0,
        };
      }),
    }));
  }
}

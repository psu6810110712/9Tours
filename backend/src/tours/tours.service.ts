import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourType } from './entities/tour.entity';

const DATA_FILE = path.join(process.cwd(), 'tours-data.json');
const INITIAL_DATA: any[] = [];

type TourRecord = any;
type ScheduleRecord = any;

let DEMO_TOURS: TourRecord[] = [];

function loadToursFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('loadToursFromDisk error:', error);
  }
  return [...INITIAL_DATA];
}

function reloadTours() {
  DEMO_TOURS = loadToursFromDisk();
}

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEMO_TOURS, null, 2));
  } catch (error) {
    console.error('Save error:', error);
  }
}

function normalizeScheduleSignature(schedule: Partial<ScheduleRecord>) {
  return [
    schedule.startDate || '',
    schedule.endDate || '',
    schedule.timeSlot || '',
    schedule.roundName || '',
  ].join('|');
}

function nextTourId() {
  return Math.max(99, ...DEMO_TOURS.map((tour) => Number(tour.id) || 0)) + 1;
}

function makeTourCode() {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(DEMO_TOURS.length + 1).padStart(3, '0');
  return `${dd}${mm}${date.getFullYear()}${seq}`;
}

reloadTours();

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(BehaviorEvent)
    private readonly behaviorEventsRepo: Repository<BehaviorEvent>,
  ) {}

  create(dto: CreateTourDto) {
    reloadTours();
    const tourId = nextTourId();

    const newTour = {
      id: tourId,
      tourCode: makeTourCode(),
      name: dto.name,
      description: dto.description,
      tourType: dto.tourType as unknown as TourType,
      categories: dto.categories || [],
      price: Number(dto.price),
      childPrice: dto.childPrice != null ? Number(dto.childPrice) : null,
      minPeople: dto.minPeople != null ? Number(dto.minPeople) : null,
      maxPeople: dto.maxPeople != null ? Number(dto.maxPeople) : null,
      originalPrice: dto.originalPrice != null ? Number(dto.originalPrice) : null,
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
      isActive: dto.isActive ?? true,
      schedules: (dto.schedules || []).map((schedule, index) => ({
        id: tourId * 100 + index + 1,
        tourId,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        timeSlot: schedule.timeSlot ?? null,
        roundName: schedule.roundName ?? null,
        maxCapacity: Number(schedule.maxCapacity),
        currentBooked: Number(schedule.currentBooked || 0),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    DEMO_TOURS.push(newTour);
    persistData();
    return newTour;
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
  }) {
    const { region, province, tourType, search, admin, month, categories, minPrice, maxPrice } = filters || {};

    const parsedCategories = (Array.isArray(categories) ? categories : String(categories || '').split(','))
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const parsedMinPrice = typeof minPrice === 'string' ? Number(minPrice) : minPrice;
    const parsedMaxPrice = typeof maxPrice === 'string' ? Number(maxPrice) : maxPrice;

    reloadTours();

    let result = admin === 'true'
      ? [...DEMO_TOURS]
      : DEMO_TOURS.filter((tour) => tour.isActive);

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

    return result;
  }

  findOne(id: number) {
    reloadTours();
    return DEMO_TOURS.find((tour) => tour.id === id) || null;
  }

  getAvailableSeats(tourId: number, scheduleId: number) {
    reloadTours();
    const tour = DEMO_TOURS.find((item) => item.id === tourId);
    if (!tour) {
      throw new Error(`Tour ${tourId} not found`);
    }

    const schedule = tour.schedules.find((item: ScheduleRecord) => item.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found for tour ${tourId}`);
    }

    const currentBooked = schedule.currentBooked || 0;
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

  update(id: number, dto: UpdateTourDto) {
    reloadTours();
    const tour = DEMO_TOURS.find((item) => item.id === id);
    if (!tour) return null;

    const { schedules: incomingSchedules, ...rest } = dto as any;
    const normalizedRest = { ...rest };

    if (normalizedRest.price !== undefined) normalizedRest.price = Number(normalizedRest.price);
    if (normalizedRest.childPrice !== undefined && normalizedRest.childPrice !== null) normalizedRest.childPrice = Number(normalizedRest.childPrice);
    if (normalizedRest.originalPrice !== undefined && normalizedRest.originalPrice !== null) normalizedRest.originalPrice = Number(normalizedRest.originalPrice);
    if (normalizedRest.minPeople !== undefined && normalizedRest.minPeople !== null) normalizedRest.minPeople = Number(normalizedRest.minPeople);
    if (normalizedRest.maxPeople !== undefined && normalizedRest.maxPeople !== null) normalizedRest.maxPeople = Number(normalizedRest.maxPeople);
    if (Array.isArray(normalizedRest.itinerary)) {
      normalizedRest.itinerary = normalizedRest.itinerary.map((item: any) => ({
        ...item,
        day: item?.day != null ? Number(item.day) : undefined,
      }));
    }

    Object.assign(tour, normalizedRest, { updatedAt: new Date() });

    if (Array.isArray(incomingSchedules)) {
      const existingSchedules = Array.isArray(tour.schedules) ? tour.schedules : [];
      const existingById = new Map(existingSchedules
        .filter((schedule: ScheduleRecord) => schedule?.id != null)
        .map((schedule: ScheduleRecord) => [Number(schedule.id), schedule]));
      const existingBySignature = new Map(existingSchedules
        .map((schedule: ScheduleRecord) => [normalizeScheduleSignature(schedule), schedule]));
      let nextScheduleId = Math.max(
        tour.id * 100,
        ...existingSchedules.map((schedule: ScheduleRecord) => Number(schedule.id) || 0),
      ) + 1;

      tour.schedules = incomingSchedules.map((schedule: ScheduleRecord) => {
        const incomingId = schedule?.id != null ? Number(schedule.id) : undefined;
        const matchedExisting = (incomingId != null ? existingById.get(incomingId) : undefined)
          || existingBySignature.get(normalizeScheduleSignature(schedule));

        return {
          id: matchedExisting?.id ?? incomingId ?? nextScheduleId++,
          tourId: tour.id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          timeSlot: schedule.timeSlot ?? null,
          roundName: schedule.roundName ?? null,
          maxCapacity: Number(schedule.maxCapacity),
          currentBooked: matchedExisting
            ? Number(matchedExisting.currentBooked || 0)
            : Number(schedule.currentBooked || 0),
        };
      });
    }

    persistData();
    return tour;
  }

  remove(id: number) {
    reloadTours();
    const tour = DEMO_TOURS.find((item) => item.id === id);
    if (!tour) return null;

    tour.isActive = false;
    tour.updatedAt = new Date();
    persistData();
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

  updateScheduleBookedCount(scheduleId: number, addPax: number) {
    reloadTours();
    for (const tour of DEMO_TOURS) {
      if (!tour.schedules) continue;
      const schedule = tour.schedules.find((item: ScheduleRecord) => item.id === scheduleId);
      if (schedule) {
        schedule.currentBooked = (schedule.currentBooked || 0) + addPax;
        persistData();
        return;
      }
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour, TourType } from './entities/tour.entity';
import { TourSchedule } from './entities/tour-schedule.entity';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly toursRepo: Repository<Tour>,
    @InjectRepository(TourSchedule)
    private readonly schedulesRepo: Repository<TourSchedule>,
    @InjectRepository(BehaviorEvent)
    private readonly behaviorEventsRepo: Repository<BehaviorEvent>,
  ) {}

  // สร้างรหัสทัวร์แบบ deterministic และกันชนซ้ำด้วยการเช็ค DB
  private async makeTourCode(): Promise<string> {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const prefix = `${dd}${mm}${yyyy}`;
    for (let seq = 1; seq <= 999; seq++) {
      const code = `${prefix}${String(seq).padStart(3, '0')}`;
      const exists = await this.toursRepo.exists({ where: { tourCode: code } });
      if (!exists) return code;
    }
    return `${prefix}${Date.now().toString().slice(-3)}`;
  }

  private normalizeTour(tour: Tour) {
    return {
      ...tour,
      price: Number(tour.price),
      childPrice: tour.childPrice === null ? null : Number(tour.childPrice),
      originalPrice: tour.originalPrice === null ? null : Number(tour.originalPrice),
      minPeople: tour.minPeople ?? undefined,
      maxPeople: tour.maxPeople ?? undefined,
      schedules: (tour.schedules || []).map((s) => ({
        ...s,
        maxCapacity: Number(s.maxCapacity),
        currentBooked: Number(s.currentBooked),
      })),
    };
  }

  private mapSchedulesForCreate(dto: CreateTourDto) {
    return (dto.schedules || []).map((s: any) =>
      this.schedulesRepo.create({
        startDate: s.startDate,
        endDate: s.endDate,
        timeSlot: s.timeSlot || null,
        roundName: s.roundName || null,
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      }),
    );
  }

  async create(dto: CreateTourDto) {
    const tourCode = await this.makeTourCode();
    const created = this.toursRepo.create({
      tourCode,
      name: dto.name,
      description: dto.description,
      tourType: dto.tourType as unknown as TourType,
      categories: dto.categories || [],
      price: Number(dto.price),
      childPrice: dto.childPrice ? Number(dto.childPrice) : null,
      minPeople: dto.minPeople ? Number(dto.minPeople) : null,
      maxPeople: dto.maxPeople ? Number(dto.maxPeople) : null,
      originalPrice: dto.originalPrice ? Number(dto.originalPrice) : null,
      images: dto.images || [],
      highlights: dto.highlights || [],
      itinerary: dto.itinerary || [],
      transportation: dto.transportation || '',
      duration: dto.duration,
      region: dto.region,
      province: dto.province,
      accommodation: dto.accommodation || null,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      schedules: this.mapSchedulesForCreate(dto),
    });
    const saved = await this.toursRepo.save(created);
    const withRelations = await this.toursRepo.findOne({
      where: { id: saved.id },
      relations: ['schedules'],
    });
    return withRelations ? this.normalizeTour(withRelations) : saved;
  }

  // admin=true จะ return ทุกทัวร์ รวมที่ปิดใช้งาน (source of truth = PostgreSQL)
  async findAll(filters?: {
    region?: string;
    province?: string;
    tourType?: string;
    search?: string;
    admin?: string;
  }) {
    const { region, province, tourType, search, admin } = filters || {};
    const qb = this.toursRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.schedules', 's')
      .orderBy('t.createdAt', 'DESC')
      .addOrderBy('s.startDate', 'ASC');

    if (admin !== 'true') {
      qb.andWhere('t.isActive = true');
    }
    if (region) {
      qb.andWhere('t.region = :region', { region });
    }
    if (province) {
      qb.andWhere('t.province = :province', { province });
    }
    if (tourType) {
      qb.andWhere('t.tourType = :tourType', { tourType });
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      qb.andWhere(new Brackets((subQb) => {
        subQb.where('t.name ILIKE :term', { term })
          .orWhere('t.description ILIKE :term', { term })
          .orWhere('t.province ILIKE :term', { term });
      }));
    }
    const tours = await qb.getMany();
    return tours.map((tour) => this.normalizeTour(tour));
  }

  async findOne(id: number) {
    const tour = await this.toursRepo.findOne({
      where: { id, isActive: true },
      relations: ['schedules'],
    });
    return tour ? this.normalizeTour(tour) : null;
  }

  async getScheduleWithTour(scheduleId: number) {
    const schedule = await this.schedulesRepo.findOne({
      where: { id: scheduleId },
      relations: ['tour'],
    });
    if (!schedule || !schedule.tour) return null;
    return { schedule, tour: this.normalizeTour({ ...schedule.tour, schedules: [] } as Tour) };
  }

  async getAvailableSeats(tourId: number, scheduleId: number) {
    const tour = await this.toursRepo.findOne({
      where: { id: tourId },
      relations: ['schedules'],
    });
    if (!tour) {
      throw new Error(`Tour ${tourId} not found`);
    }
    const schedule = (tour.schedules || []).find((s: TourSchedule) => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found for tour ${tourId}`);
    }
    const currentBooked = Math.max(0, Number(schedule.currentBooked || 0));
    const maxCapacity = Number(schedule.maxCapacity || 0);
    const availableSeats = maxCapacity - currentBooked;

    return {
      tourId,
      scheduleId,
      maxCapacity,
      currentBooked,
      availableSeats,
      isFull: availableSeats <= 0,
    };
  }

  async update(id: number, dto: UpdateTourDto) {
    const tour = await this.toursRepo.findOne({
      where: { id },
      relations: ['schedules'],
    });
    if (!tour) return null;

    // กันการเขียนค่าข้ามประเภท โดย normalize ให้เป็นรูปแบบ DB ก่อน save
    const { schedules: newSchedules, ...rest } = dto as any;
    Object.assign(tour, {
      ...rest,
      price: rest.price !== undefined ? Number(rest.price) : tour.price,
      childPrice: rest.childPrice !== undefined ? Number(rest.childPrice) : tour.childPrice,
      originalPrice: rest.originalPrice !== undefined ? Number(rest.originalPrice) : tour.originalPrice,
      minPeople: rest.minPeople !== undefined ? Number(rest.minPeople) : tour.minPeople,
      maxPeople: rest.maxPeople !== undefined ? Number(rest.maxPeople) : tour.maxPeople,
    });

    if (newSchedules && Array.isArray(newSchedules)) {
      await this.schedulesRepo.delete({ tourId: id });
      tour.schedules = newSchedules.map((s: any) => this.schedulesRepo.create({
        tourId: id,
        startDate: s.startDate,
        endDate: s.endDate,
        timeSlot: s.timeSlot || null,
        roundName: s.roundName || null,
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      }));
    }
    await this.toursRepo.save(tour);
    const updated = await this.toursRepo.findOne({
      where: { id },
      relations: ['schedules'],
    });
    return updated ? this.normalizeTour(updated) : null;
  }

  async remove(id: number) {
    const tour = await this.toursRepo.findOne({ where: { id } });
    if (!tour) return null;

    // soft delete: ซ่อนจากหน้าผู้ใช้ แต่ไม่ลบทิ้งเพื่อความปลอดภัยของข้อมูลย้อนหลัง
    tour.isActive = false;
    await this.toursRepo.save(tour);
    return { id, deleted: true };
  }

  // แนะนำทัวร์แบบ Personalized โดยใช้พฤติกรรมผู้ใช้ + fallback เพื่อให้หน้าแรกมีข้อมูลเสมอ
  async getRecommendationsForUser(userId: string, limit = 8) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 12));
    const activeTours = await this.findAll();
    const activeMap = new Map<number, any>(activeTours.map((tour: any) => [tour.id, tour]));
    const resultTours: any[] = [];
    const usedTourIds = new Set<number>();

    const addIfActive = (tourId: number) => {
      if (usedTourIds.has(tourId)) return;
      const tour = activeMap.get(tourId);
      if (!tour) return;
      usedTourIds.add(tourId);
      resultTours.push(tour);
    };

    // 1) Personalized score จากพฤติกรรมผู้ใช้ใน 90 วันล่าสุด
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

    // 2) Fallback เป็นทัวร์ที่กำลังนิยมโดยรวมใน 30 วันล่าสุด
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

    // 3) Fallback สุดท้าย: เรียงตามความนิยมคงที่จากข้อมูลรีวิว
    if (resultTours.length < safeLimit) {
      const staticPopular = [...activeTours].sort((a: any, b: any) => {
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return (b.rating || 0) - (a.rating || 0);
      });
      staticPopular.forEach((tour: any) => addIfActive(tour.id));
    }

    return resultTours.slice(0, safeLimit);
  }

  // อัปเดตจำนวนที่จองโดยยึดฐานข้อมูลเป็นหลัก พร้อม clamp ไม่ให้ติดลบ/เกินความจุ
  async updateScheduleBookedCount(scheduleId: number, addPax: number) {
    const schedule = await this.schedulesRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }
    const maxCapacity = Number(schedule.maxCapacity || 0);
    const currentBooked = Number(schedule.currentBooked || 0);
    const nextBooked = Math.max(0, Math.min(maxCapacity, currentBooked + addPax));
    schedule.currentBooked = nextBooked;
    await this.schedulesRepo.save(schedule);
  }
}

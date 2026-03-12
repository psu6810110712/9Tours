import { isAxiosError } from 'axios';
import api from './api';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  tourType?: string;
}

export interface DashboardData {
  summaryCards: {
    totalRevenue: number;
    totalBookings: number;
    totalViews: number;
    totalCustomers: number;
  };
  topTours: {
    rank: number;
    name: string;
    province: string;
    reviewCount: number;
    popularityPercent: number;
    revenue: number;
  }[];
  bookingsByStatus: Record<string, number>;
  regionStats: { name: string; count: number; percent: number }[];
  provinceStats: { name: string; count: number; percent: number }[];
  viewsOverTime: { month: string; views: number }[];
  bookingsOverTime: { day: number; thisMonth: number; lastMonth: number }[];
  conversionRate: number;
}

const REGION_ALIASES: Record<string, string> = {
  all: 'all',
  north: 'ภาคเหนือ',
  northeast: 'ภาคตะวันออกเฉียงเหนือ',
  central: 'ภาคกลาง',
  east: 'ภาคตะวันออก',
  west: 'ภาคตะวันตก',
  south: 'ภาคใต้',
  'ภาคเหนือ': 'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ': 'ภาคตะวันออกเฉียงเหนือ',
  'ภาคกลาง': 'ภาคกลาง',
  'ภาคตะวันออก': 'ภาคตะวันออก',
  'ภาคตะวันตก': 'ภาคตะวันตก',
  'ภาคใต้': 'ภาคใต้',
};

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  summaryCards: {
    totalRevenue: 0,
    totalBookings: 0,
    totalViews: 0,
    totalCustomers: 0,
  },
  topTours: [],
  bookingsByStatus: {},
  regionStats: [],
  provinceStats: [],
  viewsOverTime: [],
  bookingsOverTime: [],
  conversionRate: 0,
};

function normalizeRegion(region?: string) {
  if (!region) return undefined;
  return REGION_ALIASES[region] ?? region;
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
}

function normalizeDashboardData(data: unknown): DashboardData {
  const source = (typeof data === 'object' && data !== null ? data : {}) as Partial<DashboardData>;

  return {
    summaryCards: {
      totalRevenue: toNumber(source.summaryCards?.totalRevenue),
      totalBookings: toNumber(source.summaryCards?.totalBookings),
      totalViews: toNumber(source.summaryCards?.totalViews),
      totalCustomers: toNumber(source.summaryCards?.totalCustomers),
    },
    topTours: Array.isArray(source.topTours)
      ? source.topTours.map((tour, index) => ({
        rank: toNumber(tour.rank) || index + 1,
        name: tour.name || '-',
        province: tour.province || '-',
        reviewCount: toNumber(tour.reviewCount),
        popularityPercent: toNumber(tour.popularityPercent),
        revenue: toNumber(tour.revenue),
      }))
      : [],
    bookingsByStatus: source.bookingsByStatus && typeof source.bookingsByStatus === 'object'
      ? Object.fromEntries(Object.entries(source.bookingsByStatus).map(([key, value]) => [key, toNumber(value)]))
      : {},
    regionStats: Array.isArray(source.regionStats)
      ? source.regionStats.map((region) => ({
        name: region.name || '-',
        count: toNumber(region.count),
        percent: toNumber(region.percent),
      }))
      : [],
    provinceStats: Array.isArray(source.provinceStats)
      ? source.provinceStats.map((province) => ({
        name: province.name || '-',
        count: toNumber(province.count),
        percent: toNumber(province.percent),
      }))
      : [],
    viewsOverTime: Array.isArray(source.viewsOverTime)
      ? source.viewsOverTime.map((entry) => ({ month: entry.month || '-', views: toNumber(entry.views) }))
      : [],
    bookingsOverTime: Array.isArray(source.bookingsOverTime)
      ? source.bookingsOverTime.map((entry) => ({
        day: toNumber(entry.day),
        thisMonth: toNumber(entry.thisMonth),
        lastMonth: toNumber(entry.lastMonth),
      }))
      : [],
    conversionRate: toNumber(source.conversionRate),
  };
}

function getDashboardErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง';
}

export const dashboardService = {
  async getData(filters: DashboardFilters = {}) {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const normalizedRegion = normalizeRegion(filters.region);
    if (normalizedRegion && normalizedRegion !== 'all') {
      params.region = normalizedRegion;
    }
    if (filters.tourType && filters.tourType !== 'all') {
      params.tourType = filters.tourType;
    }

    try {
      const res = await api.get('/admin/dashboard', { params });
      return normalizeDashboardData(res.data);
    } catch (error) {
      throw new Error(getDashboardErrorMessage(error));
    }
  },
};

import api from './api';

export interface DashboardFilters {
    startDate?: string;
    endDate?: string;
    region?: string;
    tourType?: string;
}

export const dashboardService = {
    async getData(filters: DashboardFilters = {}) {
        const params: Record<string, string> = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.region && filters.region !== 'all') params.region = filters.region;
        if (filters.tourType && filters.tourType !== 'all') params.tourType = filters.tourType;

        const res = await api.get('/admin/dashboard', { params });
        return res.data;
    },
};

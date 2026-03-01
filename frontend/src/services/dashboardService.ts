import api from './api';

export const dashboardService = {
    async getData() {
        const res = await api.get('/admin/dashboard');
        return res.data;
    },
};

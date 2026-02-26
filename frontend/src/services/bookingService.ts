import api from './api';

export interface CreateBookingDto {
  scheduleId: number;
  paxCount: number;
}

export interface BookingResponse {
  id: string; // backend is returning UUID string usually, but let's just make it broad
  scheduleId: number;
  customerId: number;
  paxCount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  schedule?: any;
  customer?: any;
  payment?: any;
}

export const bookingService = {
  createBooking: async (data: CreateBookingDto): Promise<BookingResponse> => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getMyBookings: async (): Promise<BookingResponse[]> => {
    const response = await api.get('/bookings/my');
    return response.data;
  },

  getBookingById: async (id: string): Promise<BookingResponse> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id: string): Promise<BookingResponse> => {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return response.data;
  }
};

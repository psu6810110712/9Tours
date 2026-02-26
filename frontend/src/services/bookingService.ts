import api from './api';

export interface BookingPayload {
  tourId: number;
  title: string;
  fullName: string;
  phone: string;
  email: string;
  specialRequest?: string;
  adultCount: number;
  childCount: number;
  totalPrice: number;
}

export const bookingService = {
  // ฟังก์ชันส่งข้อมูลการจองไปที่ Server
  createBooking: async (data: BookingPayload) => {
    // หมายเหตุ: เส้น /bookings นี้ต้องตรงกับที่ Backend ทำไว้
    const response = await api.post('/bookings', data);
    return response.data;
  },
};
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import TourCard from './TourCard';
import * as trackingService from '../services/trackingService';

// Mock tracking service
vi.mock('../services/trackingService', () => ({
  trackEvent: vi.fn(),
}));

const mockTour = {
  id: 1,
  name: 'Amazing Phuket Trip',
  description: 'Enjoy the sun and sea',
  tourType: 'Beach',
  categories: ['Island', 'Adventure'],
  price: 1500,
  originalPrice: 2000,
  images: ['phuket.jpg'],
  highlights: ['Amazing views', 'Snorkeling', 'Free cancellation'],
  duration: '1 Day',
  rating: 4.8,
  reviewCount: 120,
  province: 'Phuket',
  isActive: true,
  schedules: [],
};

describe('TourCard Component', () => {
  it('renders tour information correctly', () => {
    render(
      <MemoryRouter>
        <TourCard tour={mockTour as any} />
      </MemoryRouter>
    );

    expect(screen.getByText('Amazing Phuket Trip')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('ลด 25%')).toBeInTheDocument();
  });

  it('calls trackEvent when clicked', () => {
    const trackSpy = vi.spyOn(trackingService, 'trackEvent');

    render(
      <MemoryRouter>
        <TourCard tour={mockTour as any} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link'));
    
    expect(trackSpy).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'cta_click',
      tourId: mockTour.id,
    }));
  });
});

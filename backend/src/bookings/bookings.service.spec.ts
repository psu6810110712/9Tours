import { BadRequestException } from '@nestjs/common'
import { BookingsService } from './bookings.service'
import { Booking, BookingStatus } from './entities/booking.entity'
import { User, UserRole, AuthProvider } from '../users/entities/user.entity'

describe('BookingsService', () => {
  let service: BookingsService
  let bookingsRepository: any
  let usersRepository: any
  let toursService: any
  let bookingRepoInTransaction: any
  let userRepoInTransaction: any
  let currentUser: User

  beforeEach(() => {
    currentUser = {
      id: 'user-1',
      prefix: 'นาย',
      name: 'Existing User',
      email: 'existing@example.com',
      phone: '0899999999',
      password: null,
      role: UserRole.CUSTOMER,
      authProvider: AuthProvider.LOCAL,
      providerUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bookings: [],
      tourViews: [],
      refreshSessions: [],
    }

    bookingRepoInTransaction = {
      create: jest.fn((data) => ({ id: 101, createdAt: new Date(), ...data })),
      save: jest.fn(async (booking) => ({ id: 101, createdAt: new Date(), ...booking })),
    }

    userRepoInTransaction = {
      findOne: jest.fn(async ({ where }: { where: Partial<User> }) => {
        if (where.id) {
          return where.id === currentUser.id ? currentUser : null
        }

        if (where.email) {
          return where.email === currentUser.email ? currentUser : null
        }

        return null
      }),
      find: jest.fn(async () => []),
      save: jest.fn(async (user: User) => ({ ...user })),
    }

    bookingsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      manager: {
        transaction: jest.fn(async (callback: (manager: { getRepository: (entity: unknown) => unknown }) => unknown) => callback({
          getRepository: (entity: unknown) => (entity === Booking ? bookingRepoInTransaction : userRepoInTransaction),
        })),
      },
    }

    usersRepository = {}
    toursService = {
      findAll: jest.fn(() => [
        {
          id: 55,
          tourCode: 'T-001',
          name: 'Test Tour',
          price: 2500,
          childPrice: 1500,
          images: ['tour.jpg'],
          accommodation: 'Hotel',
          minPeople: null,
          schedules: [
            {
              id: 77,
              startDate: '2026-05-10',
              endDate: '2026-05-12',
              maxCapacity: 20,
              currentBooked: 3,
            },
          ],
        },
      ]),
      updateScheduleBookedCount: jest.fn(),
    }

    const notificationsService = {
      sendBookingConfirmation: jest.fn(),
      sendStatusUpdate: jest.fn(),
    }

    service = new BookingsService(bookingsRepository, usersRepository, toursService, notificationsService as any)
  })

  it('stores booking contact snapshot and syncs the customer profile in one transaction', async () => {
    const result = await service.create(currentUser.id, {
      scheduleId: 77,
      paxCount: 2,
      adults: 2,
      children: 0,
      specialRequest: 'Need a window seat',
      contactPrefix: 'นางสาว',
      contactName: 'Farn Patcharapon',
      contactEmail: 'FARN@example.com',
      contactPhone: '+66812345678',
    })

    expect(userRepoInTransaction.save).toHaveBeenCalledWith(expect.objectContaining({
      prefix: 'นางสาว',
      name: 'Farn Patcharapon',
      email: 'farn@example.com',
      phone: '0812345678',
    }))
    expect(bookingRepoInTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: currentUser.id,
      scheduleId: 77,
      paxCount: 2,
      contactPrefix: 'นางสาว',
      contactName: 'Farn Patcharapon',
      contactEmail: 'farn@example.com',
      contactPhone: '0812345678',
      status: BookingStatus.PENDING_PAYMENT,
    }))
    expect(result.contactEmail).toBe('farn@example.com')
    expect(result.contactPhone).toBe('0812345678')
    expect(toursService.updateScheduleBookedCount).toHaveBeenCalledWith(77, 2)
  })

  it('rejects invalid contact phone numbers before opening a transaction', async () => {
    await expect(service.create(currentUser.id, {
      scheduleId: 77,
      paxCount: 1,
      adults: 1,
      children: 0,
      contactPrefix: 'นาย',
      contactName: 'Test User',
      contactEmail: 'test@example.com',
      contactPhone: '12345',
    })).rejects.toBeInstanceOf(BadRequestException)

    expect(bookingsRepository.manager.transaction).not.toHaveBeenCalled()
    expect(toursService.updateScheduleBookedCount).not.toHaveBeenCalled()
  })
})

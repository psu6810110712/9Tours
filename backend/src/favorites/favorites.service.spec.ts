import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoriteTour } from './entities/favorite-tour.entity';
import { Tour } from '../tours/entities/tour.entity';

const mockFavoriteRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockTourRepo = () => ({
  findOne: jest.fn(),
});

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoriteRepo: ReturnType<typeof mockFavoriteRepo>;
  let tourRepo: ReturnType<typeof mockTourRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: getRepositoryToken(FavoriteTour), useFactory: mockFavoriteRepo },
        { provide: getRepositoryToken(Tour), useFactory: mockTourRepo },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    favoriteRepo = module.get(getRepositoryToken(FavoriteTour));
    tourRepo = module.get(getRepositoryToken(Tour));
  });

  describe('addFavorite', () => {
    const userId = 'user-uuid-1';
    const tourId = 42;

    it('should add a favorite when tour is active and not already favorited', async () => {
      tourRepo.findOne.mockResolvedValue({ id: tourId, isActive: true });
      favoriteRepo.findOne.mockResolvedValue(null);
      const created = { id: 1, userId, tourId };
      favoriteRepo.create.mockReturnValue(created);
      favoriteRepo.save.mockResolvedValue(created);

      const result = await service.addFavorite(userId, tourId);

      expect(tourRepo.findOne).toHaveBeenCalledWith({ where: { id: tourId } });
      expect(favoriteRepo.findOne).toHaveBeenCalledWith({ where: { userId, tourId } });
      expect(favoriteRepo.create).toHaveBeenCalledWith({ userId, tourId });
      expect(result).toEqual(created);
    });

    it('should throw NotFoundException when tour does not exist', async () => {
      tourRepo.findOne.mockResolvedValue(null);

      await expect(service.addFavorite(userId, tourId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when tour is inactive', async () => {
      tourRepo.findOne.mockResolvedValue({ id: tourId, isActive: false });

      await expect(service.addFavorite(userId, tourId)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when already favorited', async () => {
      tourRepo.findOne.mockResolvedValue({ id: tourId, isActive: true });
      favoriteRepo.findOne.mockResolvedValue({ id: 1, userId, tourId });

      await expect(service.addFavorite(userId, tourId)).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFavorite', () => {
    const userId = 'user-uuid-1';
    const tourId = 42;

    it('should remove an existing favorite', async () => {
      const existing = { id: 1, userId, tourId };
      favoriteRepo.findOne.mockResolvedValue(existing);
      favoriteRepo.remove.mockResolvedValue(existing);

      const result = await service.removeFavorite(userId, tourId);

      expect(favoriteRepo.remove).toHaveBeenCalledWith(existing);
      expect(result).toEqual({ removed: true });
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      favoriteRepo.findOne.mockResolvedValue(null);

      await expect(service.removeFavorite(userId, tourId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listFavorites', () => {
    const userId = 'user-uuid-1';

    it('should return paginated favorites with default sort', async () => {
      const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: 1, tourId: 10, tour: { id: 10, price: 100 } }],
          1,
        ]),
      };
      favoriteRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listFavorites(userId, { limit: 20, offset: 0 });

      expect(mockQb.orderBy).toHaveBeenCalledWith('favorite.createdAt', 'DESC');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should sort by price ascending', async () => {
      const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      favoriteRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.listFavorites(userId, { sortBy: 'price_asc' });

      expect(mockQb.orderBy).toHaveBeenCalledWith('tour.price', 'ASC', 'NULLS LAST');
    });

    it('should cap page size at MAX_PAGE_SIZE', async () => {
      const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      favoriteRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.listFavorites(userId, { limit: 999 });

      expect(mockQb.take).toHaveBeenCalledWith(50);
    });

    it('should indicate hasMore when more items exist', async () => {
      const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          Array(20).fill({ id: 1 }),
          25,
        ]),
      };
      favoriteRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listFavorites(userId, { limit: 20, offset: 0 });

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(25);
    });
  });
});

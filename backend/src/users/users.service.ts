import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import {
  CustomerPrefix,
  isValidCustomerEmail,
  isValidCustomerName,
  isValidCustomerPhone,
  isValidCustomerPrefix,
  normalizeEmail,
  normalizeThaiPhoneInput,
  sanitizeCustomerName,
} from './customer-profile.utils';

interface CreateUserOptions {
  hashPassword?: boolean;
}

export interface PublicUser {
  id: string;
  prefix: CustomerPrefix | null;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  profileCompleted: boolean;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: this.normalizeEmail(email) } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = normalizeThaiPhoneInput(phone);
    if (!normalizedPhone) {
      return null;
    }

    const users = await this.usersRepository.find({ where: { phone: Not(IsNull()) } });
    const matches = users.filter((user) => normalizeThaiPhoneInput(user.phone) === normalizedPhone);
    if (matches.length > 1) {
      throw new BadRequestException('พบหลายบัญชีที่ใช้หมายเลขโทรศัพท์นี้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    return matches[0] ?? null;
  }

  async findByProviderUserId(providerUserId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { providerUserId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>, options?: CreateUserOptions): Promise<User> {
    const preparedUserData = await this.prepareUserData(userData, options);
    await this.ensureUniqueContactInfo(preparedUserData);
    const newUser = this.usersRepository.create(preparedUserData);
    return this.usersRepository.save(newUser);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`ไม่พบผู้ใช้งานรหัส ${id}`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const preparedUpdate = await this.prepareUserData(updateUserDto, {
      hashPassword: !!updateUserDto.password,
    });
    await this.ensureUniqueContactInfo(preparedUpdate, id);
    this.usersRepository.merge(user, preparedUpdate);
    return this.usersRepository.save(user);
  }

  async updateOwnProfile(id: string, updateOwnProfileDto: UpdateOwnProfileDto): Promise<User> {
    const user = await this.findOne(id);
    const preparedUpdate = await this.prepareUserData(updateOwnProfileDto);
    await this.ensureUniqueContactInfo(preparedUpdate, id);
    this.usersRepository.merge(user, preparedUpdate);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      prefix: user.prefix ?? null,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
      profileCompleted: isCustomerProfileComplete(user),
    };
  }

  async normalizeStoredPhones() {
    const users = await this.usersRepository.find({ where: { phone: Not(IsNull()) } });
    const seenPhone = new Map<string, string>();
    const updates: User[] = [];

    for (const user of users) {
      const normalizedPhone = normalizeThaiPhoneInput(user.phone);
      if (!normalizedPhone) {
        this.logger.warn(`Skipping invalid stored phone for user ${user.id}`);
        continue;
      }

      const existingOwner = seenPhone.get(normalizedPhone);
      if (existingOwner && existingOwner !== user.id) {
        this.logger.warn(`Phone collision detected after normalization for users ${existingOwner} and ${user.id}`);
        continue;
      }

      seenPhone.set(normalizedPhone, user.id);
      if (user.phone !== normalizedPhone) {
        user.phone = normalizedPhone;
        updates.push(user);
      }
    }

    if (updates.length > 0) {
      await this.usersRepository.save(updates);
    }
  }

  private normalizeEmail(email?: string | null) {
    return email?.trim().toLowerCase() ?? '';
  }

  private async ensureUniqueContactInfo(preparedUserData: Partial<User>, excludeUserId?: string) {
    if (preparedUserData.email) {
      const existingUser = await this.findByEmail(preparedUserData.email);
      if (existingUser && existingUser.id !== excludeUserId) {
        throw new BadRequestException('อีเมลนี้มีผู้ใช้แล้ว');
      }
    }

    if (preparedUserData.phone) {
      const existingUser = await this.findByPhone(preparedUserData.phone);
      if (existingUser && existingUser.id !== excludeUserId) {
        throw new BadRequestException('หมายเลขโทรศัพท์นี้มีผู้ใช้แล้ว');
      }
    }
  }

  private async prepareUserData(userData: Partial<User>, options?: CreateUserOptions): Promise<Partial<User>> {
    const preparedUserData: Partial<User> = { ...userData };

    if ('prefix' in preparedUserData) {
      preparedUserData.prefix = isValidCustomerPrefix(preparedUserData.prefix)
        ? preparedUserData.prefix
        : preparedUserData.prefix ?? null;
    }

    if (preparedUserData.name) {
      preparedUserData.name = sanitizeCustomerName(preparedUserData.name);
    }

    if (preparedUserData.email) {
      preparedUserData.email = normalizeEmail(preparedUserData.email);
    }

    if ('phone' in preparedUserData) {
      if (preparedUserData.phone === null || preparedUserData.phone === undefined || preparedUserData.phone === '') {
        preparedUserData.phone = null;
      } else {
        preparedUserData.phone = normalizeThaiPhoneInput(preparedUserData.phone) ?? String(preparedUserData.phone).trim();
      }
    }

    if (options?.hashPassword && preparedUserData.password) {
      preparedUserData.password = await bcrypt.hash(preparedUserData.password, 10);
    }

    return preparedUserData;
  }
}

export function isCustomerProfileComplete(user: Pick<User, 'role' | 'prefix' | 'name' | 'email' | 'phone'>) {
  if (user.role !== UserRole.CUSTOMER) {
    return true;
  }

  return (
    isValidCustomerPrefix(user.prefix)
    && isValidCustomerName(user.name)
    && isValidCustomerEmail(user.email)
    && isValidCustomerPhone(user.phone)
  );
}

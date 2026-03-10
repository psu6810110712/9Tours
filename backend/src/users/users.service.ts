import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

interface CreateUserOptions {
  hashPassword?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: this.normalizeEmail(email) } });
  }

  async create(userData: Partial<User>, options?: CreateUserOptions): Promise<User> {
    const preparedUserData = await this.prepareUserData(userData, options);
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
    const user = await this.usersRepository.findOne({ where: { id } });
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
    this.usersRepository.merge(user, preparedUpdate);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private normalizeEmail(email?: string | null) {
    return email?.trim().toLowerCase() ?? '';
  }

  private async prepareUserData(userData: Partial<User>, options?: CreateUserOptions): Promise<Partial<User>> {
    const preparedUserData: Partial<User> = { ...userData };

    if (preparedUserData.email) {
      preparedUserData.email = this.normalizeEmail(preparedUserData.email);
    }

    if (options?.hashPassword && preparedUserData.password) {
      preparedUserData.password = await bcrypt.hash(preparedUserData.password, 10);
    }

    return preparedUserData;
  }
}

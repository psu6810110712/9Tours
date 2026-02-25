import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 1. ฟังก์ชันค้นหาด้วย Email (ที่เราทำไว้ก่อนหน้า)
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // 2. ฟังก์ชัน Create (ที่เราทำไว้ก่อนหน้า)
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  // 👇 เพิ่มฟังก์ชันด้านล่างนี้เข้าไปให้ครบ 👇

  // 3. ค้นหาทั้งหมด
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // 4. ค้นหาคนเดียวด้วย ID (UUID)
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ไม่พบผู้ใช้งานรหัส ${id}`);
    }
    return user;
  }

  // 5. อัปเดตข้อมูล
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // เช็คก่อนว่ามีคนนี้อยู่จริงไหม
    // เอาข้อมูลใหม่ (updateUserDto) ไปทับข้อมูลเดิม (user)
    this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  // 6. ลบข้อมูล
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id); // เช็คก่อนว่ามีคนนี้อยู่จริงไหม
    await this.usersRepository.remove(user);
  }
}
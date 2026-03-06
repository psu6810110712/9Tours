import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeederService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        try {
            const isProduction = process.env.NODE_ENV === 'production';
            const shouldSeedOnStartup = process.env.SEED_USERS_ON_STARTUP?.trim() !== 'false';

            if (isProduction || !shouldSeedOnStartup) {
                console.log('⏭️ Skip users seeding (production or disabled by SEED_USERS_ON_STARTUP=false)');
                return;
            }

            const existingUsers = await this.userRepository.count();
            if (existingUsers > 0) {
                console.log(`✅ Users already exists (${existingUsers} users), skipping seeding.`);
                return;
            }

            console.log('🌱 Database is empty, seeding default admin and user...');

            const adminPassword = await bcrypt.hash('12121212', 10);
            const userPassword = await bcrypt.hash('12121212', 10);

            const defaultUsers = [
                {
                    name: 'Admin 9Tours',
                    email: 'admin@9tours.com',
                    password: adminPassword,
                    phone: '0800000000',
                    role: UserRole.ADMIN,
                },
                {
                    name: 'Test User',
                    email: 'user@9tours.com',
                    password: userPassword,
                    phone: '0901234567',
                    role: UserRole.CUSTOMER,
                },
            ];

            await this.userRepository.save(
                defaultUsers.map(user => this.userRepository.create(user))
            );

            console.log('✅ Seeded default admin (admin@9tours.com) and user (user@9tours.com)');
        } catch (error) {
            console.error('❌ Error seeding users:', error);
        }
    }
}

import { DataSource } from 'typeorm';
import { seedReviews } from './seed-reviews';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: '9tours_db',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    await seedReviews(AppDataSource);

    console.log('👋 Closing database connection...');
    await AppDataSource.destroy();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();

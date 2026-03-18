import { DataSource } from 'typeorm';
import { Review } from '../reviews/entities/review.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';

const THAI_NAMES = [
  'สมชาย วงศ์ไทย',
  'สุดา ใจดี',
  'ประเสริฐ สุขสันต์',
  'วิไล มั่นคง',
  'ธนากร รุ่งเรือง',
  'นภา ศรีสุข',
  'อนุชา พรหมมา',
  'ศิริพร แสงทอง',
  'วีระ ชัยชนะ',
  'มาลี บุญมี',
  'สมศักดิ์ เจริญสุข',
  'พิมพ์ใจ ดีงาม',
  'ชัยวัฒน์ สว่างวงศ์',
  'อรุณี มีสุข',
  'ธีรพล ทองดี',
  'กนกวรรณ สุขใส',
  'ปรีชา ใจกล้า',
  'สุภาพร ศรีจันทร์',
  'วิชัย พูลสวัสดิ์',
  'ลัดดา รักษ์ดี',
  'ณัฐพล วรรณา',
  'จิราพร สมบูรณ์',
  'สุรชัย ทรงธรรม',
  'ปิยะนุช แก้วใส',
  'ไพโรจน์ สุขเกษม',
];

const REVIEW_TEMPLATES = [
  { rating: 5, comments: [
    'ทริปนี้สนุกมากค่ะ ไกด์น่ารัก ดูแลดีมาก แนะนำเลยค่ะ',
    'ประทับใจมากครับ บริการดี อาหารอร่อย ทัศนียภาพสวยงาม',
    'คุ้มค่ามากๆ ทีมงานดูแลดี ที่พักสะอาด อาหารอร่อย',
    'สนุกมากค่ะ ได้ประสบการณ์ดีๆ ไกด์เก่งมาก แนะนำเลยค่ะ',
    'ทริปดีมากครับ บรรยากาศดี ทีมงานน่ารัก จะมาอีกแน่นอน',
    'ประทับใจทุกอย่างเลยค่ะ สถานที่สวย บริการดีเยี่ยม',
    'เป็นทริปที่ดีมากๆ ครอบครัวชอบมาก จะแนะนำเพื่อนมาด้วย',
    'สุดยอดครับ คุ้มค่าเงินที่จ่ายไป ประทับใจมากๆ',
  ]},
  { rating: 4, comments: [
    'โดยรวมดีครับ มีบางจุดที่ควรปรับปรุง แต่ก็พอใจนะครับ',
    'ดีค่ะ แต่อาหารอาจจะปรับเมนูให้หลากหลายกว่านี้',
    'สนุกดีครับ เวลาอาจจะน้อยไปหน่อย อยากให้เพิ่มเวลาอีกนิด',
    'โอเคมากค่ะ ทีมงานดูแลดี แต่รถอาจจะปรับปรุงให้สะดวกกว่านี้',
    'พอใจครับ สถานที่สวย แต่คนเยอะไปหน่อย',
    'ดีค่ะ แต่ถ้ามีเวลาให้ถ่ายรูปมากกว่านี้จะดีมาก',
    'โดยรวมพอใจครับ แต่อยากให้มีกิจกรรมเพิ่มอีกนิด',
  ]},
  { rating: 3, comments: [
    'ปานกลางครับ มีทั้งดีและควรปรับปรุง',
    'โอเคค่ะ แต่คาดหวังไว้สูงกว่านี้หน่อย',
    'พอใช้ได้ครับ บางอย่างดี บางอย่างควรปรับปรุง',
    'ธรรมดาค่ะ ไม่ได้ประทับใจมากนัก',
  ]},
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomRatingAndComment(): { rating: number; comment: string } {
  const weights = [0.6, 0.3, 0.1]; // 60% rating 5, 30% rating 4, 10% rating 3
  const rand = Math.random();
  let cumulative = 0;
  let templateIndex = 0;

  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      templateIndex = i;
      break;
    }
  }

  const template = REVIEW_TEMPLATES[templateIndex];
  return {
    rating: template.rating,
    comment: getRandomElement(template.comments),
  };
}

async function seedReviews(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🌱 Starting review seeding...');

    // Get all tours
    const tours = await queryRunner.manager.find(Tour, {
      relations: ['schedules'],
    });

    if (tours.length === 0) {
      console.log('⚠️  No tours found. Please seed tours first.');
      await queryRunner.rollbackTransaction();
      return;
    }

    console.log(`📊 Found ${tours.length} tours`);

    // Create seed users if they don't exist
    const seedUsers: User[] = [];
    for (let i = 0; i < THAI_NAMES.length; i++) {
      const name = THAI_NAMES[i];
      const email = `seed.user${i + 1}@9tours.local`;
      
      let user = await queryRunner.manager.findOne(User, { where: { email } });
      
      if (!user) {
        user = queryRunner.manager.create(User, {
          name,
          email,
          role: UserRole.CUSTOMER,
          authProvider: 'local' as any,
          password: null,
        });
        await queryRunner.manager.save(User, user);
      }
      
      seedUsers.push(user);
    }

    console.log(`👥 Created/found ${seedUsers.length} seed users`);

    let totalReviewsCreated = 0;

    // For each tour, create reviews
    for (const tour of tours) {
      if (!tour.schedules || tour.schedules.length === 0) {
        console.log(`⚠️  Tour ${tour.id} has no schedules, skipping...`);
        continue;
      }

      // Determine number of reviews (10-25 per tour for variety)
      const reviewCount = Math.floor(Math.random() * 16) + 10; // 10-25 reviews
      
      console.log(`📝 Creating ${reviewCount} reviews for tour: ${tour.name}`);

      const usedUserIds = new Set<string>();
      let tourReviewsCreated = 0;

      for (let i = 0; i < reviewCount; i++) {
        // Pick a random user that hasn't reviewed this tour yet
        let user: User;
        let attempts = 0;
        do {
          user = getRandomElement(seedUsers);
          attempts++;
          if (attempts > 50) break; // Prevent infinite loop
        } while (usedUserIds.has(user.id) && usedUserIds.size < seedUsers.length);

        if (usedUserIds.has(user.id)) {
          continue; // Skip if we can't find a unique user
        }

        usedUserIds.add(user.id);

        // Pick a random schedule from this tour
        const schedule = getRandomElement(tour.schedules);

        // Create a booking for this review
        const booking = queryRunner.manager.create(Booking, {
          userId: user.id,
          scheduleId: schedule.id,
          status: BookingStatus.SUCCESS,
          paxCount: Math.floor(Math.random() * 4) + 1,
          adults: Math.floor(Math.random() * 3) + 1,
          children: Math.floor(Math.random() * 2),
          totalPrice: tour.price * (Math.floor(Math.random() * 4) + 1),
          contactPrefix: 'นาย',
          contactName: user.name,
          contactEmail: user.email,
          contactPhone: '0812345678',
        });
        await queryRunner.manager.save(Booking, booking);

        // Create review
        const { rating, comment } = getRandomRatingAndComment();
        const review = queryRunner.manager.create(Review, {
          bookingId: booking.id,
          userId: user.id,
          tourId: tour.id,
          rating,
          comment,
        });
        await queryRunner.manager.save(Review, review);

        tourReviewsCreated++;
        totalReviewsCreated++;
      }

      // Update tour rating and reviewCount
      const stats = await queryRunner.manager
        .createQueryBuilder(Review, 'r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(r.id)', 'count')
        .where('r.tour_id = :tourId', { tourId: tour.id })
        .getRawOne<{ avg: string; count: string }>();

      const avgRating = parseFloat(parseFloat(stats?.avg ?? '0').toFixed(2));
      const totalReviewCount = parseInt(stats?.count ?? '0', 10);

      await queryRunner.manager.update(Tour, tour.id, {
        rating: avgRating,
        reviewCount: totalReviewCount,
      });

      console.log(`✅ Tour ${tour.id}: ${tourReviewsCreated} reviews created, avg rating: ${avgRating}`);
    }

    await queryRunner.commitTransaction();
    console.log(`\n🎉 Successfully seeded ${totalReviewsCreated} reviews across ${tours.length} tours!`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding reviews:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

export { seedReviews };

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Create Admin
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventra.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@inventra.local',
      password: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  console.log({ admin });
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

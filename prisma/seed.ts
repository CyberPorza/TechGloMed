import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database seeder for development and staging environments.
 * Creates a minimal set of test data to bootstrap local development.
 *
 * ⚠️  Never run this against production.
 * Sprint 1 will expand this with richer fixtures.
 */
async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Upsert admin user (safe to re-run)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@techglommed.local' },
    update: {},
    create: {
      email: 'admin@techglommed.local',
      // NOTE: In Sprint 1 this will be a bcrypt hash.
      // Placeholder only — never use in production.
      passwordHash: 'PLACEHOLDER_HASH',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);
  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

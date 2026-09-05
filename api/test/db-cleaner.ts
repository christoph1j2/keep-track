import { PrismaService } from '../src/prisma/prisma.service';

export async function cleanDatabase(prisma: PrismaService) {
  const dbUrl: string = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('test')) {
    throw new Error(
      `Database URL does not contain 'test'. Aborting database cleanup to prevent accidental data loss. Current DATABASE_URL: ${dbUrl}`,
    );
  }

  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.template.deleteMany();
  await prisma.category.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.user.deleteMany();
}

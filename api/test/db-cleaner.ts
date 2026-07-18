import { PrismaService } from '../src/prisma/prisma.service';

export async function cleanDatabase(prisma: PrismaService) {
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.template.deleteMany();
  await prisma.category.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.user.deleteMany();
}

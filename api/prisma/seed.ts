import { PrismaClient, CategoryType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set!');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'asdf@asdf.asdf';
  const username = process.env.SEED_ADMIN_USERNAME || 'asdf';
  const password = process.env.SEED_ADMIN_PASSWORD || 'asdfasdf';
  const baseCurrency = 'CZK';
  const role = 'ADMIN';

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Upsert the User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      baseCurrency,
      role,
    },
    create: {
      email,
      username,
      passwordHash,
      baseCurrency,
      role,
    },
  });
  console.log(`Seeded user: ${user.email} (${user.id})`);

  // 2. Clear old data for this user to ensure idempotency when running seed repeatedly
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.complexBudgetCategory.deleteMany({
    where: { budget: { userId: user.id } },
  });
  await prisma.complexBudget.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.template.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  // 3. Create Categories
  const catFood = await prisma.category.create({
    data: {
      userId: user.id,
      label: 'Food & Groceries',
      iconName: 'pizza',
      colorClass: 'text-red-500',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catTransport = await prisma.category.create({
    data: {
      userId: user.id,
      label: 'Transport',
      iconName: 'car',
      colorClass: 'text-blue-500',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const catSalary = await prisma.category.create({
    data: {
      userId: user.id,
      label: 'Salary',
      iconName: 'cash',
      colorClass: 'text-green-500',
      type: CategoryType.INCOME,
      order: 3,
    },
  });
  console.log('Seeded categories.');

  // 4. Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: catSalary.id,
        title: 'Monthly Salary',
        date: new Date(),
        originalAmount: 55000,
        originalCurrency: 'CZK',
        amount: 55000,
      },
      {
        userId: user.id,
        categoryId: catFood.id,
        title: 'Lidl Groceries',
        date: new Date(),
        originalAmount: -1500,
        originalCurrency: 'CZK',
        amount: -1500,
      },
      {
        userId: user.id,
        categoryId: catTransport.id,
        title: 'Uber to work',
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        originalAmount: -350,
        originalCurrency: 'CZK',
        amount: -350,
      },
    ],
  });
  console.log('Seeded transactions.');

  // 5. Create Budgets
  await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: catFood.id,
      limit: 8000,
      order: 1,
    },
  });
  console.log('Seeded budget.');

  // 6. Create Templates
  await prisma.template.create({
    data: {
      userId: user.id,
      title: 'Quick Coffee',
      amount: 80,
      categoryId: catFood.id,
      showInHotbar: true,
      order: 1,
    },
  });
  console.log('Seeded template.');

  // 7. Create Complex Budget
  const complexBudget = await prisma.complexBudget.create({
    data: {
      userId: user.id,
      income: 55000,
      necessaryExpenses: 30000,
      limit: 25000,
    },
  });

  await prisma.complexBudgetCategory.create({
    data: {
      budgetId: complexBudget.id,
      categoryId: catTransport.id,
      limit: 2000,
    },
  });
  console.log('Seeded complex budget.');

  console.log('✅ All seed data generated successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

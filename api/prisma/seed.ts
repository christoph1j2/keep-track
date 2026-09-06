import { PrismaClient, CategoryType, Role } from '@prisma/client';
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

function daysAgo(days: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function cleanUserData(userId: string) {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.complexBudgetCategory.deleteMany({
    where: { budget: { userId } },
  });
  await prisma.complexBudget.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.template.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
}

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'asdf@asdf.asdf';
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'asdf';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'asdfasdf';

  const defaultUserPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  // ==========================================
  // 1. SEED USERS
  // ==========================================
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      passwordHash: adminPasswordHash,
      baseCurrency: 'CZK',
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash: adminPasswordHash,
      baseCurrency: 'CZK',
      role: Role.ADMIN,
    },
  });

  const userJohn = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      username: 'johndoe',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'EUR',
      role: Role.USER,
    },
    create: {
      email: 'john.doe@example.com',
      username: 'johndoe',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'EUR',
      role: Role.USER,
    },
  });

  const userJane = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {
      username: 'janesmith',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'CZK',
      role: Role.USER,
    },
    create: {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'CZK',
      role: Role.USER,
    },
  });

  const userAlex = await prisma.user.upsert({
    where: { email: 'alex.tech@example.com' },
    update: {
      username: 'alextech',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'USD',
      role: Role.USER,
    },
    create: {
      email: 'alex.tech@example.com',
      username: 'alextech',
      passwordHash: defaultUserPasswordHash,
      baseCurrency: 'USD',
      role: Role.USER,
    },
  });

  const allUsers = [adminUser, userJohn, userJane, userAlex];
  console.log(`👤 Seeded ${allUsers.length} users.`);

  // Clean old data for all users to guarantee idempotency and avoid stale complex budgets
  for (const u of allUsers) {
    await cleanUserData(u.id);
  }
  console.log('🧹 Cleaned existing records for seeded users.');

  // ==========================================
  // 2. SEED ADMIN USER (Deep Hierarchy & Rich Data)
  // ==========================================
  console.log('📦 Seeding primary account (Admin)...');

  // Parent Categories (Admin)
  const catIncome = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Salary & Income',
      iconName: 'AttachMoney',
      colorClass:
        'bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100',
      type: CategoryType.INCOME,
      order: 1,
    },
  });

  const catFood = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Food & Dining',
      iconName: 'LocalCafe',
      colorClass:
        'bg-orange-100 text-orange-500 dark:bg-orange-600 dark:text-orange-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const catHousing = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Housing & Living',
      iconName: 'Home',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const catTransport = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Transport',
      iconName: 'DirectionsTransit',
      colorClass:
        'bg-blue-100 text-blue-500 dark:bg-blue-600 dark:text-blue-100',
      type: CategoryType.EXPENSE,
      order: 4,
    },
  });

  const catEntertainment = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Entertainment & Leisure',
      iconName: 'Movie',
      colorClass:
        'bg-purple-100 text-purple-500 dark:bg-purple-600 dark:text-purple-100',
      type: CategoryType.EXPENSE,
      order: 5,
    },
  });

  const catShopping = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Shopping',
      iconName: 'ShoppingBag',
      colorClass:
        'bg-pink-100 text-pink-500 dark:bg-pink-600 dark:text-pink-100',
      type: CategoryType.EXPENSE,
      order: 6,
    },
  });

  const catHealth = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Health & Wellness',
      iconName: 'LocalHospital',
      colorClass: 'bg-red-100 text-red-500 dark:bg-red-600 dark:text-red-100',
      type: CategoryType.EXPENSE,
      order: 7,
    },
  });

  const catTravel = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Travel & Trips',
      iconName: 'Flight',
      colorClass:
        'bg-teal-100 text-teal-500 dark:bg-teal-600 dark:text-teal-100',
      type: CategoryType.EXPENSE,
      order: 8,
    },
  });

  const catEducation = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Education',
      iconName: 'MenuBook',
      colorClass:
        'bg-lime-100 text-lime-500 dark:bg-lime-600 dark:text-lime-100',
      type: CategoryType.EXPENSE,
      order: 9,
    },
  });

  const catMisc = await prisma.category.create({
    data: {
      userId: adminUser.id,
      label: 'Miscellaneous',
      iconName: 'MoreHoriz',
      colorClass:
        'bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-100',
      type: CategoryType.EXPENSE,
      order: 10,
    },
  });

  // Sub-categories (Admin)
  const catFreelance = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catIncome.id,
      label: 'Freelance & Consulting',
      iconName: 'Work',
      colorClass:
        'bg-teal-100 text-teal-500 dark:bg-teal-600 dark:text-teal-100',
      type: CategoryType.INCOME,
      order: 1,
    },
  });

  const catGroceries = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catFood.id,
      label: 'Groceries & Markets',
      iconName: 'ShoppingCart',
      colorClass:
        'bg-orange-100 text-orange-500 dark:bg-orange-600 dark:text-orange-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catRestaurants = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catFood.id,
      label: 'Restaurants & Bistros',
      iconName: 'LocalCafe',
      colorClass:
        'bg-amber-100 text-amber-500 dark:bg-amber-600 dark:text-amber-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const catCoffee = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catFood.id,
      label: 'Cafes & Snacks',
      iconName: 'LocalCafe',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const catRent = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catHousing.id,
      label: 'Rent & Mortgage',
      iconName: 'Home',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catUtilities = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catHousing.id,
      label: 'Electricity & Gas',
      iconName: 'ElectricBolt',
      colorClass:
        'bg-amber-100 text-amber-500 dark:bg-amber-600 dark:text-amber-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const catWater = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catHousing.id,
      label: 'Water & Waste',
      iconName: 'Water',
      colorClass:
        'bg-cyan-100 text-cyan-500 dark:bg-cyan-600 dark:text-cyan-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const catPublicTransit = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catTransport.id,
      label: 'Public Transit',
      iconName: 'DirectionsTransit',
      colorClass:
        'bg-blue-100 text-blue-500 dark:bg-blue-600 dark:text-blue-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catFuel = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catTransport.id,
      label: 'Fuel & Maintenance',
      iconName: 'LocalGasStation',
      colorClass:
        'bg-indigo-100 text-indigo-500 dark:bg-indigo-600 dark:text-indigo-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const catGaming = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catEntertainment.id,
      label: 'Gaming & Hobbies',
      iconName: 'GamepadRounded',
      colorClass:
        'bg-indigo-100 text-indigo-500 dark:bg-indigo-600 dark:text-indigo-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catGym = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catHealth.id,
      label: 'Fitness & Gym',
      iconName: 'FitnessCenter',
      colorClass:
        'bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  const catHotel = await prisma.category.create({
    data: {
      userId: adminUser.id,
      parentId: catTravel.id,
      label: 'Hotels & Stay',
      iconName: 'Hotel',
      colorClass:
        'bg-blue-100 text-blue-500 dark:bg-blue-600 dark:text-blue-100',
      type: CategoryType.EXPENSE,
      order: 1,
    },
  });

  // Admin Transactions (Spanning last 60 days)
  await prisma.transaction.createMany({
    data: [
      // Current Month Incomes
      {
        userId: adminUser.id,
        categoryId: catIncome.id,
        title: 'Monthly Salary - Acme Corp',
        date: daysAgo(5),
        originalAmount: 68000,
        originalCurrency: 'CZK',
        amount: 68000,
        bankReferenceId: 'TX-SALARY-M1',
      },
      {
        userId: adminUser.id,
        categoryId: catFreelance.id,
        title: 'Freelance Web Design Project',
        date: daysAgo(12),
        originalAmount: 18500,
        originalCurrency: 'CZK',
        amount: 18500,
        isAiCategorized: true,
      },
      // Previous Month Incomes
      {
        userId: adminUser.id,
        categoryId: catIncome.id,
        title: 'Monthly Salary - Acme Corp',
        date: daysAgo(35),
        originalAmount: 68000,
        originalCurrency: 'CZK',
        amount: 68000,
        bankReferenceId: 'TX-SALARY-M2',
      },
      {
        userId: adminUser.id,
        categoryId: catFreelance.id,
        title: 'API Consulting Services',
        date: daysAgo(42),
        originalAmount: 12000,
        originalCurrency: 'CZK',
        amount: 12000,
      },

      // Recurring Housing & Living
      {
        userId: adminUser.id,
        categoryId: catRent.id,
        title: 'Apartment Monthly Rent',
        date: daysAgo(5),
        originalAmount: -22000,
        originalCurrency: 'CZK',
        amount: -22000,
        bankReferenceId: 'TX-RENT-M1',
      },
      {
        userId: adminUser.id,
        categoryId: catUtilities.id,
        title: 'Electricity & Natural Gas',
        date: daysAgo(10),
        originalAmount: -3400,
        originalCurrency: 'CZK',
        amount: -3400,
      },
      {
        userId: adminUser.id,
        categoryId: catWater.id,
        title: 'Municipal Water Services',
        date: daysAgo(15),
        originalAmount: -950,
        originalCurrency: 'CZK',
        amount: -950,
      },
      {
        userId: adminUser.id,
        categoryId: catRent.id,
        title: 'Apartment Monthly Rent',
        date: daysAgo(35),
        originalAmount: -22000,
        originalCurrency: 'CZK',
        amount: -22000,
        bankReferenceId: 'TX-RENT-M2',
      },
      {
        userId: adminUser.id,
        categoryId: catUtilities.id,
        title: 'Electricity & Natural Gas',
        date: daysAgo(40),
        originalAmount: -3250,
        originalCurrency: 'CZK',
        amount: -3250,
      },

      // Food & Groceries
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Lidl - Weekly Grocery Shopping',
        date: daysAgo(1),
        originalAmount: -1850,
        originalCurrency: 'CZK',
        amount: -1850,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Rohlik.cz Online Delivery',
        date: daysAgo(4),
        originalAmount: -2420,
        originalCurrency: 'CZK',
        amount: -2420,
        isAiCategorized: true,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Billa Supermarket',
        date: daysAgo(8),
        originalAmount: -980,
        originalCurrency: 'CZK',
        amount: -980,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Albert Hypermarket',
        date: daysAgo(14),
        originalAmount: -2150,
        originalCurrency: 'CZK',
        amount: -2150,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Lidl - Groceries',
        date: daysAgo(21),
        originalAmount: -1670,
        originalCurrency: 'CZK',
        amount: -1670,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Rohlik.cz Delivery',
        date: daysAgo(28),
        originalAmount: -2100,
        originalCurrency: 'CZK',
        amount: -2100,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Tesco Superstore',
        date: daysAgo(37),
        originalAmount: -2340,
        originalCurrency: 'CZK',
        amount: -2340,
      },
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        title: 'Farmers Market Fresh Produce',
        date: daysAgo(48),
        originalAmount: -820,
        originalCurrency: 'CZK',
        amount: -820,
      },

      // Cafes & Restaurants
      {
        userId: adminUser.id,
        categoryId: catCoffee.id,
        title: 'Starbucks Flat White & Croissant',
        date: daysAgo(0),
        originalAmount: -185,
        originalCurrency: 'CZK',
        amount: -185,
      },
      {
        userId: adminUser.id,
        categoryId: catRestaurants.id,
        title: 'Lunch with colleagues - Bistro 8',
        date: daysAgo(2),
        originalAmount: -360,
        originalCurrency: 'CZK',
        amount: -360,
        isAiCategorized: true,
      },
      {
        userId: adminUser.id,
        categoryId: catCoffee.id,
        title: 'Specialty Espresso Bar',
        date: daysAgo(3),
        originalAmount: -95,
        originalCurrency: 'CZK',
        amount: -95,
      },
      {
        userId: adminUser.id,
        categoryId: catRestaurants.id,
        title: 'Italian Dinner - Pasta Fresca',
        date: daysAgo(7),
        originalAmount: -1450,
        originalCurrency: 'CZK',
        amount: -1450,
      },
      {
        userId: adminUser.id,
        categoryId: catCoffee.id,
        title: 'Costa Coffee',
        date: daysAgo(11),
        originalAmount: -140,
        originalCurrency: 'CZK',
        amount: -140,
      },
      {
        userId: adminUser.id,
        categoryId: catRestaurants.id,
        title: 'Sushi Bar Sakura',
        date: daysAgo(18),
        originalAmount: -1280,
        originalCurrency: 'CZK',
        amount: -1280,
      },
      {
        userId: adminUser.id,
        categoryId: catRestaurants.id,
        title: 'Vietnamese Pho Bar',
        date: daysAgo(26),
        originalAmount: -420,
        originalCurrency: 'CZK',
        amount: -420,
      },

      // Transport & Car
      {
        userId: adminUser.id,
        categoryId: catPublicTransit.id,
        title: 'Annual Metro & Tram Pass Renewal',
        date: daysAgo(20),
        originalAmount: -3650,
        originalCurrency: 'CZK',
        amount: -3650,
      },
      {
        userId: adminUser.id,
        categoryId: catFuel.id,
        title: 'Orlen Fuel Refill',
        date: daysAgo(6),
        originalAmount: -1920,
        originalCurrency: 'CZK',
        amount: -1920,
      },
      {
        userId: adminUser.id,
        categoryId: catFuel.id,
        title: 'Shell V-Power Diesel',
        date: daysAgo(32),
        originalAmount: -2100,
        originalCurrency: 'CZK',
        amount: -2100,
      },
      {
        userId: adminUser.id,
        categoryId: catTransport.id,
        title: 'Uber rides - Weekend evening',
        date: daysAgo(9),
        originalAmount: -480,
        originalCurrency: 'CZK',
        amount: -480,
        isAiCategorized: true,
      },

      // Entertainment & Subscriptions
      {
        userId: adminUser.id,
        categoryId: catEntertainment.id,
        title: 'Netflix Premium Subscription',
        date: daysAgo(3),
        originalAmount: -379,
        originalCurrency: 'CZK',
        amount: -379,
      },
      {
        userId: adminUser.id,
        categoryId: catEntertainment.id,
        title: 'Spotify Family Subscription',
        date: daysAgo(17),
        originalAmount: -269,
        originalCurrency: 'CZK',
        amount: -269,
      },
      {
        userId: adminUser.id,
        categoryId: catGaming.id,
        title: 'Steam - Indie Game Sale',
        date: daysAgo(13),
        originalAmount: -29.99,
        originalCurrency: 'EUR',
        exchangeRate: 25.2,
        amount: -755.75,
      },
      {
        userId: adminUser.id,
        categoryId: catEntertainment.id,
        title: 'Cinema IMAX - Dune Part 2',
        date: daysAgo(22),
        originalAmount: -580,
        originalCurrency: 'CZK',
        amount: -580,
      },

      // Shopping & Apparel
      {
        userId: adminUser.id,
        categoryId: catShopping.id,
        title: 'Zara - Spring Jacket & Shirts',
        date: daysAgo(16),
        originalAmount: -3490,
        originalCurrency: 'CZK',
        amount: -3490,
      },
      {
        userId: adminUser.id,
        categoryId: catShopping.id,
        title: 'Alza.cz - Ergonomic Keyboard & Cables',
        date: daysAgo(24),
        originalAmount: -2890,
        originalCurrency: 'CZK',
        amount: -2890,
        isAiCategorized: true,
      },

      // Health & Fitness
      {
        userId: adminUser.id,
        categoryId: catGym.id,
        title: 'Form Factory Monthly Gym Pass',
        date: daysAgo(2),
        originalAmount: -1290,
        originalCurrency: 'CZK',
        amount: -1290,
      },
      {
        userId: adminUser.id,
        categoryId: catHealth.id,
        title: 'Benu Pharmacy - Vitamins & First Aid',
        date: daysAgo(19),
        originalAmount: -680,
        originalCurrency: 'CZK',
        amount: -680,
      },

      // Travel & Vacation (Foreign currency transaction)
      {
        userId: adminUser.id,
        categoryId: catTravel.id,
        title: 'Ryanair Flights to Rome',
        date: daysAgo(30),
        originalAmount: -145,
        originalCurrency: 'EUR',
        exchangeRate: 25.25,
        amount: -3661.25,
      },
      {
        userId: adminUser.id,
        categoryId: catHotel.id,
        title: 'Booking.com Boutique Hotel Rome',
        date: daysAgo(29),
        originalAmount: -320,
        originalCurrency: 'EUR',
        exchangeRate: 25.25,
        amount: -8080,
      },

      // Education & Self-Development
      {
        userId: adminUser.id,
        categoryId: catEducation.id,
        title: 'Pragmatic Programmers Technical Books',
        date: daysAgo(27),
        originalAmount: -45,
        originalCurrency: 'USD',
        exchangeRate: 23.4,
        amount: -1053,
      },

      // Miscellaneous
      {
        userId: adminUser.id,
        categoryId: catMisc.id,
        title: 'Passport Office Stamp Fee',
        date: daysAgo(44),
        originalAmount: -200,
        originalCurrency: 'CZK',
        amount: -200,
      },
    ],
  });

  // Admin Budgets
  await prisma.budget.createMany({
    data: [
      {
        userId: adminUser.id,
        categoryId: catGroceries.id,
        limit: 8500,
        order: 1,
      },
      {
        userId: adminUser.id,
        categoryId: catRestaurants.id,
        limit: 4000,
        order: 2,
      },
      {
        userId: adminUser.id,
        categoryId: catTransport.id,
        limit: 3500,
        order: 3,
      },
      {
        userId: adminUser.id,
        categoryId: catEntertainment.id,
        limit: 3000,
        order: 4,
      },
      {
        userId: adminUser.id,
        categoryId: catShopping.id,
        limit: 5000,
        order: 5,
      },
    ],
  });

  // Admin Quick-Add Templates
  await prisma.template.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'Espresso / Coffee',
        amount: 85,
        categoryId: catCoffee.id,
        showInHotbar: true,
        order: 1,
      },
      {
        userId: adminUser.id,
        title: 'Daily Lunch Menu',
        amount: 220,
        categoryId: catRestaurants.id,
        showInHotbar: true,
        order: 2,
      },
      {
        userId: adminUser.id,
        title: 'Quick Grocery Run',
        amount: 450,
        categoryId: catGroceries.id,
        showInHotbar: true,
        order: 3,
      },
      {
        userId: adminUser.id,
        title: 'Metro 30-min Ticket',
        amount: 30,
        categoryId: catPublicTransit.id,
        showInHotbar: true,
        order: 4,
      },
      {
        userId: adminUser.id,
        title: 'Fuel Refill (approx)',
        amount: 1800,
        categoryId: catFuel.id,
        showInHotbar: true,
        order: 5,
      },
      {
        userId: adminUser.id,
        title: 'Cinema Ticket',
        amount: 270,
        categoryId: catEntertainment.id,
        showInHotbar: false,
        order: 6,
      },
    ],
  });

  // Admin Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: 'INFO',
        title: 'Welcome to KeepTrack',
        message:
          'Your personal finance workspace has been initialized with demo categories and transactions.',
        read: true,
      },
      {
        userId: adminUser.id,
        type: 'INSIGHT',
        title: 'Monthly Budget Health',
        message:
          'Your spending in Food & Dining is well within your monthly target of 12,500 CZK.',
        read: false,
      },
    ],
  });

  // ==========================================
  // 3. SEED JOHN DOE (Personal EUR Profile)
  // ==========================================
  console.log('📦 Seeding user: John Doe (EUR)...');

  const johnCatSalary = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Salary',
      iconName: 'AttachMoney',
      colorClass:
        'bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100',
      type: CategoryType.INCOME,
      order: 1,
    },
  });

  const johnCatGroceries = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Groceries',
      iconName: 'ShoppingCart',
      colorClass:
        'bg-orange-100 text-orange-500 dark:bg-orange-600 dark:text-orange-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const johnCatDining = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Dining Out',
      iconName: 'LocalCafe',
      colorClass:
        'bg-amber-100 text-amber-500 dark:bg-amber-600 dark:text-amber-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const johnCatHousing = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Housing & Utilities',
      iconName: 'Home',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 4,
    },
  });

  const johnCatTransit = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Commute & Travel',
      iconName: 'DirectionsTransit',
      colorClass:
        'bg-blue-100 text-blue-500 dark:bg-blue-600 dark:text-blue-100',
      type: CategoryType.EXPENSE,
      order: 5,
    },
  });

  const johnCatFitness = await prisma.category.create({
    data: {
      userId: userJohn.id,
      label: 'Fitness & Health',
      iconName: 'FitnessCenter',
      colorClass: 'bg-red-100 text-red-500 dark:bg-red-600 dark:text-red-100',
      type: CategoryType.EXPENSE,
      order: 6,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: userJohn.id,
        categoryId: johnCatSalary.id,
        title: 'Monthly Salary',
        date: daysAgo(4),
        originalAmount: 3200,
        originalCurrency: 'EUR',
        amount: 3200,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatSalary.id,
        title: 'Monthly Salary',
        date: daysAgo(34),
        originalAmount: 3200,
        originalCurrency: 'EUR',
        amount: 3200,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatHousing.id,
        title: 'Apartment Rent',
        date: daysAgo(5),
        originalAmount: -950,
        originalCurrency: 'EUR',
        amount: -950,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatHousing.id,
        title: 'Apartment Rent',
        date: daysAgo(35),
        originalAmount: -950,
        originalCurrency: 'EUR',
        amount: -950,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatGroceries.id,
        title: 'Supermarket Groceries',
        date: daysAgo(2),
        originalAmount: -84.5,
        originalCurrency: 'EUR',
        amount: -84.5,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatGroceries.id,
        title: 'Organic Food Market',
        date: daysAgo(9),
        originalAmount: -65.2,
        originalCurrency: 'EUR',
        amount: -65.2,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatDining.id,
        title: 'Bistro Lunch',
        date: daysAgo(3),
        originalAmount: -18.5,
        originalCurrency: 'EUR',
        amount: -18.5,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatDining.id,
        title: 'Pizzeria Dinner with Friends',
        date: daysAgo(8),
        originalAmount: -42.0,
        originalCurrency: 'EUR',
        amount: -42.0,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatTransit.id,
        title: 'Monthly Metro Pass',
        date: daysAgo(12),
        originalAmount: -65,
        originalCurrency: 'EUR',
        amount: -65,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatFitness.id,
        title: 'Climbing Gym Membership',
        date: daysAgo(7),
        originalAmount: -55,
        originalCurrency: 'EUR',
        amount: -55,
      },
    ],
  });

  await prisma.budget.createMany({
    data: [
      {
        userId: userJohn.id,
        categoryId: johnCatGroceries.id,
        limit: 380,
        order: 1,
      },
      {
        userId: userJohn.id,
        categoryId: johnCatDining.id,
        limit: 180,
        order: 2,
      },
    ],
  });

  await prisma.template.createMany({
    data: [
      {
        userId: userJohn.id,
        title: 'Morning Flat White',
        amount: 4.2,
        categoryId: johnCatDining.id,
        showInHotbar: true,
        order: 1,
      },
      {
        userId: userJohn.id,
        title: 'Supermarket Quick',
        amount: 25,
        categoryId: johnCatGroceries.id,
        showInHotbar: true,
        order: 2,
      },
    ],
  });

  // ==========================================
  // 4. SEED JANE SMITH (Student Profile - CZK)
  // ==========================================
  console.log('📦 Seeding user: Jane Smith (CZK)...');

  const janeCatAllowance = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Allowance & Support',
      iconName: 'AttachMoney',
      colorClass:
        'bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100',
      type: CategoryType.INCOME,
      order: 1,
    },
  });

  const janeCatJob = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Part-Time Job',
      iconName: 'Work',
      colorClass:
        'bg-teal-100 text-teal-500 dark:bg-teal-600 dark:text-teal-100',
      type: CategoryType.INCOME,
      order: 2,
    },
  });

  const janeCatDorm = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Dormitory & Living',
      iconName: 'Home',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const janeCatFood = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Campus Food & Groceries',
      iconName: 'ShoppingCart',
      colorClass:
        'bg-orange-100 text-orange-500 dark:bg-orange-600 dark:text-orange-100',
      type: CategoryType.EXPENSE,
      order: 4,
    },
  });

  const janeCatBooks = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Study Books & Materials',
      iconName: 'MenuBook',
      colorClass:
        'bg-lime-100 text-lime-500 dark:bg-lime-600 dark:text-lime-100',
      type: CategoryType.EXPENSE,
      order: 5,
    },
  });

  const janeCatLeisure = await prisma.category.create({
    data: {
      userId: userJane.id,
      label: 'Social & Nightlife',
      iconName: 'GamepadRounded',
      colorClass:
        'bg-purple-100 text-purple-500 dark:bg-purple-600 dark:text-purple-100',
      type: CategoryType.EXPENSE,
      order: 6,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: userJane.id,
        categoryId: janeCatAllowance.id,
        title: 'Monthly Student Support',
        date: daysAgo(3),
        originalAmount: 9000,
        originalCurrency: 'CZK',
        amount: 9000,
      },
      {
        userId: userJane.id,
        categoryId: janeCatJob.id,
        title: 'Campus Library Desk Shift',
        date: daysAgo(8),
        originalAmount: 6400,
        originalCurrency: 'CZK',
        amount: 6400,
      },
      {
        userId: userJane.id,
        categoryId: janeCatDorm.id,
        title: 'University Dorm Fee',
        date: daysAgo(5),
        originalAmount: -4800,
        originalCurrency: 'CZK',
        amount: -4800,
      },
      {
        userId: userJane.id,
        categoryId: janeCatFood.id,
        title: 'Campus Canteen Lunches',
        date: daysAgo(1),
        originalAmount: -680,
        originalCurrency: 'CZK',
        amount: -680,
      },
      {
        userId: userJane.id,
        categoryId: janeCatFood.id,
        title: 'Albert Grocery Store',
        date: daysAgo(6),
        originalAmount: -750,
        originalCurrency: 'CZK',
        amount: -750,
      },
      {
        userId: userJane.id,
        categoryId: janeCatBooks.id,
        title: 'Economics Textbooks',
        date: daysAgo(14),
        originalAmount: -1250,
        originalCurrency: 'CZK',
        amount: -1250,
      },
      {
        userId: userJane.id,
        categoryId: janeCatLeisure.id,
        title: 'Student Club Evening',
        date: daysAgo(4),
        originalAmount: -460,
        originalCurrency: 'CZK',
        amount: -460,
      },
    ],
  });

  await prisma.budget.create({
    data: {
      userId: userJane.id,
      categoryId: janeCatFood.id,
      limit: 3500,
      order: 1,
    },
  });

  await prisma.template.create({
    data: {
      userId: userJane.id,
      title: 'Canteen Lunch',
      amount: 110,
      categoryId: janeCatFood.id,
      showInHotbar: true,
      order: 1,
    },
  });

  // ==========================================
  // 5. SEED ALEX TECH (Freelancer Profile - USD)
  // ==========================================
  console.log('📦 Seeding user: Alex Tech (USD)...');

  const alexCatInvoices = await prisma.category.create({
    data: {
      userId: userAlex.id,
      label: 'Client Invoices',
      iconName: 'AttachMoney',
      colorClass:
        'bg-emerald-100 text-emerald-500 dark:bg-emerald-600 dark:text-emerald-100',
      type: CategoryType.INCOME,
      order: 1,
    },
  });

  const alexCatSaaS = await prisma.category.create({
    data: {
      userId: userAlex.id,
      label: 'Cloud & Software Services',
      iconName: 'ElectricBolt',
      colorClass:
        'bg-indigo-100 text-indigo-500 dark:bg-indigo-600 dark:text-indigo-100',
      type: CategoryType.EXPENSE,
      order: 2,
    },
  });

  const alexCatHardware = await prisma.category.create({
    data: {
      userId: userAlex.id,
      label: 'Hardware & Gear',
      iconName: 'ShoppingBag',
      colorClass:
        'bg-pink-100 text-pink-500 dark:bg-pink-600 dark:text-pink-100',
      type: CategoryType.EXPENSE,
      order: 3,
    },
  });

  const alexCatOffice = await prisma.category.create({
    data: {
      userId: userAlex.id,
      label: 'Coworking & Office',
      iconName: 'Home',
      colorClass:
        'bg-yellow-100 text-yellow-500 dark:bg-yellow-600 dark:text-yellow-100',
      type: CategoryType.EXPENSE,
      order: 4,
    },
  });

  const alexCatTravel = await prisma.category.create({
    data: {
      userId: userAlex.id,
      label: 'Tech Conferences & Travel',
      iconName: 'Flight',
      colorClass:
        'bg-teal-100 text-teal-500 dark:bg-teal-600 dark:text-teal-100',
      type: CategoryType.EXPENSE,
      order: 5,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: userAlex.id,
        categoryId: alexCatInvoices.id,
        title: 'Frontend Architecture Retainer - Client A',
        date: daysAgo(5),
        originalAmount: 4800,
        originalCurrency: 'USD',
        amount: 4800,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatInvoices.id,
        title: 'Backend API Audit - Client B',
        date: daysAgo(20),
        originalAmount: 3200,
        originalCurrency: 'USD',
        amount: 3200,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatSaaS.id,
        title: 'AWS Cloud Hosting & Databases',
        date: daysAgo(2),
        originalAmount: -185,
        originalCurrency: 'USD',
        amount: -185,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatSaaS.id,
        title: 'GitHub Enterprise & Copilot',
        date: daysAgo(10),
        originalAmount: -42,
        originalCurrency: 'USD',
        amount: -42,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatOffice.id,
        title: 'WeWork Hot Desk Monthly',
        date: daysAgo(7),
        originalAmount: -320,
        originalCurrency: 'USD',
        amount: -320,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatHardware.id,
        title: '4K External Monitor & USB Hub',
        date: daysAgo(15),
        originalAmount: -450,
        originalCurrency: 'USD',
        amount: -450,
      },
      {
        userId: userAlex.id,
        categoryId: alexCatTravel.id,
        title: 'React Summit Ticket & Flight',
        date: daysAgo(25),
        originalAmount: -680,
        originalCurrency: 'USD',
        amount: -680,
      },
    ],
  });

  await prisma.budget.create({
    data: {
      userId: userAlex.id,
      categoryId: alexCatSaaS.id,
      limit: 300,
      order: 1,
    },
  });

  await prisma.template.create({
    data: {
      userId: userAlex.id,
      title: 'Dev Server / Domain Purchase',
      amount: 25,
      categoryId: alexCatSaaS.id,
      showInHotbar: true,
      order: 1,
    },
  });

  console.log('✨ Notice: Complex budget seeding was skipped as requested.');
  console.log('✅ All seed data generated successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Error while seeding database:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

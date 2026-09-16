import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { ReorderBudgetsDto } from './dto/reorder-budgets.dto';
import { SetComplexBudgetDto } from './dto/set-complex-budget.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class BudgetService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /// ----------------------------- Budget Methods ----------------------------

  /**
   * Validates that the specified category belongs to the user and is of type 'EXPENSE'.
   * 
   * @param userId - The ID of the user to whom the category should belong.
   * @param categoryId - The ID of the category to validate.
   */
  private async validateExpenseCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) throw new BadRequestException('Category not found');

    if (category.type !== 'EXPENSE') {
      throw new BadRequestException(
        'Budget can only be set for categories for expenses.',
      );
    }
  }

  /**
   * Creates a new budget for the specified user with the provided details.
   * 
   * @param userId - The ID of the user for whom the budget is being created.
   * @param dto - An object containing the details of the budget to be created, including category ID and limit.
   * @returns - The newly created budget object, including its associated category.
   */
  async create(userId: string, dto: CreateBudgetDto) {
    await this.validateExpenseCategory(userId, dto.categoryId);

    const created = await this.prisma.budget.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return created;
  }

  /**
   * Finds all budgets for the specified user.
   * 
   * @param userId - The ID of the user for whom to find budgets.
   * @returns - An array of budget objects, each including its associated category.
   */
  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Finds a single budget by its ID for the specified user.
   * 
   * @param userId - The ID of the user to whom the budget should belong.
   * @param id - The ID of the budget to find.
   * @returns - The budget object, including its associated category, if found; otherwise, throws a NotFoundException.
   */
  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  /**
   * Updates an existing budget for the specified user with the provided details.
   * 
   * @param userId - The ID of the user to whom the budget should belong.
   * @param id - The ID of the budget to update.
   * @param dto - An object containing the updated details of the budget.
   * @returns - The updated budget object, including its associated category.
   */
  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(userId, id); // Validate ownership of the budget

    if (dto.categoryId) {
      await this.validateExpenseCategory(userId, dto.categoryId);
    }

    // Update the budget
    const updated = await this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return updated;
  }

  /**
   * Removes a budget for the specified user.
   * 
   * @param userId - The ID of the user to whom the budget should belong.
   * @param id - The ID of the budget to remove.
   * @returns - The removed budget object.
   */
  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověření vlastnictví
    const res = await this.prisma.budget.delete({
      where: { id },
    });
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return res;
  }

  /**
   * Reorders the budgets for the specified user based on the provided order.
   * 
   * @param userId - The ID of the user to whom the budgets should belong.
   * @param dto - An object containing the new order of budgets, represented as an array of budget IDs and their corresponding order values.
   * @returns - An array of the updated budget objects after reordering.
   */
  async reorder(userId: string, dto: ReorderBudgetsDto) {
    const budgetIds = dto.budgets.map((b) => b.id);
    const existingBudgets = await this.prisma.budget.findMany({
      where: { id: { in: budgetIds } },
      select: { id: true, userId: true },
    });

    // Validate that all budgets belong to the user and exist
    for (const budget of existingBudgets) {
      if (budget.userId !== userId) {
        throw new ForbiddenException('Budget belongs to another user');
      }
    }

    // Ensure that all provided budget IDs exist in the database
    if (existingBudgets.length !== budgetIds.length) {
      throw new NotFoundException('One or more budgets not found');
    }

    // Update the order of each budget in a transaction to ensure atomicity
    const updates = dto.budgets.map((budget) =>
      this.prisma.budget.update({
        where: { id: budget.id },
        data: { order: budget.order },
      }),
    );
    const result = await this.prisma.$transaction(updates);
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return result;
  }

  /// ----------------------------- Complex Budget Methods ----------------------------

  /**
   * Retrieves the complex budget for the specified user, including its associated categories.
   * 
   * @param userId - The ID of the user for whom to retrieve the complex budget.
   * @returns - The complex budget object, including its associated categories, if found; otherwise, returns null.
   */
  async getComplexBudget(userId: string) {
    return this.prisma.complexBudget.findUnique({
      where: { userId },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });
  }

  /**
   * Upserts (updates or inserts) the complex budget for the specified user with the provided details.
   * 
   * @param userId - The ID of the user for whom to upsert the complex budget.
   * @param dto - An object containing the details of the complex budget to be upserted, including income, necessary expenses, and associated categories.
   * @returns - The upserted complex budget object, including its associated categories.
   */
  async setComplexBudget(userId: string, dto: SetComplexBudgetDto) {
    // Validate that all provided categories belong to the user and are of type 'EXPENSE'
    await Promise.all(
      (dto.categories ?? []).map(({ categoryId }) =>
        this.validateExpenseCategory(userId, categoryId),
      ),
    );

    // Calculate the limit for the complex budget based on income and necessary expenses
    const limit = dto.income - dto.necessaryExpenses;
    // Upsert the complex budget for the user
    const updated = await this.prisma.complexBudget.upsert({
      where: { userId },
      update: { // Update the existing complex budget with new values
        income: dto.income,
        necessaryExpenses: dto.necessaryExpenses,
        limit,
        categories: dto.categories
          ? {
              deleteMany: {},
              create: dto.categories,
            }
          : undefined,
      },
      create: { // Create a new complex budget if one does not exist for the user
        userId,
        income: dto.income,
        necessaryExpenses: dto.necessaryExpenses,
        limit,
        categories: dto.categories
          ? {
              create: dto.categories,
            }
          : undefined,
      },
      include: { // Include the associated categories in the returned complex budget object
        categories: {
          include: { category: true },
        },
      },
    });
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return updated;
  }

  /**
   * Delete the complex budget for the specified user.
   * 
   * @param userId - The ID of the user for whom to delete the complex budget.
   * @returns - The deleted complex budget object, if found and deleted; otherwise, throws a NotFoundException.
   */
  async deleteComplexBudget(userId: string) {
    const budget = await this.prisma.complexBudget.findUnique({
      where: { userId },
    });
    if (!budget) {
      throw new NotFoundException('Complex budget not found');
    }
    const res = await this.prisma.complexBudget.delete({
      where: { userId },
    });
    // Emit an event to notify the user that their budget data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'budgets',
    });
    return res;
  }
}

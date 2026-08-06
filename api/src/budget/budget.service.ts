import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  private async validateExpenseCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) throw new BadRequestException('Kategorie nenalezena');

    if (category.type !== 'EXPENSE') {
      throw new BadRequestException(
        'Budget can only be set for categories for expenses.'
      )
    }
  }

  async create(userId: string, dto: CreateBudgetDto) {
    await this.validateExpenseCategory(userId, dto.categoryId);

    const created = await this.prisma.budget.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return created;
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException('Rozpočet nenalezen');
    return budget;
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(userId, id); // Ověření vlastnictví

    if (dto.categoryId) {
      await this.validateExpenseCategory(userId, dto.categoryId);
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověření vlastnictví
    const res = await this.prisma.budget.delete({
      where: { id },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return res;
  }

  async reorder(userId: string, dto: ReorderBudgetsDto) {
    const budgetIds = dto.budgets.map((b) => b.id);
    const existingBudgets = await this.prisma.budget.findMany({
      where: { id: { in: budgetIds } },
      select: { id: true, userId: true },
    });

    for (const budget of existingBudgets) {
      if (budget.userId !== userId) {
        throw new ForbiddenException('Budget belongs to another user');
      }
    }

    if (existingBudgets.length !== budgetIds.length) {
      throw new NotFoundException('One or more budgets not found');
    }

    const updates = dto.budgets.map((budget) =>
      this.prisma.budget.update({
        where: { id: budget.id },
        data: { order: budget.order },
      }),
    );
    const result = await this.prisma.$transaction(updates);
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return result;
  }

  async getComplexBudget(userId: string) {
    return this.prisma.complexBudget.findUnique({
      where: { userId },
      // deep nesting to include categories and their details
      include: {
        categories: {
          include: {
            category: true,
          },
        }
      }
    });
  }

  async setComplexBudget(userId: string, dto: SetComplexBudgetDto) {
    const limit = dto.income - dto.necessaryExpenses;
    const updated = await this.prisma.complexBudget.upsert({
      where: { userId },
      update: {
        income: dto.income,
        necessaryExpenses: dto.necessaryExpenses,
        limit,
      },
      create: {
        userId,
        income: dto.income,
        necessaryExpenses: dto.necessaryExpenses,
        limit,
      },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return updated;
  }

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
    this.eventsGateway.emitToUser(userId, 'data_updated', { resource: 'budgets' });
    return res;
  }
}

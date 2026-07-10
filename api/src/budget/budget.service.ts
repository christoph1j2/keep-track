import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { ReorderBudgetsDto } from './dto/reorder-budgets.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    });
    if (!category) throw new BadRequestException('Kategorie nenalezena');

    if (category.type !== 'EXPENSE') {
      throw new BadRequestException(
        'Budget can only be set for categories for expenses.'
      )
    }

    return this.prisma.budget.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
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
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId },
      });
      if (!category) throw new BadRequestException('Kategorie nenalezena');

      if (category.type !== 'EXPENSE') {
        throw new BadRequestException(
          'Budget can only be set for categories for expenses.'
        )
      }
    }

    return this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověření vlastnictví
    return this.prisma.budget.delete({
      where: { id },
    });
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
    return this.prisma.$transaction(updates);
  }
}

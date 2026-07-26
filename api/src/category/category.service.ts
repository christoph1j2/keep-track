import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const created = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId, // Automaticky přiřadíme přihlášenému uživateli!
      },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return created;
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' }, // Seřadíme podle pořadí
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId }, // Kombinace ID a UserId je klíčová
    });
    if (!category) throw new NotFoundException('Kategorie nenalezena');
    return category;
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findOne(userId, id); // Ověříme, že existuje a patří jemu

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      await this.findOne(userId, updateCategoryDto.parentId); // Ověříme vlastnictví parentId

      let currentParentId: string | null = updateCategoryDto.parentId;
      const visited = new Set<string>();

      while (currentParentId) {
        if (visited.has(currentParentId)) {
          throw new BadRequestException(
            'Circular category dependency detected in ancestry',
          );
        }
        visited.add(currentParentId);

        const parent: { parentId: string | null } | null =
          await this.prisma.category.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          });

        if (!parent) break;
        if (parent.parentId === id) {
          throw new BadRequestException(
            'Circular category dependency is not allowed',
          );
        }
        currentParentId = parent.parentId;
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return updated;
  }

  async remove(userId: string, id: string): Promise<Category> {
    await this.findOne(userId, id); // Ověříme vlastnictví před smazáním

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.category.updateMany({
        where: { parentId: id, userId },
        data: { parentId: null },
      });

      return tx.category.delete({
        where: { id },
      });
    });

    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });
    return result;
  }

  async reorder(
    userId: string,
    dto: ReorderCategoriesDto,
  ): Promise<Category[]> {
    const categoryIds: readonly string[] = dto.categories.map((c) => c.id);
    const existingCategories = await this.prisma.category.findMany({
      where: { id: { in: [...categoryIds] } },
      select: { id: true, userId: true },
    });

    for (const category of existingCategories) {
      if (category.userId !== userId) {
        throw new ForbiddenException('Category belongs to another user');
      }
    }

    if (existingCategories.length !== categoryIds.length) {
      throw new NotFoundException('One or more categories not found');
    }

    const updates = dto.categories.map((category) =>
      this.prisma.category.update({
        where: { id: category.id },
        data: { order: category.order },
      }),
    );
    const result = await this.prisma.$transaction(updates);
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return result;
  }
}

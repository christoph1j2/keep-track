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

  /**
   * Creates a new category for the specified user.
   * 
   * @param userId - The ID of the user for whom the category is being created.
   * @param createCategoryDto - An object containing the details of the category to be created, including label, icon name, color class, optional parent ID, and type.
   * @returns - A promise that resolves to the newly created Category object.
   */
  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const created = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId, // Associate the category with the specified user
      },
    });
    // Emit an event to notify the user that their category data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return created;
  }

  /**
   * Fetches all categories for the specified user, ordered by their defined order.
   * 
   * @param userId - The ID of the user whose categories are being fetched.
   * @returns - A promise that resolves to an array of Category objects belonging to the user, ordered by their 'order' property in ascending order.
   */
  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' }, // Sort by the 'order' property in ascending order
    });
  }

  /**
   * Fetches a single category by its ID for the specified user, ensuring that the category belongs to the user.
   * 
   * @param userId - The ID of the user whose category is being fetched.
   * @param id - The ID of the category to fetch.
   * @returns - A promise that resolves to the Category object if found, or throws a NotFoundException if the category does not exist or does not belong to the user.
   */
  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId }, // Kombinace ID a UserId je klíčová
    });
    if (!category) throw new NotFoundException('Kategorie nenalezena');
    return category;
  }

  /**
   * Updates a category for the specified user.
   * 
   * @param userId - The ID of the user who owns the category being updated.
   * @param id - The ID of the category to update.
   * @param updateCategoryDto - An object containing the updated details of the category, including optional label, icon name, color class, optional parent ID, and type.
   * @returns - A promise that resolves to the updated Category object if the update is successful, or throws an exception if the category does not exist, does not belong to the user, or if there are validation issues (e.g., circular dependencies).
   */
  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findOne(userId, id); // Verify ownership before updating

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      await this.findOne(userId, updateCategoryDto.parentId); // Verify ownership of parentId

      let currentParentId: string | null = updateCategoryDto.parentId;
      const visited = new Set<string>();

      // Check for circular dependencies in the category hierarchy by traversing up the parent chain and ensuring that no category is its own ancestor.
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
    // Emit an event to notify the user that their category data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return updated;
  }

  /**
   * Deletes a category for the specified user, ensuring that the category belongs to the user and handling any subcategories by setting their parentId to null.
   * 
   * @param userId - The ID of the user who owns the category being deleted.
   * @param id - The ID of the category to delete.
   * @returns - A promise that resolves to the deleted Category object if the deletion is successful, or throws an exception if the category does not exist or does not belong to the user.
   */
  async remove(userId: string, id: string): Promise<Category> {
    await this.findOne(userId, id); // Verify ownership before deletion

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.category.updateMany({
        where: { parentId: id, userId },
        data: { parentId: null },
      });

      return tx.category.delete({
        where: { id },
      });
    });

    // Emit events to notify the user that their category and transaction data have been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    // Emit an event to notify the user that their transaction data has been updated, as deleting a category may affect transactions associated with that category
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });
    return result;
  }

  /**
   * Reorders categories for the specified user based on the provided order in the DTO, ensuring that all categories belong to the user and that all specified categories exist.
   * 
   * @param userId - The ID of the user whose categories are being reordered.
   * @param dto - An object containing an array of categories with their new order, where each category is represented by its ID and the desired order.
   * @returns - A promise that resolves to an array of Category objects reflecting the new order after the reordering operation is complete, or throws an exception if any category does not belong to the user or if any specified category does not exist.
   */
  async reorder(
    userId: string,
    dto: ReorderCategoriesDto,
  ): Promise<Category[]> {
    const categoryIds: readonly string[] = dto.categories.map((c) => c.id);
    const existingCategories = await this.prisma.category.findMany({
      where: { id: { in: [...categoryIds] } },
      select: { id: true, userId: true },
    });

    // Validate that all categories belong to the user and exist
    for (const category of existingCategories) {
      if (category.userId !== userId) {
        throw new ForbiddenException('Category belongs to another user');
      }
    }

    // Validate that all specified categories exist
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

    // Emit events to notify the user that their category data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'categories',
    });
    return result;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Validates and cleans the category ID.
   *
   * @param userId - The ID of the user making the request.
   * @param categoryId - The category ID to validate and clean.
   * @returns - The cleaned category ID if valid, or null for absent or null-like values.
   * @throws BadRequestException - If the category ID is malformed or not owned by the user.
   */
  private async validateAndCleanCategoryId(
    userId: string,
    categoryId?: string | null,
  ): Promise<string | null> {
    if (
      !categoryId ||
      categoryId === 'null' ||
      categoryId === 'undefined' ||
      categoryId.trim() === ''
    ) {
      return null;
    }

    // Validate UUID format
    const UUID_REGEX =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(categoryId)) {
      throw new BadRequestException('Invalid category ID format');
    }

    // Check if the category exists and belongs to the user
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException(
        'Category with the provided ID does not exist or you do not have access to it',
      );
    }

    return categoryId;
  }

  /**
   * Creates a new transaction.
   *
   * @param userId - The ID of the user creating the transaction.
   * @param dto - The data transfer object containing transaction details.
   * @returns - The created transaction, including the associated category.
   */
  async create(userId: string, dto: CreateTransactionDto) {
    const categoryId = await this.validateAndCleanCategoryId(
      userId,
      dto.categoryId,
    );
    const created = await this.prisma.transaction.create({
      data: {
        ...dto,
        categoryId,
        userId,
      },
      include: { category: true }, // Return the associated category with the created transaction
    });

    // Emit an event to notify the user about the data update
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });
    return created;
  }

  /**
   * Fetches all transactions for a specific user, ordered by date in descending order.
   *
   * @param userId - The ID of the user whose transactions are to be fetched.
   * @returns - A list of transactions for the specified user, including their associated categories.
   */
  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' }, // Default ordering by date in descending order
    });
  }

  /**
   * Fetches a specific transaction by its ID for a given user.
   *
   * @param userId - The ID of the user whose transaction is to be fetched.
   * @param id - The ID of the transaction to be fetched.
   * @returns - The transaction with the specified ID, including its associated category.
   */
  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  /**
   * Creates a batch of new transactions.
   *
   * @param userId - The ID of the user creating the transactions.
   * @param dtos - An array of data transfer objects containing transaction details.
   * @returns - The result of the batch creation, including the count of created transactions.
   */
  async createBatch(userId: string, dtos: CreateTransactionDto[]) {
    // Regular expression to validate UUID format
    const UUID_REGEX =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    // Clean and validate category IDs in the provided DTOs
    const cleanedDtos = dtos.map((dto) => {
      let categoryId = dto.categoryId;
      if (
        !categoryId ||
        categoryId === 'null' ||
        categoryId === 'undefined' ||
        categoryId.trim() === ''
      ) {
        categoryId = undefined;
      }
      return {
        ...dto,
        categoryId: categoryId || null,
      };
    });

    // Extract unique category IDs from the cleaned DTOs
    const categoryIds = cleanedDtos
      .map((d) => d.categoryId)
      .filter((id): id is string => !!id);

    // Remove duplicates by converting to a Set and back to an array
    const uniqueCategoryIds = Array.from(new Set(categoryIds));

    // Validate the format of each unique category ID
    for (const id of uniqueCategoryIds) {
      if (!UUID_REGEX.test(id)) {
        throw new BadRequestException(`Invalid category ID format: ${id}`);
      }
    }

    // If there are unique category IDs, check if they exist and belong to the user
    if (uniqueCategoryIds.length > 0) {
      const existingCategories = await this.prisma.category.findMany({
        where: {
          id: { in: uniqueCategoryIds },
          userId,
        },
        select: { id: true },
      });

      // Create a Set of existing category IDs for quick lookup
      const existingCategoryIds = new Set(existingCategories.map((c) => c.id));

      // Check if any of the unique category IDs do not exist or do not belong to the user
      for (const id of uniqueCategoryIds) {
        if (!existingCategoryIds.has(id)) {
          throw new BadRequestException(
            `Category with ID "${id}" does not exist or you do not have access to it.`,
          );
        }
      }
    }

    // Prepare the data for batch creation, associating each transaction with the user ID
    const data = cleanedDtos.map((dto) => ({
      ...dto,
      userId,
    }));

    // Perform the batch creation of transactions, skipping duplicates
    const res = await this.prisma.transaction.createMany({
      data,
      skipDuplicates: true,
    });

    // Emit an event to notify the user about the data update
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });
    return { count: res.count };
  }

  /**
   * Updates an existing transaction for a specific user.
   *
   * @param userId - The ID of the user updating the transaction.
   * @param id - The ID of the transaction to be updated.
   * @param dto - The data transfer object containing updated transaction details.
   * @returns - The updated transaction, including the associated category.
   */
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    // Validate and clean the category ID if provided in the DTO
    let categoryId: string | null | undefined = undefined;
    if (dto.categoryId !== undefined) {
      categoryId = await this.validateAndCleanCategoryId(
        userId,
        dto.categoryId,
      );
    }

    // Update the transaction, ensuring it belongs to the user and handling category ID appropriately
    const res = await this.prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        ...(dto.categoryId !== undefined ? { categoryId } : {}),
      },
    });

    // If no rows were updated, throw a NotFoundException indicating the transaction was not found or the user does not have access
    if (res.count === 0) {
      throw new NotFoundException(
        'Transaction not found or you do not have access to it',
      );
    }

    // Emit an event to notify the user about the data update
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });

    return this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  /**
   * Deletes a transaction for a specific user.
   *
   * @param userId - The ID of the user deleting the transaction.
   * @param id - The ID of the transaction to be deleted.
   * @returns - An object indicating the success of the deletion operation.
   */
  async remove(userId: string, id: string) {
    const res = await this.prisma.transaction.deleteMany({
      where: { id, userId },
    });

    if (res.count === 0) {
      throw new NotFoundException(
        'Transaction not found or you do not have access to it',
      );
    }

    // Emit an event to notify the user about the data update
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'transactions',
    });

    return { success: true };
  }
}

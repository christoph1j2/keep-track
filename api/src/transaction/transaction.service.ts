import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  private async validateAndCleanCategoryId(userId: string, categoryId?: string | null): Promise<string | null> {
    if (!categoryId || categoryId === 'null' || categoryId === 'undefined' || categoryId.trim() === '') {
      return null;
    }

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(categoryId)) {
      throw new BadRequestException('Neplatný formát ID kategorie');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('Kategorie nenalezena nebo k ní nemáte přístup');
    }

    return categoryId;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const categoryId = await this.validateAndCleanCategoryId(userId, dto.categoryId);
    return this.prisma.transaction.create({
      data: {
        ...dto,
        categoryId,
        userId,
      },
      include: { category: true }, // Rovnou vrátíme i spojenou kategorii pro frontend
    });
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' }, // Výchozí řazení od nejnovějších
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!transaction) throw new NotFoundException('Transakce nenalezena');
    return transaction;
  }

  // async findManyByIds(userId: string, ids: string[]) {
  //   const transactions = await this.prisma.transaction.findMany({
  //     where: { id: { in: ids }, userId },
  //     include: { category: true },
  //   });
  //   return transactions;
  // }

  async createBatch(userId: string, dtos: CreateTransactionDto[]) {
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    // Očistíme categoryId pro všechny DTO a posbíráme ty, které chceme validovat
    const cleanedDtos = dtos.map(dto => {
      let categoryId = dto.categoryId;
      if (!categoryId || categoryId === 'null' || categoryId === 'undefined' || categoryId.trim() === '') {
        categoryId = undefined;
      }
      return {
        ...dto,
        categoryId: categoryId || null,
      };
    });

    const categoryIds = cleanedDtos
      .map((d) => d.categoryId)
      .filter((id): id is string => !!id);

    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    
    // Zkontrolujeme formát UUID
    for (const id of uniqueCategoryIds) {
      if (!UUID_REGEX.test(id)) {
        throw new BadRequestException(`Neplatný formát ID kategorie: ${id}`);
      }
    }

    // Pokud máme nějaké kategorie k ověření, ověříme je jedním DB dotazem
    if (uniqueCategoryIds.length > 0) {
      const existingCategories = await this.prisma.category.findMany({
        where: {
          id: { in: uniqueCategoryIds },
          userId,
        },
        select: { id: true },
      });

      const existingCategoryIds = new Set(existingCategories.map((c) => c.id));

      for (const id of uniqueCategoryIds) {
        if (!existingCategoryIds.has(id)) {
          throw new BadRequestException(
            `Kategorie s ID "${id}" neexistuje nebo k ní nemáte přístup.`
          );
        }
      }
    }

    const data = cleanedDtos.map((dto) => ({
      ...dto,
      userId,
    }));

    const res = await this.prisma.transaction.createMany({
      data,
      skipDuplicates: true, // Přeskočí duplicitní záznamy
    });

    return { count: res.count }; // Vrátíme počet vytvořených záznamů
  }
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    let categoryId: string | null | undefined = undefined;
    if (dto.categoryId !== undefined) {
      categoryId = await this.validateAndCleanCategoryId(userId, dto.categoryId);
    }

    const res = await this.prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        ...(dto.categoryId !== undefined ? { categoryId } : {}),
      },
    });
    
    if (res.count === 0) {
      throw new NotFoundException('Transakce nenalezena nebo k ní nemáte přístup');
    }

    return this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    const res = await this.prisma.transaction.deleteMany({
      where: { id, userId },
    });

    if (res.count === 0) {
      throw new NotFoundException('Transakce nenalezena nebo k ní nemáte přístup');
    }

    return { success: true };
  }
}

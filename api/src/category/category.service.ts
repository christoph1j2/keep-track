import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId, // Automaticky přiřadíme přihlášenému uživateli!
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' }, // Seřadíme podle pořadí
    });
  }

  async findOne(userId: string, id: string) {
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
  ) {
    await this.findOne(userId, id); // Ověříme, že existuje a patří jemu
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověříme vlastnictví před smazáním
    return this.prisma.category.delete({
      where: { id },
    });
  }
}

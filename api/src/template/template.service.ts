import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ReorderTemplatesDto } from './dto/reorder-templates.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.template.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!template) throw new NotFoundException('Šablona nenalezena');
    return template;
  }

  async update(userId: string, id: string, dto: UpdateTemplateDto) {
    await this.findOne(userId, id); // Ověření vlastnictví
    return this.prisma.template.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověření vlastnictví
    return this.prisma.template.delete({
      where: { id },
    });
  }

  async reorder(userId: string, dto: ReorderTemplatesDto) {
    const templateIds = dto.templates.map((t) => t.id);
    const existingTemplates = await this.prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, userId: true },
    });

    for (const template of existingTemplates) {
      if (template.userId !== userId) {
        throw new ForbiddenException('Template belongs to another user');
      }
    }

    if (existingTemplates.length !== templateIds.length) {
      throw new NotFoundException('One or more templates not found');
    }

    const updates = dto.templates.map((template) =>
      this.prisma.template.update({
        where: { id: template.id },
        data: { order: template.order },
      }),
    );
    return this.prisma.$transaction(updates);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
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
}

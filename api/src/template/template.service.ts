import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ReorderTemplatesDto } from './dto/reorder-templates.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TemplateService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, dto: CreateTemplateDto) {
    const created = await this.prisma.template.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return created;
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
    const updated = await this.prisma.template.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Ověření vlastnictví
    const res = await this.prisma.template.delete({
      where: { id },
    });
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return res;
  }

  async reorder(userId: string, dto: ReorderTemplatesDto) {
    const templateIds = Array.from(new Set(dto.templates.map((t) => t.id)));
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
    const result = await this.prisma.$transaction(updates);
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return result;
  }
}

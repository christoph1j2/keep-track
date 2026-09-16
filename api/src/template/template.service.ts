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

  /**
   * Creates a new template for the specified user with the provided details.
   * 
   * @param userId - The ID of the user for whom the template is being created.
   * @param dto - An object containing the details of the template to be created, including title, amount, category ID, and optional showInHotbar flag.
   * @returns - The newly created template object, including its associated category.
   */
  async create(userId: string, dto: CreateTemplateDto) {
    const created = await this.prisma.template.create({
      data: {
        ...dto,
        userId,
      },
      include: { category: true },
    });
    // Emit an event to notify the user that their template data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return created;
  }

  /**
   * Fetches all templates for the specified user, ordered by their defined order.
   * 
   * @param userId - The ID of the user whose templates are being fetched.
   * @returns - A promise that resolves to an array of Template objects belonging to the user, ordered by their 'order' property in ascending order.
   */
  async findAll(userId: string) {
    return this.prisma.template.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Fetches a single template by its ID for the specified user, ensuring that the template belongs to the user.
   * 
   * @param userId - The ID of the user for whom the template is being fetched.
   * @param id - The ID of the template to fetch.
   * @returns - A promise that resolves to the Template object if found, or throws a NotFoundException if the template does not exist or does not belong to the user.
   */
  async findOne(userId: string, id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!template) throw new NotFoundException('Šablona nenalezena');
    return template;
  }

  /**
   * Updates an existing template for the specified user with the provided details. Ensures that the template belongs to the user before updating.
   * 
   * @param userId - The ID of the user for whom the template is being updated.
   * @param id - The ID of the template to update.
   * @param dto - An object containing the updated details of the template, which may include title, amount, category ID, and showInHotbar flag.
   * @returns - A promise that resolves to the updated template object, including its associated category. If the template does not exist or does not belong to the user, a NotFoundException is thrown.
   */
  async update(userId: string, id: string, dto: UpdateTemplateDto) {
    await this.findOne(userId, id); // Ověření vlastnictví
    const updated = await this.prisma.template.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    // Emit an event to notify the user that their template data has been updated
    this.eventsGateway.emitToUser(userId, 'data_updated', {
      resource: 'templates',
    });
    return updated;
  }

  /**
   * Removes a template for the specified user by its ID. Ensures that the template belongs to the user before deletion.
   * 
   * @param userId - The ID of the user for whom the template is being removed.
   * @param id - The ID of the template to remove.
   * @returns - A promise that resolves to the removed template object. If the template does not exist or does not belong to the user, a NotFoundException is thrown.
   */
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

  /**
   * Reorders templates for the specified user based on the provided order. Validates that all templates belong to the user and that all specified templates exist before applying the new order.
   * 
   * @param userId - The ID of the user for whom the templates are being reordered. 
   * @param dto - An object containing an array of templates with their new order. Each template in the array should have its ID and the desired order.
   * @returns - A promise that resolves to an array of Template objects reflecting the new order after the reordering operation is complete. If any template does not belong to the user or if any specified template does not exist, a ForbiddenException or NotFoundException is thrown, respectively.
   */
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

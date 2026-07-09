import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vytvoří novou notifikaci pro uživatele.
   * Tuto metodu mohou volat ostatní servisy (AI, cron, atd.).
   */
  async create(
    userId: string,
    type: string,
    title: string,
    message?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata ?? undefined,
      },
    });
  }

  /**
   * Vrátí všechny nepřečtené notifikace uživatele (nejnovější první).
   */
  async findAllUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Označí notifikaci jako přečtenou (dismiss).
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /**
   * Smaže notifikaci.
   */
  async remove(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}

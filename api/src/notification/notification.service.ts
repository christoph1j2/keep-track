import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new notification for a user with the specified type, title, message, and optional metadata. The notification is stored in the database and can be retrieved later.
   *
   * @param userId - The ID of the user for whom the notification is being created.
   * @param type - The type of the notification (e.g., 'INFO', 'WARNING', 'ERROR').
   * @param title - The title of the notification, which provides a brief summary of the notification's content.
   * @param message - An optional detailed message that provides additional information about the notification.
   * @param metadata - Optional additional data related to the notification, which can be used for further context or processing. This can be any valid JSON value.
   * @returns - A promise that resolves to the newly created notification object, which includes its ID, user ID, type, title, message, metadata, read status, and timestamps for creation and last update.
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
   * Fetches all unread notifications for a specific user, ordered by their creation date in descending order. This allows the user to see the most recent notifications first.
   *
   * @param userId - The ID of the user for whom to fetch unread notifications.
   * @returns - A promise that resolves to an array of unread notification objects for the specified user, each containing its ID, user ID, type, title, message, metadata, read status, and timestamps for creation and last update.
   */
  async findAllUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marks a notification as read.
   *
   * @param userId - The ID of the user who owns the notification.
   * @param notificationId - The ID of the notification to mark as read.
   * @returns - A promise that resolves to the batch result of the update operation, containing a count field indicating how many notifications were updated.
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /**
   * Removes a notification for a user.
   *
   * @param userId - The ID of the user who owns the notification.
   * @param notificationId - The ID of the notification to remove.
   * @returns - A promise that resolves to the result of the delete operation, indicating how many notifications were deleted (should be 1 if successful).
   */
  async remove(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }
}

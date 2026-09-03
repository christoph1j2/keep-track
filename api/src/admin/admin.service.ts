import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches comprehensive system statistics for the admin dashboard.
   */
  async getStats(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userCount,
      transactionCount,
      categoryCount,
      templateCount,
      budgetCount,
      complexBudgetCount,
      aiCategorizedCount,
      newUsersLast30Days,
      transactionsLast30Days,
      processingJobs,
      readyJobs,
      failedJobs,
      completedJobs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.category.count(),
      this.prisma.template.count(),
      this.prisma.budget.count(),
      this.prisma.complexBudget.count(),
      this.prisma.transaction.count({ where: { isAiCategorized: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.transaction.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.importJob.count({ where: { status: 'PROCESSING' } }),
      this.prisma.importJob.count({ where: { status: 'READY_FOR_REVIEW' } }),
      this.prisma.importJob.count({ where: { status: 'FAILED' } }),
      this.prisma.importJob.count({ where: { status: 'COMPLETED' } }),
    ]);

    const aiCategorizationRate =
      transactionCount > 0
        ? Math.round((aiCategorizedCount / transactionCount) * 100)
        : 0;

    return {
      userCount,
      transactionCount,
      categoryCount,
      templateCount,
      budgetCount,
      complexBudgetCount,
      aiCategorizedCount,
      aiCategorizationRate,
      newUsersLast30Days,
      transactionsLast30Days,
      importJobStats: {
        PROCESSING: processingJobs,
        READY_FOR_REVIEW: readyJobs,
        FAILED: failedJobs,
        COMPLETED: completedJobs,
        total: processingJobs + readyJobs + failedJobs + completedJobs,
      },
    };
  }

  /**
   * Fetches all registered users with basic profile details.
   */
  async getUsers(): Promise<any> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Inspects detailed statistics for a specific user.
   */
  async getUserDetails(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        baseCurrency: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const [
      transactionCount,
      aiCategorizedCount,
      budgetCount,
      categoryCount,
      templateCount,
      importJobCount,
    ] = await Promise.all([
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.transaction.count({
        where: { userId, isAiCategorized: true },
      }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.category.count({ where: { userId } }),
      this.prisma.template.count({ where: { userId } }),
      this.prisma.importJob.count({ where: { userId } }),
    ]);

    const aiRate =
      transactionCount > 0
        ? Math.round((aiCategorizedCount / transactionCount) * 100)
        : 0;

    return {
      ...user,
      stats: {
        transactionCount,
        aiCategorizedCount,
        aiRate,
        budgetCount,
        categoryCount,
        templateCount,
        importJobCount,
      },
    };
  }

  /**
   * Updates the role of a user.
   */
  async updateUserRole(userId: string, newRole: Role): Promise<any> {
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (userToUpdate?.role === 'ADMIN' && newRole !== ('ADMIN' as Role)) {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last remaining admin account.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        email: true,
        username: true,
        role: true,
      },
    });
  }

  /**
   * Deletes a user from the DB.
   */
  async deleteUser(userId: string): Promise<any> {
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (userToDelete?.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last remaining admin account.',
        );
      }
    }

    return this.prisma.user.delete({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        baseCurrency: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });
  }

  /**
   * Broadcasts a notification to all active users or selected target users.
   */
  async broadcastNotification(
    title: string,
    message?: string,
    type: string = 'INFO',
    targetUserIds?: string[],
  ): Promise<{ count: number }> {
    let usersToNotify: string[] = [];

    if (targetUserIds && targetUserIds.length > 0) {
      usersToNotify = targetUserIds;
    } else {
      const allUsers = await this.prisma.user.findMany({
        select: { id: true },
      });
      usersToNotify = allUsers.map((u) => u.id);
    }

    if (usersToNotify.length === 0) {
      return { count: 0 };
    }

    const notificationsData = usersToNotify.map((userId) => ({
      userId,
      type,
      title,
      message: message || null,
    }));

    const result = await this.prisma.notification.createMany({
      data: notificationsData,
    });

    return { count: result.count };
  }

  /**
   * Cleans up stale import jobs older than 30 days.
   */
  async cleanupOldImportJobs(): Promise<{ count: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.importJob.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: { in: ['COMPLETED', 'FAILED', 'PROCESSING'] },
      },
    });

    return { count: result.count };
  }
}

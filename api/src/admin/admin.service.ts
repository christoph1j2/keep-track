import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    /**
     * This method fetches statistics for the admin dashboard, such as:
     * - Total number of users
     * - Total number of transactions
     * - Total number of categories
     * - Total number of templates
     * - Total number of budgets
     * 
     * @returns An object containing the counts of users, transactions, categories, templates, and budgets.
     */
    async getStats(): Promise<any> {
        // Implementation for fetching admin statistics (e.g., user count, transaction count, etc.)
        const userCount = await this.prisma.user.count();
        const transactionCount = await this.prisma.transaction.count();
        const categoryCount = await this.prisma.category.count();
        const templateCount = await this.prisma.template.count();
        const budgetCount = await this.prisma.budget.count();

        return {
            userCount,
            transactionCount,
            categoryCount,
            templateCount,
            budgetCount,
        };
    }

    /**
     * This method fetches all users from the DB.
     * 
     * @returns An array of user objects containing email, username, baseCurrency, createdAt, updatedAt, and role.
     */
    async getUsers(): Promise<any[]> {
        // Implementation for fetching all users
        return this.prisma.user.findMany({
            select: {
                id: true,
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
     * This method updates the role of a user.
     * 
     * @param userId - The ID of the user whose role is to be updated. 
     * @param newRole - The new role to be assigned to the user. (e.g., Role.ADMIN, Role.USER)
     * @returns - The updated user object containing email, username, and role.
     */
    async updateUserRole(userId: string, newRole: Role): Promise<any> {
        // Implementation for updating user role
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
     * This method deletes a user from the DB.
     * 
     * @param userId - The ID of the user to be deleted.
     * @returns - The deleted user object containing email, username, baseCurrency, createdAt, updatedAt, and role.
     */
    async deleteUser(userId: string): Promise<any> {
        // Implementation for deleting a user
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
}
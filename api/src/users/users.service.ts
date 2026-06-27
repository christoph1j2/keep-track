import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {} // DI

  /**
   * This method creates a new user in the database. It first checks if a user with the provided email already exists. If so, it throws a ConflictException. If not, it hashes the user's password and saves the new user to the database. The method returns the newly created user without sensitive information like password hash.
   * @param createUserDto Data for creating a new user
   * @returns Registered user
   */
  async create(createUserDto: CreateUserDto) {
    // Kontrola, zda uživatel s tímto emailem již existuje
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Vygenerování soli a zahashování hesla
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(createUserDto.password, salt);

    // Zápis do DB
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash: hash,
        baseCurrency: createUserDto.baseCurrency || 'CZK', // Defaultní měna, pokud není zadána
      },
    });

    // await this.seedDefaultCategories(user.id);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      baseCurrency: user.baseCurrency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // private async seedDefaultCategories(userId: string) {
  //   const food = await this.prisma.category.create({
  //     data: {
  //       userId,
  //       label: 'default_categories.food',
  //       iconName: 'LocalCafe',
  //       colorClass:
  //         'bg-orange-100 text-orange-600 dark:bg-orange-600 dark:text-orange-100',
  //     },
  //   });
  //   const transport = await this.prisma.category.create({
  //     data: {
  //       userId,
  //       label: 'default_categories.transport',
  //       iconName: 'DirectionsTransit',
  //       colorClass:
  //         'bg-blue-100 text-blue-600 dark:bg-blue-600 dark:text-blue-100',
  //     },
  //   });
  //   const housing = await this.prisma.category.create({
  //     data: {
  //       userId,
  //       label: 'default_categories.housing',
  //       iconName: 'Home',
  //       colorClass:
  //         'bg-yellow-100 text-yellow-600 dark:bg-yellow-600 dark:text-yellow-100',
  //     },
  //   });

  //   await this.prisma.category.createMany({
  //     data: [
  //       {
  //         userId,
  //         label: 'default_categories.salary',
  //         iconName: 'AttachMoney',
  //         colorClass:
  //           'bg-green-100 text-green-600 dark:bg-green-600 dark:text-green-100',
  //       },
  //       {
  //         userId,
  //         label: 'default_categories.entertainment',
  //         iconName: 'Movie',
  //         colorClass:
  //           'bg-purple-100 text-purple-600 dark:bg-purple-600 dark:text-purple-100',
  //       },
  //       {
  //         userId,
  //         label: 'default_categories.health',
  //         iconName: 'LocalHospital',
  //         colorClass:
  //           'bg-red-100 text-red-600 dark:bg-red-600 dark:text-red-100',
  //       },
  //       {
  //         userId,
  //         label: 'default_categories.uncategorized',
  //         iconName: 'QuestionMark',
  //         colorClass:
  //           'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
  //       },
  //     ],
  //   });

  //   await this.prisma.category.createMany({
  //     data: [
  //       {
  //         userId,
  //         parentId: food.id,
  //         label: 'default_categories.coffee_shops',
  //         iconName: 'LocalCafe',
  //         colorClass:
  //           'bg-orange-100 text-orange-600 dark:bg-orange-600 dark:text-orange-100',
  //       },
  //       {
  //         userId,
  //         parentId: food.id,
  //         label: 'default_categories.groceries',
  //         iconName: 'ShoppingCart',
  //         colorClass:
  //           'bg-orange-100 text-orange-600 dark:bg-orange-600 dark:text-orange-100',
  //       },
  //       {
  //         userId,
  //         parentId: housing.id,
  //         label: 'default_categories.energy',
  //         iconName: 'ElectricBolt',
  //         colorClass:
  //           'bg-yellow-100 text-yellow-600 dark:bg-yellow-600 dark:text-yellow-100',
  //       },
  //       {
  //         userId,
  //         parentId: housing.id,
  //         label: 'default_categories.rent',
  //         iconName: 'Home',
  //         colorClass:
  //           'bg-yellow-100 text-yellow-600 dark:bg-yellow-600 dark:text-yellow-100',
  //       },
  //       {
  //         userId,
  //         parentId: transport.id,
  //         label: 'default_categories.fuel',
  //         iconName: 'LocalGasStation',
  //         colorClass:
  //           'bg-blue-100 text-blue-600 dark:bg-blue-600 dark:text-blue-100',
  //       },
  //     ],
  //   });
  // }

  /**
   * This method retrieves a user from the database by their email. It returns the user object for Auth purposes.
   * @param email Email of the user
   * @returns User
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        baseCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * This method retrieves a user from the database by their ID. It returns the user object containing selected fields such as id, email, username, baseCurrency, createdAt, and updatedAt.
   * @param id ID of the user.
   * @returns a user
   */
  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        baseCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * This method updates a user in the database by their ID. It returns the updated user object containing selected fields such as id, email, username, baseCurrency, createdAt, and updatedAt.
   * @param id ID of the user.
   * @param updateUserDto Data for updating the user.
   * @returns Updated user
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        baseCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * This method removes a user from the database by their ID. It returns the removed user object containing selected fields such as id, email, username, baseCurrency, createdAt, and updatedAt.
   * @param id ID of the user
   * @returns Removed user
   */
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });
    return { message: 'User account deleted successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return;

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPW = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHashedPW, hashedRefreshToken: null },
    });

    return { message: 'Password changed successfully' };
  }
}

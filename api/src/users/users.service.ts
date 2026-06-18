import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
    return await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash: hash,
        baseCurrency: createUserDto.baseCurrency || 'CZK', // Defaultní měna, pokud není zadána
      },
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
   * This method retrieves all users from the database. It returns an array of user objects, each containing selected fields such as id, email, username, baseCurrency, createdAt, and updatedAt.
   * @returns All Users
   */
  async findAll() {
    return this.prisma.user.findMany({
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
  async remove(id: string) {
    return this.prisma.user.delete({
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
}

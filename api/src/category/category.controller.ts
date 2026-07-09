import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoriesService: CategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Vytvořit novou kategorii' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.create(req.user.id, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získat všechny kategorie uživatele' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.categoriesService.findAll(req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Přeuspořádat kategorie' })
  async reorder(
    @Body() reorderCategoriesDto: ReorderCategoriesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.reorder(req.user.id, reorderCategoriesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získat konkrétní kategorii' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.categoriesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Upravit kategorii' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.update(req.user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazat kategorii' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.categoriesService.remove(req.user.id, id);
  }
}

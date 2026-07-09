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
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { ReorderBudgetsDto } from './dto/reorder-budgets.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Vytvořit nový rozpočet' })
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.create(req.user.id, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získat všechny rozpočty uživatele' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.budgetService.findAll(req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Přeuspořádat rozpočty' })
  async reorder(
    @Body() reorderBudgetsDto: ReorderBudgetsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.reorder(req.user.id, reorderBudgetsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získat konkrétní rozpočet' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Upravit rozpočet' })
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.update(req.user.id, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazat rozpočet' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetService.remove(req.user.id, id);
  }
}

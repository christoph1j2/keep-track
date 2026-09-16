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
import { SetComplexBudgetDto } from './dto/set-complex-budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

/**
 * Represents a request that has been authenticated and contains user information.
 */
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
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully.' })
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.create(req.user.id, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for user' })
  @ApiResponse({ status: 200, description: 'List of all budgets.' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.budgetService.findAll(req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder budgets' })
  @ApiResponse({ status: 200, description: 'Budgets reordered successfully.' })
  async reorder(
    @Body() reorderBudgetsDto: ReorderBudgetsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.reorder(req.user.id, reorderBudgetsDto);
  }

  @Get('complex')
  @ApiOperation({ summary: 'Get complex budget for user' })
  @ApiResponse({
    status: 200,
    description: 'Complex budget retrieved successfully.',
  })
  getComplexBudget(@Req() req: AuthenticatedRequest) {
    return this.budgetService.getComplexBudget(req.user.id);
  }

  @Post('complex')
  @ApiOperation({ summary: 'Set complex budget for user' })
  @ApiResponse({ status: 201, description: 'Complex budget set successfully.' })
  setComplexBudget(
    @Body() setComplexBudgetDto: SetComplexBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.setComplexBudget(
      req.user.id,
      setComplexBudgetDto,
    );
  }

  @Delete('complex')
  @ApiOperation({ summary: 'Delete complex budget for user' })
  @ApiResponse({
    status: 200,
    description: 'Complex budget deleted successfully.',
  })
  deleteComplexBudget(@Req() req: AuthenticatedRequest) {
    return this.budgetService.deleteComplexBudget(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget' })
  @ApiResponse({ status: 200, description: 'Budget retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Budget not found.' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully.' })
  @ApiResponse({ status: 404, description: 'Budget not found.' })
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.budgetService.update(req.user.id, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Budget not found.' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.budgetService.remove(req.user.id, id);
  }
}

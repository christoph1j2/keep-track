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
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ReorderTemplatesDto } from './dto/reorder-templates.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created successfully.' })
  create(
    @Body() createTemplateDto: CreateTemplateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.templateService.create(req.user.id, createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates for user' })
  @ApiResponse({ status: 200, description: 'List of all templates.' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.templateService.findAll(req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates reordered successfully.',
  })
  async reorder(
    @Body() reorderTemplatesDto: ReorderTemplatesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.templateService.reorder(req.user.id, reorderTemplatesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific template' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templateService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.templateService.update(req.user.id, id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templateService.remove(req.user.id, id);
  }
}

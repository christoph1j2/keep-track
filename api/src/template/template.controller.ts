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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(
    private readonly templateService: TemplateService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Vytvořit novou šablonu' })
  create(
    @Body() createTemplateDto: CreateTemplateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.templateService.create(req.user.id, createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získat všechny šablony uživatele' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.templateService.findAll(req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Přeuspořádat šablony' })
  async reorder(@Body() reorderedTemplates: { id: string; order: number }[]) {
    const updates = reorderedTemplates.map((template) =>
      this.prisma.template.update({
        where: { id: template.id },
        data: { order: template.order },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získat konkrétní šablonu' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templateService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Upravit šablonu' })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.templateService.update(req.user.id, id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Smazat šablonu' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templateService.remove(req.user.id, id);
  }
}

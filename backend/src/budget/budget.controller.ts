import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('budget')
@UseGuards(AuthGuard('jwt'))
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) { }

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateBudgetDto) {
    return await this.budgetService.create(userId, dto);
  }

  @Get()
  async findAll(@UserId() userId: number) {
    return await this.budgetService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.budgetService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ) {
    return await this.budgetService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.budgetService.remove(id, userId);
  }
}

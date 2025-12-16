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
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('account')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateAccountDto) {
    return this.accountService.create(userId, dto);
  }

  @Get()
  async findAll(@UserId() userId: number) {
    return this.accountService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountService.remove(id, userId);
  }
}

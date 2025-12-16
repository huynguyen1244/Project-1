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
  Put,
} from '@nestjs/common';
import { SettingService } from './setting.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('setting')
@UseGuards(AuthGuard('jwt'))
export class SettingController {
  constructor(private readonly settingService: SettingService) { }

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateSettingDto) {
    return await this.settingService.create(userId, dto);
  }

  @Get()
  async findAll(@UserId() userId: number) {
    return await this.settingService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.settingService.findOne(id, userId);
  }

  @Get('key/:key')
  async findByKey(@UserId() userId: number, @Param('key') key: string) {
    return await this.settingService.findByKey(userId, key);
  }

  @Put('key/:key')
  async upsert(
    @UserId() userId: number,
    @Param('key') key: string,
    @Body('value') value: string,
  ) {
    return await this.settingService.upsert(userId, key, value);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSettingDto,
  ) {
    return await this.settingService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.settingService.remove(id, userId);
  }
}

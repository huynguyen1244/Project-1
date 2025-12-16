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
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserId } from '../common/decorators/user.decorator';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post()
  async create(@UserId() userId: number, @Body() dto: CreateNotificationDto) {
    return await this.notificationService.create(userId, dto);
  }

  @Get()
  async findAll(
    @UserId() userId: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return await this.notificationService.findAll(
      userId,
      unreadOnly === 'true',
    );
  }

  @Get(':id')
  async findOne(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.notificationService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
  ) {
    return await this.notificationService.update(id, userId, dto);
  }

  @Patch(':id/read')
  async markAsRead(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.notificationService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@UserId() userId: number) {
    return await this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.notificationService.remove(id, userId);
  }
}

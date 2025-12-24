import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // Tạo notification mới
  async create(userId: number, dto: CreateNotificationDto) {
    return await this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        message: dto.message,
        read: dto.read ?? false,
        notifyAt: new Date(dto.notifyAt),
      },
    });
  }

  // Lấy tất cả notifications của user
  async findAll(userId: number, unreadOnly?: boolean) {
    return await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { notifyAt: 'desc' },
    });
  }

  // Lấy notification theo id
  async findOne(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification id ${id} không tồn tại`);
    }

    return notification;
  }

  // Cập nhật notification
  async update(id: number, userId: number, dto: UpdateNotificationDto) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification id ${id} không tồn tại`);
    }

    const updateData: any = { ...dto };
    if (dto.notifyAt) updateData.notifyAt = new Date(dto.notifyAt);

    return await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });
  }

  // Đánh dấu đã đọc
  async markAsRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification id ${id} không tồn tại`);
    }

    return await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
  }

  // Xóa notification
  async remove(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification id ${id} không tồn tại`);
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: `Notification ${id} đã bị xóa` };
  }
}

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
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Tạo user (public)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  // Lấy tất cả user (nếu cần có thể guard lại)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  // Lấy thông tin user hiện tại
  @UseGuards(AuthGuard('jwt'))
  @Get('me/info')
  async getProfile(@Req() req) {
    return await this.userService.findOne(req.user.userId);
  }

  // Lấy user theo id
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findOne(id);
  }

  // Update user
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    return await this.userService.update(id, dto, req.user.userId);
  }

  // Delete user
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.remove(id);
  }
}

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
  ParseIntPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
// import { User } from '../common/decorators/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // Tạo user (public)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // Lấy tất cả user (nếu cần có thể guard lại)
  @UseGuards(AuthGuard)
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // Lấy thông tin user hiện tại
  @UseGuards(AuthGuard)
  @Get('me/info')
  async getProfile(@Req() req) {
    return this.userService.findOne(req.user.id);
  }

  // Lấy user theo id
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // Update user
  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    return this.userService.update(id, dto, req.user.id);
  }

  // Delete user
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}

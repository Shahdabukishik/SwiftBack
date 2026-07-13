import { Controller, Get, Param, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { Query } from '@nestjs/common';
import { UsersQueryDto } from './dto/users-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    example: 'ADMIN,CASHIER',
    description: 'Comma-separated list of roles to filter by (case-insensitive)',
  })
  async findAll(
    @Query() query: UsersQueryDto,
  ) {
    return this.usersService.findAll(query);
  }


  @Version('1')
  @Get(':userId')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('userId') id: string) {
    return await this.usersService.findOne(id);
  }
}

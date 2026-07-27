import { Body, Controller, Get, Param, Patch, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { Query } from '@nestjs/common';
import { UsersQueryDto } from './dto/users-query.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { AssignStoreDto } from './dto/assign-store.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {Req} from '@nestjs/common';
import { ConfirmDobDto } from './dto/confirm-dob-dto'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Get()
  @Roles(UserRole.ADMIN)
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


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Search users by first name, last name, or phone' })
  @ApiResponse({ status: 200, description: 'Users returned successfully' })
  @ApiResponse({ status: 400, description: 'Missing or invalid query' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'query',
    required: true,
    example: 'john',
    description: 'Search text matched against first name, last name, and phone number',
  })
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
  async search(
    @Query() query: SearchUsersDto,
  ) {
    return this.usersService.search(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Get(':userId')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('userId') id: string) {
    return await this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Patch(':userId/store')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a cashier to a store' })
  @ApiResponse({ status: 200, description: 'Cashier assigned to store successfully' })
  @ApiResponse({ status: 400, description: 'User is not a cashier' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or store not found' })
  async assignStore(@Param('userId') userId: string, @Body() dto: AssignStoreDto) {
    return this.usersService.assignStore(userId, dto.storeId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/date-of-birth')
  @ApiOperation({
    summary: 'Confirm date of birth',
    description:
      'Allows the authenticated user to confirm or update their date of birth once. After confirmation, the date of birth cannot be changed.',
  })
  async confirmDob(
    @Req() req: any,
    @Body() dto: ConfirmDobDto,
  ) {
    return this.usersService.confirmDob(
      req.user.userId,
      dto.dateOfBirth,
    );
  }
}

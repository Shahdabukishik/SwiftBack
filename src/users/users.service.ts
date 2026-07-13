import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersQueryDto } from './dto/users-query.dto';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: UsersQueryDto) {

    const { page, limit, role } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = role?.length ? { role: { in: role } } : {};

    const [users, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);


    return {
      data: users,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

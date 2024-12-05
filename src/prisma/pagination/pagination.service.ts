import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PaginationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaginatedItems<T extends keyof PrismaService>(
    model: T,
    page: number = 1,
    limit: number = 10,
    options: {
      searchQuery?: string;
      searchFields?: string[];
      orderBy?: Record<string, 'asc' | 'desc'>;
      where?: Prisma.Args<T, 'findMany'>['where'];
    },
  ) {
    const { searchQuery, searchFields = [], orderBy, where } = options;
    const skip = (page - 1) * limit;
    const take = limit;

    const queryOptions = {
      skip,
      take,
      where,
      orderBy,
    };

    if (searchQuery && searchFields.length > 0) {
      const OR = [];
      searchFields.forEach((field) => {
        if (field === 'id') {
          const parsedId = parseInt(searchQuery);
          if (!isNaN(parsedId)) {
            OR.push({
              id: {
                equals: parsedId,
              },
            });
          }
        } else {
          OR.push({
            [field]: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          });
        }
      });
      queryOptions.where = {
        ...queryOptions.where,
        OR,
      };
    }
    const [items, count] = await this.prisma.$transaction([
      (this.prisma[model as keyof PrismaService] as any).findMany(queryOptions),
      (this.prisma[model as keyof PrismaService] as any).count({
        where: queryOptions.where,
      }),
    ]);
    const totalPages = Math.ceil(count / limit);
    return {
      items,
      meta: {
        page,
        limit,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

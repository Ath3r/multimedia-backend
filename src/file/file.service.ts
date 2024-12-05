import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    file,
    url,
    userId,
    tags = [],
  }: {
    file: any;
    url: string;
    userId: string;
    tags?: string[];
  }) {
    // Ensure the files directory exists
    const uploadDir = join(process.cwd(), 'file');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return this.prisma.file.create({
      data: {
        name: file.originalname,
        url, // Update URL format to match static serving path
        userId,
        tags,
      },
    });
  }

  async updateTags(id: string, tags: string[]) {
    return this.prisma.file.update({
      where: { id },
      data: {
        tags,
      },
    });
  }

  async findAll(userId: string, query: string) {
    if (query && query.length > 0) {
      return this.prisma.file.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
      });
    }
    return this.prisma.file.findMany({
      where: { userId },
    });
  }

  async delete(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (file) {
      // Update file path to match new structure
      const filePath = join(
        process.cwd(),
        'file',
        file.url.replace('/file/', ''),
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return this.prisma.file.delete({
        where: { id },
      });
    }
  }

  async findOne(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  async updateViews(id: string) {
    return this.prisma.file.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }
}

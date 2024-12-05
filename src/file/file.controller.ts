import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
  Body,
  Get,
  Delete,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  NotFoundException,
  Res,
  StreamableFile,
  Query,
  Req,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CustomMessage, Public } from 'src/common/decorators';
import { AccessTokenGuard } from 'src/common/guards';
import { GetCurrentUserId } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import * as multer from 'multer';
import { Request } from 'express';

const storage = multer?.diskStorage({
  destination: (req: any, file, callback) => {
    const userId = req.user['userId']; // Get userId from request
    const uploadPath = `./file/${userId}`;
    // Create directory if it doesn't exist
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    // Generate unique filename
    callback(null, file.originalname);
  },
});

@Controller('file')
@UseGuards(AccessTokenGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @CustomMessage('Files fetched successfully')
  @HttpCode(HttpStatus.OK)
  getFiles(@GetCurrentUserId() userId: string, @Query() query) {
    return this.fileService.findAll(userId, query.query);
  }

  @Post()
  @CustomMessage('File uploaded successfully')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
    }),
  )
  uploadFile(
    @GetCurrentUserId() userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /(image|video|application\/pdf)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('tags') tags: string = '',
  ) {
    const url = `/file/${userId}/${file.originalname}`;
    return this.fileService.create({
      file: {
        ...file,
        path: url, // Public URL path
      },
      url,
      userId,
      mimeType: file.mimetype,
      tags: tags.split(','),
    });
  }

  // update tags
  @Patch(':id/tags')
  @CustomMessage('File tags updated successfully')
  @HttpCode(HttpStatus.OK)
  updateTags(@Param('id') id: string, @Body() body: { tags: string[] }) {
    return this.fileService.updateTags(id, body.tags);
  }

  @Delete(':id')
  @CustomMessage('File deleted successfully')
  @HttpCode(HttpStatus.OK)
  deleteFile(@Param('id') id: string) {
    return this.fileService.delete(id);
  }

  @Get(':id/download')
  @CustomMessage('File downloaded successfully')
  @HttpCode(HttpStatus.OK)
  async downloadFile(
    @Param('id') id: string,
    @Req() request: Request,
    @GetCurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.fileService.findOne(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = `.${file.url}`;
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${file.name}"`,
    });
  }

  @Get(':id')
  @CustomMessage('File retrieved successfully')
  @HttpCode(HttpStatus.OK)
  async getFile(
    @Param('id') id: string,
    @Req() request: Request,
    @GetCurrentUserId() userId: string,
  ) {
    const file = await this.fileService.findOne(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Record the view when file metadata is accessed
    await this.fileService.updateViews(id);

    return file;
  }

  @Public()
  @Get(':id/view')
  @HttpCode(HttpStatus.OK)
  async serveFile(@Param('id') id: string) {
    const file = await this.fileService.findOne(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.fileService.updateViews(id);
    const filePath = `.${file.url}`;
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream, {
      type: file.mimeType || 'application/octet-stream',
      disposition: `inline; filename="${file.name}"`,
    });
  }
}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AccessTokenGuard } from 'src/common/guards';
import { CustomMessage, GetCurrentUserId } from 'src/common/decorators';

@Controller('user')
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @CustomMessage('User fetched successfully')
  @HttpCode(HttpStatus.OK)
  getMe(@GetCurrentUserId() userId: string) {
    return this.userService.findOne(userId);
  }
}

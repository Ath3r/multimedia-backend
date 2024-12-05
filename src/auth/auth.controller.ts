import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { AccessTokenGuard, RefreshTokenGuard } from 'src/common/guards';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/common/decorators';
import { CustomMessage } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @CustomMessage('Signup successful')
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() authDto: AuthDto): Promise<Tokens> {
    return this.authService.signup(authDto);
  }

  @Public()
  @CustomMessage('Login successful')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() authDto: AuthDto): Promise<Tokens> {
    return this.authService.login(authDto);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @CustomMessage('Logout successful')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @CustomMessage('New Token generated')
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshToken(userId, refreshToken);
  }
}

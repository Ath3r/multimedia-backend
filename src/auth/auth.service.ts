import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Tokens } from './types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: AuthDto): Promise<Tokens> {
    const hashedPassword = this.hashData(dto.password);
    const dbUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (dbUser) {
      throw new ConflictException('User already exists');
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    const tokens = await this.getTokens(user.id, dto.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await this.hashData(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async login(authDto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: authDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordCorrect = await bcrypt.compare(
      authDto.password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokens = await this.getTokens(user.id, authDto.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const isRefreshTokenCorrect = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenCorrect) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  hashData(data: string) {
    return bcrypt.hashSync(data, 10);
  }

  async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId,
          email,
        },
        {
          expiresIn: this.config.get('JWT.ACCESS_TOKEN_EXPIRES_IN'),
          secret: this.config.get('JWT.ACCESS_TOKEN_SECRET'),
        },
      ),
      this.jwtService.signAsync(
        {
          userId,
          email,
        },
        {
          expiresIn: this.config.get('JWT.REFRESH_TOKEN_EXPIRES_IN'),
          secret: this.config.get('JWT.REFRESH_TOKEN_SECRET'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}

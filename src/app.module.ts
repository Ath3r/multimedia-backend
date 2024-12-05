import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.test', '.env.production'],
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'file'),
      serveRoot: '/file',
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

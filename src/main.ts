import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(morgan('dev'));
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Multimedia API')
    .setDescription('Multimedia API')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
  });
  await app.listen(configService.get('PORT'));
}
bootstrap();
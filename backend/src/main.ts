import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    const url = process.env.DATABASE_URL ?? '';
    if (
      !url ||
      (!url.startsWith('postgresql://') &&
        !url.startsWith('postgres://') &&
        !url.startsWith('file:') &&
        !url.startsWith('sqlite:'))
    ) {
      throw new Error(
        'FAIL FAST: DATABASE_URL must explicitly start with postgresql://, postgres://, or file: in staging/production!'
      );
    }
  }

  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Ghanshyam Ayurvedic ERP API')
    .setDescription('Production ERP API for Ghanshyam Ayurvedic Pharmacy')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Ghanshyam Ayurvedic ERP Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();

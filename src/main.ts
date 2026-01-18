import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar parser extendido para soportar objetos anidados en query params (ej: filter[rolId]=1)
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('query parser', 'extended');
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Help Desk API')
    .setDescription('API REST del sistema Help Desk - Backend NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


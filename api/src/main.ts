import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io/adapters/io-adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase the request body size limit to 10MB for JSON and URL-encoded payloads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Keep Track API')
    .setDescription('Keep Track API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Trust the proxy to get the correct client IP address
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().set('trust proxy', 1);

  // Create the Swagger document and set up the Swagger UI
  const document = SwaggerModule.createDocument(app, config);

  // Set the global prefix for all routes to 'api'
  app.setGlobalPrefix('api');

  // Set up the Swagger UI at the '/api/docs' endpoint
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS, set up global validation pipes, and configure WebSocket adapter
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

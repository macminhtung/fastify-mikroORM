import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.enableCors({
    origin: process.env.APP_URI,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  });
  await app.register(fastifyCookie);

  // #============================#
  // # ==> APIs DOCUMENTATION <== #
  // #============================#
  const config = new DocumentBuilder().setTitle('APIs Documentation').addBearerAuth().build();
  SwaggerModule.setup('documentation', app, () => SwaggerModule.createDocument(app, config));

  // #===========================#
  // # ==> START APPLICATION <== #
  // #===========================#
  const { PROTOCOL, DOMAIN, PORT } = process.env;
  await app.listen(parseInt(`${PORT}`));
  const logger = app.get(Logger);
  logger.debug(`==> INITIALIZED [${PROTOCOL}://${DOMAIN}:${PORT}/documentation]`, 'APPLICATION');
}
bootstrap();

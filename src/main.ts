import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

import { AppModule } from './app.module';
import { ConfigurationI } from './interfaces/config.interface';
import { requestIdMiddleware } from './common/middlewares';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = fs.readFileSync(process.env.APP_PATH + '/app.config.json');
  const conf: ConfigurationI = JSON.parse(config.toString());
  app.useStaticAssets('client/dist/client/');
  app.use(requestIdMiddleware);

  // tslint:disable-next-line:no-console
  console.log('Starting service at port ', conf.port);
  await app.listen(conf.port);
}
bootstrap();

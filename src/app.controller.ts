import * as path from 'path';
import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root(@Res() response): void {
    // the homepage will load our index.html which contains angular logic
    response.sendFile(path.resolve('client/dist/client/index.html'));
  }
}

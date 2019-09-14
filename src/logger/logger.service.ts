import { Injectable, Scope, Inject, Logger } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class LoggerService {
  private logger = new Logger('', true);

  error(contextName: string, uuid: string, message: string, trace?: string) {
    this.logger.error(`[${contextName}] [req-${uuid}] ` + message, trace);
  }

  log(contextName: string, uuid: string, message: string) {
    this.logger.log(`[${contextName}] [req-${uuid}] ` + message);
  }
  warn(contextName: string, uuid: string, message: string) {
    this.logger.warn(`[${contextName}] [req-${uuid}] ` + message);
  }
  debug(contextName: string, uuid: string, message: string) {
    this.logger.debug(`[${contextName}] [req-${uuid}] ` + message);
  }
  verbose(contextName: string, uuid: string, message: string) {
    this.logger.verbose(`[${contextName}] [req-${uuid}] ` + message);
  }
}

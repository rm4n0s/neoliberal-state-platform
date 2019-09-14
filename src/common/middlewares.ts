import { Response } from 'express';
import { v4 as uuid } from 'uuid';

export function requestIdMiddleware(
  req: any,
  res: Response,
  // tslint:disable-next-line:ban-types
  next: Function,
) {
  const reqId = uuid();
  req.headers['request-id'] = reqId;
  res.setHeader('request-id', reqId);
  next();
}

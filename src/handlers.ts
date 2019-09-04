import { NextFunction, Response, Request } from 'express-serve-static-core';

export function logErrors(
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  next(err);
}

export function clientErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(500);
  res.render('error', { error: err });
}

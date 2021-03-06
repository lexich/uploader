import { NextFunction, Response, Request } from 'express-serve-static-core';
import { InvalidLoginError } from '../package/auth/data'

export function getCode(err: Error): number {
  if (err instanceof InvalidLoginError) {
    return 401;
  }
  if (err.message === 'No auth token') {
    return 401;
  }
  return 500;
}
export function getErrorMessage(err: Error): string {
  if (err instanceof InvalidLoginError) {
    return err.message;
  }
  return err.message || 'Something failed';
}

export function clientErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.xhr) {
    res.status(getCode(err)).send({ error: getErrorMessage(err) });
  } else {
    next(err);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {

  if (err instanceof InvalidLoginError) {
    if (req.xhr) {
      return res.status(getCode(err)).render('login', {
        username: req.body.username,
        error: getErrorMessage(err)
      });
    } else {
      return res.status(getCode(err)).render('auth/login', {
        username: req.body.username,
        error: getErrorMessage(err)
      });
    }
  }
  res.status(getCode(err)).render('error', { error: getErrorMessage(err) });
}

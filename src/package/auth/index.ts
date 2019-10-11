import { Router, Request, Response, NextFunction } from 'express';
import passport, { PassportStatic } from 'passport';
import { init } from './passport';
import { IUserRepository, InvalidLoginError, IUser } from './data';
import jwt from 'jsonwebtoken';

export interface IRouteOption {
  secretOrKey: string | Buffer;
  redirectSuccess?: string;
  redirectFail?: string;
  router?: Router;
}

export function login(user: IUser, opts: IRouteOption, req: Request, res: Response, next: NextFunction) {
  req.login(user, { session: false }, err => {
    if (err) {
      return next(err);
    }
    const meta: IUser = { id: user.id };
    const token = jwt.sign(meta, opts.secretOrKey);
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: true,
      signed: true,
      secure: true
    });

    if (req.xhr) {
      return res.json({ user, token });
    } else {
      return res.redirect(opts.redirectSuccess || '/');
    }
  });
}

export function route(pass: PassportStatic, opts: IRouteOption) {
  const router = opts.router || Router();
  router.post('/login', (req, res, next) => {
    const authenticate = pass.authenticate(
      'local',
      { session: false },
      (err: Error, user: IUser) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return next(new InvalidLoginError('User not found'));
        }
        return login(user, opts, req, res, next);
      }
    );
    return authenticate(req, res);
  });
  router.get('/login', (_, res) => {
    res.render('auth/login');
  });

  router.get('/logout', (req, res) => {
    req.logout();
    if (req.xhr) {
      return res.json({ success: true }).end();
    }
    res.redirect('/login');
  });
  return router;
}

export interface IOption extends IRouteOption {
  repository: IUserRepository;
}

export function requireAuth(pass: PassportStatic = passport) {
  return pass.authenticate('jwt-cookiecombo', { session: false })
}

export default function(pass: PassportStatic, opt: IOption) {
  const p = init(opt.repository, opt.secretOrKey, pass);
  return route(p, opt);
}

import { Router, Request, Response, NextFunction } from 'express';
import passport, { PassportStatic } from 'passport';
import { PassportService } from './passport';
import { IUserRepository, InvalidLoginError } from './data';
import jwt from 'jsonwebtoken';

export interface IOption<TUser extends { id: number }> {
  secretOrKey: string | Buffer;
  redirectSuccess?: string;
  redirectFail?: string;
  repository: IUserRepository<TUser>;
}

export class AuthModule<TUser extends { id: number }> {
  static requireAuth(pass: PassportStatic = passport) {
    return function(req: Request, res: Response, next: any) {
      const fn = pass.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          if (req.xhr) {
            return next(info);
          } else {
            return res.redirect('/login')
          }
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          next();
        })
      });
      return fn(req, res, next);
    }
  }

  static login<TUser extends { id: number }>(
    user: TUser,
    opts: IOption<TUser>,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    req.login(user, { session: false }, err => {
      if (err) {
        return next(err);
      }
      const meta: TUser = opts.repository.create(user.id);
      const payload = opts.repository.toPlainObject(meta);
      const token = jwt.sign(payload, opts.secretOrKey);
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

  constructor(
    private passport: PassportStatic,
    private opts: IOption<TUser>,
    private passportSrv = new PassportService<TUser>(opts.repository, passport)
  ) {}

  init(router = Router()) {
    router.post('/login', (req, res, next) => {
      const authenticate = this.passport.authenticate(
        'local',
        { session: false },
        (err: Error, user: TUser) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            return next(new InvalidLoginError('User not found'));
          }
          return AuthModule.login(user, this.opts, req, res, next);
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

    this.passportSrv.init();
    this.passportSrv.addJWTStrategy(this.opts.secretOrKey, this.opts.redirectFail);

    return router;
  }
}

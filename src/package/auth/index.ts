import { Router } from 'express';
import { PassportStatic } from 'passport';
import { init } from './passport';
import { IUserRepository } from './data';
export function route(pass: PassportStatic, router: Router = Router()) {
  const authenticate = pass.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  });
  const authenticateXhr = pass.authenticate('local');
  router.post('/login', (req, res, next) => {
    const fn = req.xhr ? authenticateXhr : authenticate;
    return fn(req, res, (err: any) => {
      if (req.xhr) {
        if (err) {
          res.status(401).json({ error: err.message })
        } else {
          res.json({ success: true }).end();
        }
      } else {
        next(err);
      }
    });
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

export default function(
  passport: PassportStatic,
  rep: IUserRepository,
  router: Router = Router()
) {
  const pass = init(rep, passport);
  return route(pass, router);
}

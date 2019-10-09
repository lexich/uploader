import { Router } from 'express';
import { PassportStatic } from 'passport';
import { init } from './passport';
import { IUserRepository, IUser } from './data';
export function route(
  router: Router = Router(),
  pass: PassportStatic
) {
  router.post(
    '/login',
    pass.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login'
    })
  );
  router.get('/login', (_, res) => {
    res.render('login');
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
  });
  return router;
};

export default function(passport: PassportStatic, rep: IUserRepository, router: Router = Router()) {
  const pass = init(rep, passport);
  return route(router, pass);
}

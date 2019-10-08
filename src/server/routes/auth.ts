import { Router } from 'express';
import { passport } from '../passport';

export default (router: Router = Router()) => {
  router.post(
    '/login',
    passport.authenticate('local', {
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

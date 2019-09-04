import express from 'express';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import session from 'express-session';
import bodyParser from 'body-parser';
import { ensureLoggedIn } from 'connect-ensure-login';

import { passport } from './passport';
import args from './args';
import storage, { getFileList, getUser } from './storage';
import * as handlers from './handlers';
const app = express();

app.set('trust proxy', 1); // trust first proxy
app.use(
  session({
    secret: args.secret,
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);



app.engine('html', (pug as any).__express as any);
app.set('views', path.resolve(__dirname, '..', 'views'));
app.set('view engine', 'pug');

app.get('/', ensureLoggedIn(), (req, res, next) => {
  getFileList(req)
    .then(files => {
      res.render('index', {
        user: getUser(req),
        files
      });
    })
    .catch(next);
});

app.get('/files', ensureLoggedIn(), (req, res, next) => {
    getFileList(req).then(
        files => {
            res.json(files);
        }
    ).catch(next);
})

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
app.get('/login', (_, res) => {
  res.render('login');
});
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});
app.use('/media', express.static(args.upload));
app.post('/file-upload', ensureLoggedIn(), storage.single('file'), (req, res) => {
  const { size, filename, mimetype } = req.file;
  const user = getUser(req);
  res.status(200).json({
    size, filename, mimetype, url: `/media/${user.username}/${filename}`
  }).end();
});

app.use(handlers.logErrors);
app.use(handlers.clientErrorHandler);
app.use(handlers.errorHandler);

app.listen(args.PORT);

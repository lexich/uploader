import express from 'express';
import * as pug from 'pug';
import * as path from 'path';
import session from 'express-session';
import bodyParser from 'body-parser';
import { passport } from './passport';
import args from './args';
import * as handlers from './handlers';
import { Storage } from './storage';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

export interface IMiddlewareMocks {
  mockSessionOpts?(opts: session.SessionOptions): session.SessionOptions
}

export function setupMiddleware(app: express.Express, opts?: IMiddlewareMocks) {
  app.set('trust proxy', 1); // trust first proxy
  const mockSessionOpts = (opts ? opts.mockSessionOpts : null) || ((opts: session.SessionOptions) => opts)
  app.use(
    session(mockSessionOpts({
      secret: args.secret,
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 60000 }
    }))
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
}

export function setupErrorHandlers(app: express.Express) {
  app.use(handlers.logErrors);
  app.use(handlers.clientErrorHandler);
  app.use(handlers.errorHandler);
}

export function initApp(app = express()) {
  const storageInterface = new Storage();
  setupMiddleware(app);
  app.use(apiRoutes(storageInterface));
  app.use(authRoutes());
  app.use('/media', express.static(args.upload));
  setupErrorHandlers(app);
  app.listen(args.PORT);
}

import express from 'express';
import * as pug from 'pug';
import * as path from 'path';
import winston from 'winston';
import expressWinston from 'express-winston';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as handlers from './handlers';
import { connect, initAdminUser } from './db';
import { TypeormStore } from 'connect-typeorm/out';
import { Connection } from 'typeorm';
import { Session } from './entity/session';
import { IAssetManifest } from '../interfaces';
import { AuthModule } from '../package/auth';
import { FilesModule } from '../package/files';
import { UserRepositoryAuth, User } from './entity/user';
import passport from 'passport';
import ARGS from './args';
import { File, FileRepositoryImpl } from './entity/file';

export interface IMiddlewareMocks {
  mockSessionOpts?(opts: session.SessionOptions): session.SessionOptions
}

export function setupMiddleware(app: express.Express, db: Connection, opts?: IMiddlewareMocks) {
  app.set('trust proxy', 1); // trust first proxy
  const mockSessionOpts = (opts ? opts.mockSessionOpts : null) || ((opts: session.SessionOptions) => opts)
  app.use(
    session(mockSessionOpts({
      secret: ARGS.secret,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 12 * 60 * 3600 },
      store: new TypeormStore({
        cleanupLimit: 2,
        limitSubquery: false, // If using MariaDB.
        ttl: 86400
      }).connect(db.getRepository(Session))
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
  app.use(cookieParser(ARGS.secret));
  app.engine('html', (pug as any).__express as any);
  app.set('views', path.resolve(__dirname, '..', '..', 'views'));
  app.set('view engine', 'pug');
}

export function setupErrorHandlers(app: express.Express) {
  app.use(handlers.clientErrorHandler);
  app.use(handlers.errorHandler);
}

export async function initApp(manifest: IAssetManifest, app = express()) {
  const db = await connect(ARGS.dbpath);
  await initAdminUser(db);
  setupMiddleware(app, db);
  app.use(expressWinston.logger({
    transports: [
      ARGS.isProduction ? new winston.transports.File({
        filename: ARGS.logfilename,
        dirname: ARGS.logdir
      }) :
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.json()
    ),
    meta: false,
    expressFormat: true,
    colorize: false
  }));

  const authModule = new AuthModule<User>(passport, {
    secretOrKey: ARGS.secret,
    repository: new UserRepositoryAuth(db)
  });
  app.use(authModule.init())
  const filesModule = new FilesModule<User, File>(
    new FileRepositoryImpl(db),
    {
      uploadDir: ARGS.upload,
      requireAuth: AuthModule.requireAuth,
      manifest: {
        files: {},
        entrypoints: []
      },
      userActor: {
        getUser(req) {
          return req.user as User;
        },
        get(user, field) {
          return user[field];
        }
      }
    }
  )
  app.use(filesModule.init());

  app.use('/media', express.static(ARGS.upload));
  app.use('/static', express.static(path.resolve(__dirname, '..', '..', 'build', 'static')));
  app.use(expressWinston.errorLogger({
    transports: [
      ARGS.isProduction ? new winston.transports.File({
        filename: ARGS.logfilename,
        dirname: ARGS.logdir
      }) :
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.prettyPrint(),

    )
  }));
  setupErrorHandlers(app);
  app.listen(ARGS.PORT);
}

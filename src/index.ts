import express from 'express';
import * as pug from 'pug';
import * as path from 'path';
import session from 'express-session';
import bodyParser from 'body-parser';
import { passport } from './passport';
import args from './args';
import * as handlers from './handlers';
const app = express();
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

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

app.use(apiRoutes());
app.use(authRoutes());
app.use('/media', express.static(args.upload));

app.use(handlers.logErrors);
app.use(handlers.clientErrorHandler);
app.use(handlers.errorHandler);

app.listen(args.PORT);

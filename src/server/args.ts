import { config } from 'dotenv';
import * as path from 'path';
config();


if (!process.env.username) {
  console.error('username wasn\t defined');
  process.exit(1);
}
if (!process.env.password) {
  console.error('password wasn\'t defined');
  process.exit(1);
}
if (!process.env.secret) {
  console.error('secret wasn\'t defined');
  process.exit(1);
}

const ARGS = {
    secret: process.env.secret!,
    dbpath: process.env.dbpath || path.join(__dirname, '..', '..', 'db', 'dev.db'),
    upload: process.env.upload || 'uploads',
    PORT: +(process.env.PORT || 3001),
    isProduction: process.env.NODE_ENV === 'production',
    logdir: process.env.logfilename || 'logs',
    logfilename: process.env.logfilename || 'service.log',
    logerrorfilename: process.env.logerrorfilename || 'error.log'
};

export function mock(fn: (args: typeof ARGS) => void) {
  const oldArgs = { ... ARGS };
  fn(ARGS);
  return () => Object.assign(ARGS, oldArgs);
}

export default ARGS;

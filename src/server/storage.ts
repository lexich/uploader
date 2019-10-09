import multer from 'multer';
import mkdirp from 'mkdirp';
import * as path from 'path';
import args from './args';
import * as fs from 'fs';
import { InvalidLoginError } from '../package/auth/data';
import { User } from './entity/user';

export function getUser(req: Express.Request): User {
  if (!req.user) {
    throw new InvalidLoginError('Not authorize access');
  }
  return req.user as User;
}

function getFileDir(username: string) {
  return path.join(args.upload, username);
}

export interface IStat {
  stat: fs.Stats;
  name: string;
}

function stat(path: string, name: string): Promise<IStat> {
  return new Promise<IStat>((resolve, reject) =>
    fs.stat(path, (err, stat) => {
      if (err) {
        return reject(err);
      }
      resolve({
        stat,
        name
      });
    })
  );
}

function readdir(dirpath: string) {
  return new Promise<IStat[]>((resolve, reject) => {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) {
        return reject(err);
      }
      Promise.all(filenames.map(fn => stat(path.join(dirpath, fn), fn))).then(
        resolve,
        reject
      );
    });
  });
}

export function isFileExist(filepath: string) {
  return new Promise<boolean>(resolve => {
    fs.stat(filepath, (err, stat) => {
      if (err) {
        return resolve(false);
      }
      resolve(stat.isFile());
    });
  });
}

async function fixFileName(filename: string, filedir: string) {
  const fullpath = path.join(filedir, filename);
  const isExist = await isFileExist(fullpath);
  if (!isExist) {
    return filename;
  }
  const extname = path.extname(filename);
  const basename = path.basename(filename, extname);
  let count = 2;
  const rx = /_(\d+)$/;
  if (rx.exec(basename)) {
    count = parseInt(RegExp.$1, 10) + 1;
  }
  return `${basename}_${count}${extname}`;
}

export default multer({
  storage: multer.diskStorage({
    destination: function(req, _, cb) {
      const { name } = getUser(req);
      const filedir = getFileDir(name);
      mkdirp(filedir, err => {
        if (err) {
          return cb(err, filedir);
        }
        cb(null, filedir);
      });
    },
    filename(req, file, cb) {
      const { name } = getUser(req);
      const filedir = getFileDir(name);
      fixFileName(file.originalname, filedir).then(
        name => cb(null, name),
        err => cb(err, '')
      );
    }
  })
});

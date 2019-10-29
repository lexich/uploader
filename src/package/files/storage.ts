import multer from 'multer';
import mkdirp from 'mkdirp';
import * as path from 'path';
import * as fs from 'fs';
import { IUserActor } from './interfaces';

export interface IStat {
  stat: fs.Stats;
  name: string;
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

export class Storage<TUser> {
  public multer: multer.Instance;
  constructor(private upload: string, private act: IUserActor<TUser>) {
    this.multer = multer({
      storage: multer.diskStorage({
        destination: (req, _, cb) => {
          const user =  act.getUser(req as any);
          const name = this.act.get(user, 'name');
          const filedir = this.getFileDir(name);
          mkdirp(filedir, err => {
            if (err) {
              return cb(err, filedir);
            }
            cb(null, filedir);
          });
        },
        filename: (req, file, cb) => {
          const user = act.getUser(req as any);
          const name = this.act.get(user, 'name');
          const filedir = this.getFileDir(name);
          fixFileName(file.originalname, filedir).then(
            name => cb(null, name),
            err => cb(err, '')
          );
        }
      })
    });
  }

  getFileDir(username: string) {
    return path.join(this.upload, username);
  }
}

import multer from 'multer';
import mkdirp from 'mkdirp';
import * as path from 'path';
import args from './args';
import * as fs from 'fs';
import { resolve } from 'bluebird';
import rimraf from 'rimraf';
import { InvalidLoginError } from './errors';

export interface User {
  username: string;
}

export function getUser(req: Express.Request): User {
  if (!req.user) {
    throw new InvalidLoginError('Not authorize access');
  }
  return req.user as User;
}

function getFileDir(username: string) {
  return path.join(args.upload, username);
}

export interface IFile {
  url: string;
  name: string;
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

function getFiles(filedir: string, username: string): Promise<IFile[]> {
  const files: IFile[] = [];
  return readdir(filedir)
    .then(filenames => {
      const dirs: string[] = [];
      filenames.forEach(file => {
        if (file.stat.isFile()) {
          files.push({
            url: path.join('/media', username, file.name),
            name: file.name
          });
        }
        if (file.stat.isDirectory()) {
          dirs.push(file.name, username);
        }
      });

      if (dirs.length) {
        return Promise.all(dirs.map(dir => getFiles(dir, username))).then(
          data => resolve(files.concat(...data))
        );
      }
      return files;
    })
    .catch(_ => []);
}

export interface IStorageInterface {
  get(username: string): Promise<IFile[]>;
  add(username: string, file: IFile): Promise<void>;
  remove(username: string, file: IFile): Promise<boolean>;
  clear(username: string): Promise<void>;
  getFileList(req: Express.Request): Promise<IFile[]>;
}

export class Storage implements IStorageInterface {
  constructor(private filesStorage: Partial<Record<string, IFile[]>> = {}) {}

  get(username: string): Promise<IFile[]> {
    try {
      const data = this.filesStorage[username];
      if (data) {
        return Promise.resolve(data);
      }
      const filedir = getFileDir(username);
      return getFiles(filedir, username).then(files => {
        this.filesStorage[username] = files;
        return files;
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  add(username: string, file: IFile): Promise<void> {
    return this.get(username).then(files => {
      this.filesStorage[username] = files.concat(file);
    });
  }

  remove(username: string, file: IFile): Promise<boolean> {
    const list = this.filesStorage[username];
    const len = list ? list.length : 0;
    return this.get(username).then(files => {
      const newList = files.filter(f => file.url !== f.url);
      this.filesStorage[username] = newList;
      return newList.length !== len;
    });
  }

  clear(username: string): Promise<void> {
    const filedir = getFileDir(username);
    return new Promise((resolve, reject) => {
      rimraf(filedir, err => {
        if (err) {
          return reject(err);
        }
        this.filesStorage[username] = undefined;
        resolve();
      });
    });
  }

  getFileList(req: Express.Request): Promise<IFile[]> {
    try {
      const { username } = getUser(req);
      return this.get(username);
    } catch (err) {
      return Promise.reject(err);
    }
  }
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
      const { username } = getUser(req);
      const filedir = getFileDir(username);
      mkdirp(filedir, err => {
        if (err) {
          return cb(err, filedir);
        }
        cb(null, filedir);
      });
    },
    filename(req, file, cb) {
      const { username } = getUser(req);
      const filedir = getFileDir(username);
      fixFileName(file.originalname, filedir).then(
        name => cb(null, name),
        err => cb(err, '')
      );
    }
  })
});

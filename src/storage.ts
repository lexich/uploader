import multer from 'multer';
import mkdirp from 'mkdirp';
import * as path from 'path';
import args from './args';
import * as fs from 'fs';
import { resolve } from 'bluebird';

export interface User {
  username: string;
}

export function getUser(req: Express.Request): User {
  if (!req.user) {
    throw new Error('Not authorize access');
  }
  return req.user as User;
}

export function getFileDir(req: Express.Request) {
  const { username } = getUser(req);
  return path.join(args.upload, username);
}

const storage = multer.diskStorage({
  destination: function(req, _, cb) {
    const filedir = getFileDir(req);
    mkdirp(filedir, err => {
      if (err) {
        return cb(err, filedir);
      }
      cb(null, filedir);
    });
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  }
});

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
        stat, name
      });
    })
  )
}

function readdir(dirpath: string) {
  return new Promise<IStat[]>((resolve, reject) => {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) {
        return reject(err);
      }
      Promise.all(filenames.map(fn =>
        stat(path.join(dirpath, fn), fn)
      )).then(resolve, reject);
    })
  })
}

function getFiles(filedir: string, username: string): Promise<IFile[]> {
  const files: IFile[] = [];
  return readdir(filedir).then(filenames => {
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
          data => resolve(files.concat(...data)),
        );
      }
      return files;
  }).catch(_ => []);
}

export function getFileList(req: Express.Request): Promise<IFile[]> {
  try {
    const filedir = getFileDir(req);
    const { username } = getUser(req);
    return getFiles(filedir, username);
  } catch (err) {
    return Promise.reject(err);
  }
}

export default multer({ storage });

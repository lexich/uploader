import { Router } from 'express';
import { ensureLoggedIn } from 'connect-ensure-login';
import storage, { IStorageInterface, getUser, IFile } from '../storage';
import { NotFound } from '../errors';
import * as fs from 'fs';
import ARGS from '../args';

export default (storageInterface: IStorageInterface, router = Router()) => {
  router.get('/', ensureLoggedIn(), (req, res, next) => {
    storageInterface.getFileList(req)
      .then(files => {
        res.render('index', {
          user: getUser(req),
          files
        });
      })
      .catch(next);
  });

  router.get('/:user/files', (req, res, next) => {
    try {
      const user = getUser(req);
      if (user.username !== req.params.user) {
        if (req.xhr) {
          res.status(401).json({ error: 'Unauthorize access' });
        } else {
          res.redirect('/');
        }
      }
    } catch (err) {
      return next(err);
    }

    storageInterface.getFileList(req)
      .then(files => {
        if (req.xhr) {
          res.json(files).end();
        } else {
          res.render('files', { files });
        }
      })
      .catch(next);
  });

  router.post('/file-upload', ensureLoggedIn(), storage.single('file'), (req, res) => {
    const { size, filename, mimetype } = req.file;
    const user = getUser(req);
    const url = `/media/${user.username}/${filename}`
    const file: IFile = {
      url, name: filename
    }
    storageInterface.add(user.username, file);
    res.status(200).json({
      size, filename, mimetype, url
    }).end();
  });

  router.delete('/file-remove', ensureLoggedIn(), (req, res, next) => {
    const user = getUser(req);
    const { file } = req.query;
    if (!file) {
      return next(new NotFound(`file can't delete`));
    }
    const fileDelete: IFile = {
      url: file,
      name: ''
    };

    storageInterface.remove(user.username, fileDelete).then(
      isRemove => new Promise<void>((resolve, reject) => {
        if (!isRemove) {
          return reject(new NotFound('file can\'t delete'));
        }
        const url = fileDelete.url.replace('/media', ARGS.upload)
        fs.unlink(url, err => {
          if (err) {
            storageInterface.add(user.username, fileDelete);
            return reject(err);
          }
          resolve()
        })
      })
    ).then(() => {
      res.status(200).json({ ok: true }).end();
    }, next);
  });

  return router;
};

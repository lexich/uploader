import { Router } from 'express';
import storage, { getUser } from '../storage';
import { File, FileRepository } from '../entity/file';
import { NotFound } from '../errors';
import { Connection } from 'typeorm';
import ARGS from '../args';
import * as fs from 'fs';
import { IAssetManifest } from '../../interfaces';
import { requireAuth } from '../../package/auth/index'

export default (db: Connection, manifest: IAssetManifest, router = Router()) => {
  const fileRepository = db.getCustomRepository(FileRepository);

  router.get('/', requireAuth(), async (req, res, next) => {
    try {
      const user = getUser(req);
      const files = await fileRepository.findAllByUser(user);
      res.render('index', { user, files, manifest });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:user/files', requireAuth(), async (req, res, next) => {
    try {
      const user = getUser(req);
      if (user.name !== req.params.user) {
        if (req.xhr) {
          return res.status(401).json({ error: 'Unauthorize access' });
        } else {
          return res.redirect('/');
        }
      }
      const files = await fileRepository.findAllByUser(user);
      if (req.xhr) {
        res.json(files).end();
      } else {
        res.render('files', { files: files.map(f => f.toJSON()) });
      }
    } catch (err) {
      return next(err);
    }
  });

  router.post('/file-upload', requireAuth(), storage.single('file'), async (req, res) => {
    const { size, filename, mimetype } = req.file;
    const user = getUser(req);
    const file = new File();
    file.name = filename;
    file.user = user;
    await db.manager.save(file);
    res.status(200).json({
      size, filename, mimetype, url: file.url(), id: file.id
    }).end();
  });

  router.delete('/file-remove', requireAuth(), async (req, res, next) => {
    const user = getUser(req);
    const { fileid } = req.query;
    if (!fileid) {
      return next(new NotFound(`file can't delete`));
    }
    try {
      const file = await fileRepository.findOneOrFail(fileid);
      file.user = user;
      const filePath = file.url(ARGS.upload);
      await fileRepository.removeByIdAndUser(fileid, user);
      await new Promise((resolve, reject) => fs.unlink(filePath, err => err ? reject(err) : resolve()))
      res.status(200).json({ ok: true }).end();
    } catch (err) {
      return next(err);
    }
  });

  return router;
};

import { Router } from 'express';
import { ensureLoggedIn } from 'connect-ensure-login';
import storage, { getUser } from '../storage';
import { File, FileRepository } from '../entity/file';
import { NotFound } from '../errors';
import { Connection } from 'typeorm';

export default (db: Connection, router = Router()) => {
  const fileRepository = db.getCustomRepository(FileRepository);

  router.get('/', ensureLoggedIn(), async (req, res, next) => {
    try {
      const user = getUser(req);
      const files = await fileRepository.findAllByUser(user);
      res.render('index', { user, files: files.map(file => ({ url: file.url(), name: file.name })) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:user/files', async (req, res, next) => {
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

  router.post('/file-upload', ensureLoggedIn(), storage.single('file'), async (req, res) => {
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

  router.delete('/file-remove', ensureLoggedIn(), async (req, res, next) => {
    const user = getUser(req);
    const { fileid } = req.query;
    if (!fileid) {
      return next(new NotFound(`file can't delete`));
    }
    const file = await fileRepository.removeByIdAndUser(fileid, user);
    if (!file) {
      return next(new NotFound(`file can't delete`));
    }
    res.status(200).json({ ok: true }).end();
    // const url = file.url().replace('/media', ARGS.upload)
  });

  return router;
};

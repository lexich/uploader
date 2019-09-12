import { Router } from 'express';
import { ensureLoggedIn } from 'connect-ensure-login';
import storage, { getFileList, getUser } from '../storage';

export default (router = Router()) => {
  router.get('/', ensureLoggedIn(), (req, res, next) => {
    getFileList(req)
      .then(files => {
        res.render('index', {
          user: getUser(req),
          files
        });
      })
      .catch(next);
  });

  router.get('/files', ensureLoggedIn(), (req, res, next) => {
    getFileList(req)
      .then(files => {
        res.json(files);
      })
      .catch(next);
  });

  router.post('/file-upload', ensureLoggedIn(), storage.single('file'), (req, res) => {
    const { size, filename, mimetype } = req.file;
    const user = getUser(req);
    res.status(200).json({
      size, filename, mimetype, url: `/media/${user.username}/${filename}`
    }).end();
  });
  return router;
};

import { Router } from 'express';
import { ensureLoggedIn } from 'connect-ensure-login';
import storage, { IStorageInterface, getUser, IFile } from '../storage';


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

  router.get('/files', (req, res, next) => {
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
  return router;
};

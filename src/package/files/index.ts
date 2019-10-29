import { Router, Request } from 'express';
import { Storage } from './storage';
import { NotFound } from './errors';

import * as fs from 'fs';
import { IAssetManifest } from '../../interfaces';

import { IFile, IFileRepository, IUserActor } from './interfaces';

export interface IOption<TUser> {
  uploadDir: string;
  requireAuth: () => any;
  manifest: IAssetManifest;
  router?: Router;
  userActor: IUserActor<TUser>;
}

export class FilesModule<TUser, TFile extends IFile<TUser>> {
  private newRep = new Storage(this.opt.uploadDir, this.opt.userActor);
  private router = this.opt.router || Router();
  constructor(
    private rep: IFileRepository<TUser, TFile>,
    private opt: IOption<TUser>
  ) {}

  init() {
    const { router, opt, rep, newRep } = this
    router.get('/', opt.requireAuth(), async (req: Request, res, next) => {
      try {
        const user: TUser = opt.userActor.getUser(req);
        const files = await rep.findAllByUser(user);
        res.render('index', { user, files, manifest: opt.manifest });
      } catch (err) {
        next(err);
      }
    });

    router.get(
      '/:user/files',
      opt.requireAuth(),
      async (req: Request, res, next) => {
        try {
          const user: TUser = opt.userActor.getUser(req);
          const userName = opt.userActor.get(user, 'name');
          if (userName !== req.params.user) {
            if (req.xhr) {
              return res.status(401).json({ error: 'Unauthorize access' });
            } else {
              return res.redirect('/');
            }
          }
          const files = await rep.findAllByUser(user);
          if (req.xhr) {
            res.json(files).end();
          } else {
            res.render('files', { files: files.map(f => rep.toJSON(f)) });
          }
        } catch (err) {
          return next(err);
        }
      }
    );

    router.post(
      '/file-upload',
      opt.requireAuth(),
      newRep.multer.single('file'),
      async (req, res) => {
        const { size, filename, mimetype } = req.file;
        const user: TUser = opt.userActor.getUser(req);
        const file = rep.createFile(filename, user);
        await rep.save(file);

        res
          .json({
            size,
            filename,
            mimetype,
            url: file.url(),
            id: file.id
          });
      }
    );

    router.post('/file-remove', opt.requireAuth(), async (req, res, next) => {
      const user: TUser = opt.userActor.getUser(req);
      const { fileid } = req.query;
      if (!fileid) {
        return next(new NotFound(`file can't delete`));
      }
      try {
        const file = await rep.findOneOrFail(fileid);
        file.user = user;
        const filePath = file.url(opt.uploadDir);
        await rep.removeByIdAndUser(fileid, user);
        await new Promise((resolve, reject) =>
          fs.unlink(filePath, err => (err ? reject(err) : resolve()))
        );
        res
          .status(200)
          .json({ ok: true })
          .end();
      } catch (err) {
        return next(err);
      }
    });

    return router;
  }
}

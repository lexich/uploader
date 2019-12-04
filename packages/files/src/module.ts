import { Router, Request, Response } from 'express';
import { Storage } from './storage';
import { NotFound } from './errors';

import * as fs from 'fs';

import { IFileRepository, IUserActor, IFileActor } from './interfaces';

export interface IOption<TUser, TFile, TManifest> {
  uploadDir: string;
  requireAuth: () => any;
  manifest: TManifest;
  router?: Router;
  userActor: IUserActor<TUser>;
  fileActor: IFileActor<TFile, TUser>;
}

export class FilesModule<TUser, TFile, TManifest> {
  private newRep = new Storage(this.opt.uploadDir, this.opt.userActor);
  private router = this.opt.router || Router();
  constructor(
    private rep: IFileRepository<TUser, TFile>,
    private opt: IOption<TUser, TFile, TManifest>
  ) {}

  init() {
    const { router, opt, rep, newRep } = this;
    router.get('/', opt.requireAuth(), async (req: Request, res, next) => {
      try {
        const user: TUser = opt.userActor.getUser(req);
        const files = await rep.findAllByUser(user);
        res.render('index', { user, files: files.map(f => opt.fileActor.toJSON(f, opt.fileActor.getUser(f))), manifest: opt.manifest });
      } catch (err) {
        next && next(err);
      }
    });

    router.get(
      '/files',
      opt.requireAuth(),
      async (req: Request, res, next) => {
        try {
          const user: TUser = opt.userActor.getUser(req);
          const userFiles = await rep.findAllByUser(user);
          const files = userFiles.map(f => opt.fileActor.toJSON(f, opt.fileActor.getUser(f)));
          if (req.xhr) {
            res.json(files).end();
          } else {
            res.render('files', { files });
          }
        } catch (err) {
          return next && next(err);
        }
      }
    );

    router.get(
      '/:user/files',
      opt.requireAuth(),
      async (req: Request, res, next) => {
        try {
          const user: TUser = opt.userActor.getUser(req);
          const userName = opt.userActor.getName(user);
          if (userName !== req.params.user) {
            if (req.xhr) {
              return res.status(401).json({ error: 'Unauthorize access' });
            } else {
              return res.redirect('/');
            }
          }
          const userFiles = await rep.findAllByUser(user);
          const files = userFiles.map(f => opt.fileActor.toJSON(f, opt.fileActor.getUser(f)));
          if (req.xhr) {
            res.json(files).end();
          } else {
            res.render('files', { files });
          }
        } catch (err) {
          return next && next(err);
        }
      }
    );

    router.post(
      '/file-upload',
      opt.requireAuth(),
      newRep.multer.single('file') as any,
      async (req: Request, res: Response) => {
        const { size, filename, mimetype } = req.file;
        const user: TUser = opt.userActor.getUser(req);
        const file = opt.fileActor.create(filename, user);
        await rep.save(file);

        res.json({
          size,
          filename,
          mimetype,
          url: opt.fileActor.url(file, user),
          id: opt.fileActor.getId(file)
        });
      }
    );

    router.post('/file-remove', opt.requireAuth(), async (req, res, next) => {
      const user: TUser = opt.userActor.getUser(req);
      const { fileid } = req.query;
      if (!fileid) {
        return next && next(new NotFound(`file can't delete`));
      }
      try {
        const file = await rep.findOneOrFail(fileid);
        opt.fileActor.setUser(file, user);

        const filePath = opt.fileActor.url(file, user, opt.uploadDir);
        await rep.removeByIdAndUser(fileid, user);
        await new Promise((resolve, reject) =>
          fs.unlink(filePath, err => (err ? reject(err) : resolve()))
        );
        res
          .status(200)
          .json({ ok: true })
          .end();
      } catch (err) {
        return next && next(err);
      }
    });

    return router;
  }
}

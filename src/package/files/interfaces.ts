import { Request } from 'express';

export interface IUserActor<TUser> {
  getUser(req: Request): TUser;
  get(user: TUser, field: 'name'): string;
}

export interface IFileRepository<TUser, TFile extends IFile<TUser>> {
  findAllByUser(user: TUser): Promise<TFile[]>;
  save(file: TFile): Promise<void>;
  createFile(name: string, user: TUser): TFile;
  toJSON(file: TFile): { id: number; name: string; url: string };
  findOneOrFail(fileid: number): Promise<TFile>;
  removeByIdAndUser(fileid: number, user: TUser): Promise<void>;
}
export interface IFile<TUser> {
  id: number;
  name: string;
  url(prefix?: string): string;
  user: TUser;
}

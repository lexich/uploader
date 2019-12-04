import { Request } from 'express';

export interface IUserActor<TUser> {
  getUser(req: Request): TUser;
  getName(user: TUser): string;
}

export interface IFileActor<TFile, TUser> {
  getName(file: TFile): string;
  getId(file: TFile): number;
  getUser(file: TFile): TUser;
  setUser(file: TFile, user: TUser): void;
  url(file: TFile, user: TUser, prefix?: string): string;
  create(name: string, user: TUser): TFile;
  toJSON(file: TFile, user: TUser): { id: number; name: string; url: string };
}

export interface IFileRepository<TUser, TFile> {
  findAllByUser(user: TUser): Promise<TFile[]>;
  save(file: TFile): Promise<void>;
  findOneOrFail(fileid: number): Promise<TFile>;
  removeByIdAndUser(fileid: number, user: TUser): Promise<void>;
}

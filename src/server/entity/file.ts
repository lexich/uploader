import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  ManyToOne,
  EntityRepository,
  Repository,
  Connection
} from 'typeorm';
import { User } from './user';

import { IFileRepository, IFileActor } from '../../package/files/interfaces';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, user => user.files)
  user!: User;

  /*
  url(prefix = '/media') {
    return `${prefix}/${this.user.name}/${this.name}`;
  }

  toJSON() {
    return { id: this.id, name: this.name, url: this.url() };
  }
  */
}



@EntityRepository(File)
export class FileRepository extends Repository<File> {
  async findAllByUser({ id }: User, limit = 200) {
    return this.createQueryBuilder('file')
      .leftJoinAndSelect('file.user', 'user')
      .where('user.id = :id', { id })
      .limit(limit)
      .getMany();
  }

  async findByIdAndUser(id: number, user: User) {
    return this.createQueryBuilder('file')
      .where('file.id = :id', { id })
      .leftJoinAndSelect('file.user', 'user')
      .andWhere('file.user.id = :id', { id: user.id })
      .getOne();
  }

  async removeByIdAndUser(id: number, user: User) {
    return this.delete({ id, user });
  }
}

export class FileActorImpl implements IFileActor<File, User> {
  getName(file: File): string {
    return file.name;
  }
  getId(file: File): number {
    return file.id;
  }
  getUser(file: File): User {
    return file.user;
  }
  setUser(file: File, user: User): void {
    file.user = user;
  }
  url(file: File, user: User, prefix = '/media'): string {
    return `${prefix}/${user.name}/${file.name}`;
  }
  create(name: string, user: User): File {
    const file = new File();
    file.name = name;
    file.user = user;
    return file;
  }
  toJSON(file: File, user: User): { id: number; name: string; url: string } {
    return { id: file.id, name: file.name, url: this.url(file, user) };
  }
}

export class FileRepositoryImpl implements IFileRepository<User, File> {
  private fileRepository = this.db.getCustomRepository(FileRepository);
  constructor(private db: Connection) {}

  async removeByIdAndUser(fileid: number, user: User): Promise<void> {
     this.fileRepository.removeByIdAndUser(fileid, user);
  }
  findOneOrFail(fileid: number): Promise<File> {
    return this.fileRepository.findOneOrFail(fileid);
  }

  async save(file: File): Promise<void> {
    await this.db.manager.save(file);
  }

  findAllByUser(user: User): Promise<File[]> {
    return this.fileRepository.findAllByUser(user);
  }
}

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

import { IFileRepository } from '../../package/files/interfaces';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, user => user.files)
  user!: User;

  url(prefix = '/media') {
    return `${prefix}/${this.user.name}/${this.name}`;
  }

  toJSON() {
    return { id: this.id, name: this.name, url: this.url() };
  }
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

export class FileRepositoryImpl implements IFileRepository<User, File> {

  private fileRepository = this.db.getCustomRepository(FileRepository);
  constructor(private db: Connection) {}

  async removeByIdAndUser(fileid: number, user: User): Promise<void> {
    await this.fileRepository.removeByIdAndUser(fileid, user);
  }
  findOneOrFail(fileid: number): Promise<File> {
    return this.fileRepository.findOneOrFail(fileid);
  }
  toJSON(file: File) {
    return file.toJSON();
  }

  createFile(name: string, user: User): File {
    const file = new File();
    file.name = name;
    file.user = user;
    return file;
  }

  async save(file: File): Promise<void> {
    await this.db.manager.save(file);
  }

  findAllByUser(user: User): Promise<File[]> {
    return this.fileRepository.findAllByUser(user);
  }
}

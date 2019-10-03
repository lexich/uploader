import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  ManyToOne,
  EntityRepository,
  Repository
} from 'typeorm';
import { User } from './user';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, user => user.files)
  user!: User;

  url(prefix = 'media') {
    return `/${prefix}/${this.user.name}/${this.name}`;
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

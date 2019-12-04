import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  Repository,
  EntityRepository,
  BeforeInsert,
  OneToMany,
  Connection
} from 'typeorm';
import { createHmac } from 'crypto';
import { Min, Max } from 'class-validator';
import { File } from './file';
import { IUserRepository, InvalidLoginError } from '@uploader/auth';
import { IUserActor } from '@uploader/files';
import { Request } from 'express';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 20,
    unique: true
  })
  @Min(3)
  @Max(20)
  name!: string;

  @Column({
    length: 20,
    select: false
  })
  @Min(8)
  @Max(20)
  password!: string;

  @OneToMany(() => File, file => file.user, {
    lazy: true
  })
  files!: Promise<File[]>;

  @BeforeUpdate()
  @BeforeInsert()
  async encryptPassword() {
    if (this.password) {
      this.password = createHmac('sha256', this.password).digest('hex');
    }
  }
}

export class UserActorImpl implements IUserActor<User> {
  getUser(req: Request): User {
    if (!req.user) {
      throw new InvalidLoginError('Not authorize access');
    }
    return req.user as User;
  }
  getName(user: User): string {
    return user.name;
  }
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findUser(name: string, password: string) {
    const hash = createHmac('sha256', password).digest('hex');
    return this.findOne({ name, password: hash });
  }

  async findUserWithFiles(name: string) {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.files', 'files')
      .where('user.name = :name', { name })
      .getOne();
  }
}
export class UserRepositoryAuth implements IUserRepository<User> {
  create(id?: number): User {
    const user = new User();
    if (id !== undefined) {
      user.id = id;
    }
    return user;
  }
  toPlainObject(user: User) {
    return { id: user.id, name: user.name };
  }
  constructor(private db: Connection) {}
  async findOne(id: number): Promise<User> {
    const user = await this.db.getCustomRepository(UserRepository).findOne(id);
    if (!user) {
      return Promise.reject(
        new InvalidLoginError(`User with id=${id} wasn't found`)
      );
    }
    return user;
  }
  async findUser(name: string, password: string): Promise<User> {
    const user = await this.db
      .getCustomRepository(UserRepository)
      .findUser(name, password);
    if (!user) {
      return Promise.reject(
        new InvalidLoginError(
          `User with name=${name} and password=*** wasn't found`
        )
      );
    }
    return user;
  }
}


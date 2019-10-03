import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  Repository,
  EntityRepository,
  BeforeInsert,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { createHmac } from 'crypto';
import { Min, Max } from 'class-validator';
import { File } from './file';

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
      .getOne()
  }
}

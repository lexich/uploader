import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  Repository,
  EntityRepository,
  BeforeInsert,
} from 'typeorm';
import { createHmac } from 'crypto';
import { Min, Max } from 'class-validator';

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
}

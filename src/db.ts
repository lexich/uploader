import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { User, UserRepository } from './entity/user';

export function connect(dbPath: string) {
  return createConnection({
    type: 'sqlite',
    database: dbPath,
    synchronize: true,
    logging: false,
    entities: [User]
  });
}

export async function initAdminUser(db: Connection) {
  const userRepository = db.getCustomRepository(UserRepository);
  // create demo user if isn't created
  const findAdminUser = await userRepository.findOne({ name: 'admin' });
  if (!findAdminUser) {
    const admin = new User();
    admin.name = 'admin';
    admin.password = 'admin';
    await userRepository.save(admin);
  }
}


export function connectHelper(name: string) {
  const dbPath = path.join(__dirname, 'tmp', name + '.db');
  return connect(dbPath).then(db => {
    return {
      db,
      async drop() {
        await db.dropDatabase();
        await db.close();
        await new Promise(resolve => fs.unlink(dbPath, () => resolve()));
      }
    };
  });
}

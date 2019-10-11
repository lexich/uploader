import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { User, UserRepository } from './entity/user';
import { File } from './entity/file';
import { Session } from './entity/session';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export function connect(
  dbPath: string,
  connectionOptions?: Partial<SqliteConnectionOptions>
) {
  return createConnection({
    type: 'sqlite',
    database: dbPath,
    synchronize: true,
    logging: false,
    entities: [User, File, Session],
    ...connectionOptions
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

export function connectHelper(name: string, connectionOptions?: Partial<SqliteConnectionOptions>) {
  const dbPath = name === ':memory:' ? name : path.join(__dirname, '..', '..', 'db', name + '.db');
  return connect(dbPath, connectionOptions).then(db => {
    return {
      db,
      dbPath,
      async drop() {
        await db.dropDatabase();
        await db.close();
        if (dbPath !== ':memory:') {
          await new Promise(resolve => fs.unlink(dbPath, () => resolve()));
        }
      }
    };
  });
}

import { connectHelper } from '../../db';
import { Connection } from 'typeorm';
import { validate } from 'class-validator';
import { User, UserRepository } from '../user';

let db: Connection;
let drop: () => Promise<void>;
beforeAll(async () => {
    const res = await connectHelper('user.test');
    db = res.db;
    drop = res.drop;
});

afterAll(async () => {
    await drop();
});

describe('User', () => {
    test('create and find', async () => {
        const user = new User();
        user.name = 'test';
        user.password = '1234';
        expect(user.id).toBeUndefined();
        await db.manager.save(user);
        expect(user.id).not.toBeUndefined();
        expect(user.password).not.toBe('1234');
        const findUser = await db.manager.findOne(User, user.id);
        expect(findUser).not.toBeUndefined();
        expect(findUser!.name).toBe(user!.name);
        expect(findUser!.password).toBeUndefined();
    });
    test('findUser', async () => {
        const userRepository = db.getCustomRepository(UserRepository);
        const user = new User();
        user.name = 'test2';
        user.password = '1234';
        await userRepository.save(user);
        const findUserByName = await userRepository.findUser(user.name, '1234');
        expect(findUserByName).not.toBeUndefined();
        const notfindUserByName = await userRepository.findUser(user.name, '8888');
        expect(notfindUserByName).toBeUndefined();
    });

    test('delete', async () => {
        const userRepository = db.getCustomRepository(UserRepository);
        const user = new User();
        user.name = 'test3';
        user.password = '1234';
        await userRepository.save(user);
        const findUser = await userRepository.findOne(user.id)
        expect(findUser).not.toBeUndefined();

        await userRepository.delete(user);
        const notFindUser = await userRepository.findOne(user.id);
        expect(notFindUser).toBeUndefined();
    });

    test('test unique name', async () => {
        const user1 = new User();
        user1.name = 'user';
        user1.password = '1234';
        await db.manager.save(user1);

        const user2 = new User();
        user2.name = 'user';
        user2.password = '1234';
        let error: Error | undefined;
        try {
            await db.manager.save(user2);
        } catch (err) {
            error = err;
        }
        expect(error).not.toBeUndefined();
        expect(error!.message).toBe('SQLITE_CONSTRAINT: UNIQUE constraint failed: user.name')
    });

    test('validation', async () => {
        const user = new User();
        const error = await validate(user);
        expect(error.length).toBe(2);
        expect(error[0].property).toBe('name');
        expect(error[1].property).toBe('password');
    })
});

